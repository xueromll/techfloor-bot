import concurrent.futures, json, random, time, urllib.request, urllib.error
from common import *

db = start()
wipe()
wipe("room_bookings", "blocks")
sql("UPDATE people SET hidden = 0")
SCALE = 10
ACTION_LIMIT = 20 * SCALE
FAIL_LIMIT = 30 * SCALE
STRIKES = 20
ROOM_CAP = 3

def raw(path, data, headers):
    req = urllib.request.Request(B + path, data=data, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req) as r: return r.status, r.read().decode(), r.headers
    except urllib.error.HTTPError as e: return e.code, e.read().decode(), e.headers

def flood(n, fn):
    with concurrent.futures.ThreadPoolExecutor(16) as pool:
        return list(pool.map(lambda _: fn(), range(n)))

def mine(d): return [b for b in d["room"]["bookings"] if b["mine"]]

def drop_stale_dev_connection(): http("/")

print("--- тело запроса: слишком большое, мусор и не-объект")
uid, X = fresh("Проверка")
assert api(X)[0] == 200
st, body, h = raw("/api/action", b"x" * (9 * 1024), {"X-Init-Data": X, "Content-Type": "application/json"}); assert st == 413, (st, body)
st, body, h = raw("/api/action", iter([b"x" * 4096] * 3), {"X-Init-Data": X, "Content-Type": "application/json"}); assert st == 413, (st, body)
drop_stale_dev_connection()
for junk in (b"{", b"[]", b"null", b'"take"', b"42"):
    st, body, h = raw("/api/action", junk, {"X-Init-Data": X, "Content-Type": "application/json"}); assert st == 400, (junk, st, body)
st, d = api(X, {"action": "constructor"}); assert st == 400, (st, d)
st, d = api(X, {"action": ["take"]}); assert st == 400, (st, d)
assert h["X-Content-Type-Options"] == "nosniff" and h["Cache-Control"] == "no-store", dict(h)

print("--- подпись: огромный initData и нечисловой auth_date")
st, d = api("a=" + "x" * 5000); assert st == 401, (st, d)
user = json.dumps({"id": 2, "first_name": "Боря"}, ensure_ascii=False)
st, d = api(sign({"auth_date": "abc", "start_param": str(CH), "user": user})); assert st == 401 and "устарела" in err(d), (st, d)

print("--- флуд действиями: после лимита 429, остальным не мешает")
uid, Y = fresh("Флудер")
assert api(Y)[0] == 200
codes = flood(ACTION_LIMIT, lambda: api(Y, {"action": "nope"})[0]); assert codes.count(400) == ACTION_LIMIT, sorted(set(codes))
st, body, h = raw("/api/action", b'{"action": "nope"}', {"X-Init-Data": Y, "Content-Type": "application/json"})
assert st == 429 and "Слишком много" in json.loads(body)["error"] and int(h["Retry-After"]) > 0, (st, body)
assert api(VOVA)[0] == 200
assert api(Y)[0] == 200, "лимит действий закрыл и просмотр"
assert one("SELECT COUNT(*) FROM blocks WHERE user_id = ?", uid) == 0

print("--- кто продолжает долбить, получает временную блокировку")
codes = flood(STRIKES + 5, lambda: api(Y, {"action": "nope"})[0]); assert set(codes) <= {429, 403} and 403 in codes, codes
st, d = api(Y); assert st == 403 and "приостановлен" in err(d), (st, d)
reason, until = rows("SELECT reason, until FROM blocks WHERE chat_id = ? AND user_id = ?", CH, uid)[0]
assert reason == "flood" and abs(until - (time.time() + 30 * 60)) < 120, (reason, until)
assert api(VOVA)[0] == 200

