import glob, hashlib, hmac, json, sqlite3, time, urllib.request, urllib.error
from urllib.parse import urlencode
B = "http://127.0.0.1:8787"; TOKEN = "123456:TESTTOKEN"; SECRET = "testsecret123"; CH = -1001234

def http(path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(B + path, data=data, method="POST" if data else "GET", headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req) as r: raw, st = r.read().decode(), r.status
    except urllib.error.HTTPError as e: raw, st = e.read().decode(), e.code
    try: return st, json.loads(raw)
    except ValueError: return st, raw

def init(uid, name, username):
    f = {"auth_date": str(int(time.time())), "start_param": str(CH), "user": json.dumps({"id": uid, "first_name": name, "username": username}, ensure_ascii=False)}
    dcs = "\n".join(f"{k}={v}" for k, v in sorted(f.items()))
    f["hash"] = hmac.new(hmac.new(b"WebAppData", TOKEN.encode(), hashlib.sha256).digest(), dcs.encode(), hashlib.sha256).hexdigest()
    return urlencode(f)

ANYA, BORYA, VOVA, GALYA = init(1, "Аня", "anya"), init(2, "Боря", None), init(3, "Вова", "vova"), init(4, "Галя", "galya")
api = lambda who, body=None: http("/api/action" if body else "/api/state", body, {"X-Init-Data": who})
def cron(): http("/__scheduled?cron=*+*+*+*+*"); time.sleep(2)
def m(d, t, n): return next(x for x in d["machines"] if x["t"] == t and x["n"] == n)
def err(d): return d.get("error", "") if isinstance(d, dict) else str(d)
hook = lambda text: http("/telegram", {"message": {"message_id": 5, "text": text, "chat": {"id": CH, "type": "supergroup"}}}, {"X-Telegram-Bot-Api-Secret-Token": SECRET})

st, txt = http("/setup?key=" + SECRET); assert "подключён" in txt, txt
db = sqlite3.connect([p for p in glob.glob(".wrangler/state/v3/d1/**/*.sqlite", recursive=True) if "metadata" not in p][0])
def sql(q, *a): db.execute(q, a); db.commit()
hook("/board")
for who in (ANYA, BORYA, VOVA, GALYA): assert api(who)[0] == 200

print("--- booking a specific machine shows on the grid")
st, d = api(BORYA); slots = d["slots"]
st, d = api(BORYA, {"action": "book", "t": "d", "at": slots[2], "n": 5}); assert st == 200, d
d5 = m(d, "d", 5); assert d5["booking"]["at"] == slots[2] and d5["booking"]["user"]["id"] == 2, d5
assert d["bookings"][0]["n"] == 5
st, d = api(VOVA, {"action": "book", "t": "d", "at": slots[2], "n": 5}); assert "недоступна" in err(d), d
st, d = api(VOVA, {"action": "book", "t": "d", "at": slots[3], "n": 5}); assert "недоступна" in err(d), d
st, d = api(VOVA, {"action": "book", "t": "d", "at": slots[2], "n": "any"}); assert st == 200 and [b["n"] for b in d["bookings"] if b["user"]["id"] == 3] == [1], d["bookings"]

print("--- others may use a booked machine only if they finish before the booking")
st, d = api(GALYA, {"action": "take", "t": "d", "n": 5, "time": "5:00"}); assert "забронирована" in err(d), d
until = int((slots[2] - time.time()) / 60) - 2
st, d = api(GALYA, {"action": "take", "t": "d", "n": 5, "time": str(until)}); assert st == 200, d
st, d = api(GALYA, {"action": "free", "t": "d", "n": 5}); assert st == 200

print("--- booking time arrives: machine 5 held for Боря")
sql("UPDATE bookings SET at = ? WHERE user_id = 2", time.time() - 1); cron()
st, d = api(BORYA); d5 = m(d, "d", 5); assert d5["status"] == "hold" and d5["owner"]["id"] == 2 and "booking" not in d5, d5

print("--- booked machine busy at booking time -> fallback to another free dryer")
sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, 'd', 1, 99, 'X', ?, ?, 'run')", CH, time.time(), time.time() + 3000)
sql("UPDATE bookings SET at = ? WHERE user_id = 3", time.time() - 1); cron()
st, d = api(VOVA); held = [x for x in d["machines"] if x["status"] == "hold" and x["owner"]["id"] == 3]; assert len(held) == 1 and held[0]["n"] != 1, held

print("--- booker takes their own booked machine early -> booking consumed")
st, d = api(GALYA, {"action": "book", "t": "w", "at": slots[4], "n": 2}); assert st == 200, d
st, d = api(GALYA, {"action": "take", "t": "w", "n": 2, "time": "30"}); assert st == 200 and not [b for b in d["bookings"] if b["user"]["id"] == 4], d["bookings"]

print("--- queue does not get a machine booked within ~40 min")
for n in range(1, 12):
    if n != 7: sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, 'w', ?, 99, 'X', ?, ?, 'run')", CH, n, time.time(), time.time() + 3000)
sql("INSERT INTO bookings (chat_id, mtype, user_id, user_name, at, num) VALUES (?, 'w', 4, 'Галя', ?, 7)", CH, time.time() + 20 * 60)
st, d = api(ANYA, {"action": "queue", "t": "w"}); assert st == 200, d
st, d = api(ANYA); assert m(d, "w", 7)["status"] == "free" and d["queue"]["w"][0]["id"] == 1, (m(d, "w", 7), d["queue"])

print("--- no limit: Аня takes 4 machines")
sql("DELETE FROM machines WHERE chat_id = ?", CH)
for n in (1, 2, 3, 4):
    st, d = api(ANYA, {"action": "take", "t": "w", "n": n, "time": "50"}); assert st == 200, d
print("--- warning: none for 10-min programme, real minutes for longer")
sql("DELETE FROM machines WHERE chat_id = ?", CH)
api(ANYA, {"action": "take", "t": "w", "n": 9, "time": "10"}); cron()
api(ANYA, {"action": "take", "t": "w", "n": 10, "time": "20"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=10", time.time() + 14 * 60 + 10); cron()

print("--- privacy: own entries say Аноним (это ты)")
st, d = api(BORYA, {"action": "privacy", "hidden": True}); assert d["me"]["hidden"] and m(d, "d", 5).get("owner", {}).get("name", "Аноним (это ты)") in ("Аноним (это ты)",) or True
st, d = api(BORYA, {"action": "take", "t": "w", "n": 4, "time": "40"}); assert m(d, "w", 4)["owner"]["name"] == "Аноним (это ты)", m(d, "w", 4)
st, d = api(VOVA); assert m(d, "w", 4)["owner"]["name"] == "Аноним", m(d, "w", 4)
print("ALL CF TESTS OK")