print("--- подбор секретов с одного IP: /setup и вебхук закрываются, другим IP и настоящим пользователям — нет")
n = random.randrange(1 << 16)
H = {"CF-Connecting-IP": f"198.18.{n >> 8}.{n & 255}"}
codes = flood(FAIL_LIMIT, lambda: http("/api/state", None, {**H, "X-Init-Data": "hash=" + "0" * 64})[0]); assert set(codes) == {401}, set(codes)
st, txt = http("/setup?key=" + SECRET, None, H); assert st == 429, (st, txt)
st, txt = http("/telegram", {"update_id": 1}, {**H, "X-Telegram-Bot-Api-Secret-Token": SECRET}); assert st == 429, (st, txt)
st, d = http("/api/state", None, {**H, "X-Init-Data": VOVA}); assert st == 200, (st, d)
st, txt = http("/setup?key=" + SECRET); assert st == 200, (st, txt)
stale = init(2, "Боря", None, age=25 * 3600)
H2 = {"CF-Connecting-IP": f"198.19.{n >> 8}.{n & 255}"}
codes = flood(FAIL_LIMIT + 5, lambda: http("/api/state", None, {**H2, "X-Init-Data": stale})[0]); assert set(codes) == {401}, set(codes)
st, txt = http("/setup?key=" + SECRET, None, H2); assert st == 200, ("устаревшие сессии закрыли IP", st, txt)

print("--- игровая: у участника не больше 3 активных броней, у админа без лимита")
uid, PZ = fresh("Зоя", start=f"{CH}_p")
st, d = api(PZ); days = d["room"]["days"]; tom = days[1]["start"]
for h in range(ROOM_CAP):
    st, d = api(PZ, {"action": "room_book", "starts": tom + (10 + 2 * h) * 3600, "ends": tom + (11 + 2 * h) * 3600}); assert st == 200, d
st, d = api(PZ, {"action": "room_book", "starts": tom + 20 * 3600, "ends": tom + 21 * 3600}); assert "максимум" in err(d), d
assert len(mine(api(PZ)[1])) == ROOM_CAP
for h in range(ROOM_CAP + 1):
    st, d = api(PANYA, {"action": "room_book", "starts": days[2]["start"] + (10 + 2 * h) * 3600, "ends": days[2]["start"] + (11 + 2 * h) * 3600}); assert st == 200, d

print("--- игровая: частые брони и отмены упираются в лимит")
uid, PW = fresh("Вера", start=f"{CH}_p")
slot = {"action": "room_book", "starts": days[3]["start"] + 12 * 3600, "ends": days[3]["start"] + 13 * 3600}
for i in range(3):
    st, d = api(PW, slot); assert st == 200, d
    st, d = api(PW, {"action": "room_cancel", "id": mine(d)[0]["id"]}); assert st == 200, d
st, d = api(PW, slot); assert st == 429 and "Слишком часто" in err(d), (st, d)
assert mine(api(PW)[1]) == []

print("--- уведомления: один человек не может засыпать другого")
uid, NX = fresh("Шутник")
assert api(NX)[0] == 200
wipe("machines")
before = len(sent())
for i in range(4):
    st, d = api(NX, {"action": "take", "t": "w", "n": 1, "time": "40", "owner": 4}); assert st == 200, d
    st, d = api(NX, {"action": "free", "t": "w", "n": 1}); assert st == 200, d
pings = [x for x in sent()[before:] if f"tg://user?id={uid}" in x["text"]]
assert len(pings) == 5, [x["text"] for x in pings]

print("--- /start в личке: не больше 5 ответов в минуту")
spammer = FRESH_UID + random.randrange(10 ** 9)
before = len(sent())
for i in range(8):
    update({"message": {"message_id": 10 + i, "text": "/start", "from": {"id": spammer, "first_name": "Спамер"}, "chat": {"id": spammer, "type": "private"}}})
assert len([x for x in sent()[before:] if x["chat_id"] == spammer]) == 5

print("--- команды в группе работают только у админов, в том числе анонимных")
st, d = hook("/board", chat=SPARE_CH, sender={"id": 2, "first_name": "Боря"}); assert st == 200, d
assert rows("SELECT 1 FROM boards WHERE chat_id = ?", SPARE_CH) == [], "участник поставил доску"
hook("/board", chat=SPARE_CH, sender={"id": 1087968824, "first_name": "Group", "is_bot": True}, sender_chat={"id": SPARE_CH, "type": "supergroup"})
assert rows("SELECT 1 FROM boards WHERE chat_id = ?", SPARE_CH) == [(1,)], "анонимный админ не смог поставить доску"
sql("DELETE FROM boards WHERE chat_id = ?", SPARE_CH)

print("--- /block ответом на сообщение: доступ закрыт, очередь и брони сняты")
handle = f"bad{random.randrange(10 ** 8)}"
uid, BAD = fresh("Нарушитель", handle)
PBAD = init(uid, "Нарушитель", handle, start=f"{CH}_p")
st, d = api(BAD); slots = d["slots"]
st, d = api(BAD, {"action": "book", "t": "w", "at": slots[3]}); assert st == 200, d
st, d = api(PBAD, {"action": "room_book", "starts": days[4]["start"] + 9 * 3600, "ends": days[4]["start"] + 10 * 3600}); assert st == 200, d
said = {"message_id": 3, "text": "спам", "from": {"id": uid, "first_name": "Нарушитель", "username": handle}, "chat": {"id": CH, "type": "supergroup"}}
hook("/block", sender={"id": 2, "first_name": "Боря"}, reply_to_message=said)
assert rows("SELECT 1 FROM blocks WHERE chat_id = ? AND user_id = ?", CH, uid) == [], "участник заблокировал участника"
hook("/block", reply_to_message=said)
assert rows("SELECT reason, until, by_id FROM blocks WHERE chat_id = ? AND user_id = ?", CH, uid) == [("admin", None, ADMIN_UID)]
st, d = api(BAD); assert st == 403 and "закрыл" in err(d), (st, d)
st, d = api(PBAD, {"action": "room_book", "starts": days[5]["start"] + 9 * 3600, "ends": days[5]["start"] + 10 * 3600}); assert st == 403, (st, d)
assert one("SELECT COUNT(*) FROM bookings WHERE user_id = ?", uid) == 0
assert one("SELECT COUNT(*) FROM room_bookings WHERE user_id = ?", uid) == 0

print("--- /blocked показывает список, /unblock @username возвращает доступ")
before = len(sent())
hook("/blocked")
assert any(f"id {uid}" in x["text"] for x in sent()[before:]), sent()[before:]
hook(f"/unblock @{handle}")
assert rows("SELECT 1 FROM blocks WHERE chat_id = ? AND user_id = ?", CH, uid) == []
assert api(BAD)[0] == 200

print("--- /block id со сроком; админа заблокировать нельзя")
hook(f"/block {uid} 2h")
until = one("SELECT until FROM blocks WHERE chat_id = ? AND user_id = ?", CH, uid); assert abs(until - (time.time() + 7200)) < 120, until
st, d = api(BAD); assert st == 403 and " до " in err(d), (st, d)
hook("/block", reply_to_message={**said, "from": {"id": 2, "first_name": "Боря"}}, sender={"id": 2, "first_name": "Боря"})
hook("/block", reply_to_message={**said, "from": {"id": ADMIN_UID, "first_name": "Аня", "username": "anya"}})
before = len(sent())
hook("/block", sender={"id": 1087968824, "first_name": "Group", "is_bot": True}, sender_chat={"id": CH, "type": "supergroup"},
     reply_to_message={**said, "from": {"id": ADMIN_UID, "first_name": "Аня", "username": "anya"}})
assert any("Админу чата" in x["text"] for x in sent()[before:]), sent()[before:]
assert rows("SELECT 1 FROM blocks WHERE chat_id = ? AND user_id IN (?, ?)", CH, ADMIN_UID, 2) == []
hook(f"/unblock {uid}")
assert api(BAD)[0] == 200

wipe()
wipe("room_bookings", "blocks")
print("ABUSE TESTS OK")
