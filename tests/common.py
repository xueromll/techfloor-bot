import glob, hashlib, hmac, json, random, sqlite3, sys, threading, time, urllib.request, urllib.error
from urllib.parse import urlencode

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

B = "http://127.0.0.1:8787"
TOKEN = "123456:TESTTOKEN"
OTHER_TOKEN = "654321:OTHERBOTTOKEN"
SECRET = "testsecret123"
CH = -1001234
SPARE_CH = -1009999
FOREIGN_CH = -1005555
ADMIN_UID = 1
DM_BLOCKED_UID = 3
OUTSIDER_UID = 9
FRESH_UID = 100000
BAD_THREAD = 999
CRON_TIMEOUT = 20

db = None
updates = [1000]
lock = threading.Lock()

def http(path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(B + path, data=data, method="POST" if data else "GET", headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req) as r: raw, st = r.read().decode(), r.status
    except urllib.error.HTTPError as e: raw, st = e.read().decode(), e.code
    try: return st, json.loads(raw)
    except ValueError: return st, raw

def sign(fields, token=TOKEN, tamper=None):
    f = {k: v for k, v in fields.items() if v is not None}
    dcs = "\n".join(f"{k}={v}" for k, v in sorted(f.items()))
    f["hash"] = hmac.new(hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest(), dcs.encode(), hashlib.sha256).hexdigest()
    if tamper: f.update(tamper)
    return urlencode(f)

def init(uid, name, username, start=CH, token=TOKEN, age=0, auth_date=True, tamper=None):
    user = json.dumps({"id": uid, "first_name": name, "username": username}, ensure_ascii=False)
    fields = {"auth_date": str(int(time.time()) - age) if auth_date else None, "start_param": None if start is None else str(start), "user": user}
    return sign(fields, token, tamper)

ANYA, BORYA, VOVA, GALYA = init(1, "Аня", "anya"), init(2, "Боря", None), init(3, "Вова", "vova"), init(4, "Галя", "galya")
PANYA, PBORYA = init(1, "Аня", "anya", start=f"{CH}_p"), init(2, "Боря", None, start=f"{CH}_p")

def api(who, body=None): return http("/api/action" if body else "/api/state", body, {"X-Init-Data": who})

def update(payload, secret=SECRET):
    with lock:
        updates[0] += 1
        n = updates[0]
    return http("/telegram", {"update_id": n, **payload}, {} if secret is None else {"X-Telegram-Bot-Api-Secret-Token": secret})

ADMIN = {"id": ADMIN_UID, "first_name": "Аня", "username": "anya"}

def hook(text, secret=SECRET, chat=CH, sender=ADMIN, **extra):
    return update({"message": {"message_id": 5, "text": text, "from": sender, "chat": {"id": chat, "type": "supergroup"}, **extra}}, secret)

def topic(text, th, chat=CH, sender=ADMIN):
    return update({"message": {"message_id": 7, "text": text, "from": sender, "message_thread_id": th, "is_topic_message": True, "chat": {"id": chat, "type": "supergroup", "is_forum": True}}})

def tap(bid, what, uid):
    return update({"callback_query": {"id": "cb1", "data": f"r{what}:{bid}", "from": {"id": uid, "first_name": "X"}, "message": {"message_id": 500, "chat": {"id": uid, "type": "private"}}}})

def connect():
    global db
    if db is None:
        path = [p for p in glob.glob(".wrangler/state/v3/d1/**/*.sqlite", recursive=True) if "metadata" not in p][0]
        db = sqlite3.connect(path, timeout=15)
    return db

def start():
    st, txt = http("/setup?key=" + SECRET)
    assert "подключён" in txt, txt
    connect()
    hook("/board")
    for who in (ANYA, BORYA, VOVA, GALYA): assert api(who)[0] == 200
    return db

def sql(q, *a):
    db.execute(q, a)
    db.commit()

def rows(q, *a):
    db.commit()
    return db.execute(q, a).fetchall()

def one(q, *a):
    got = rows(q, *a)
    return got[0][0] if got else None

LAUNDRY_TABLES = ("machines", "queue", "nexts", "bookings", "moved")

def wipe(*tables):
    for t in tables or LAUNDRY_TABLES: db.execute(f"DELETE FROM {t}")
    db.commit()

def cron(timeout=CRON_TIMEOUT):
    before = one("SELECT value FROM meta WHERE key = 'cron_done'")
    http("/__scheduled?cron=*+*+*+*+*")
    deadline = time.time() + timeout
    while time.time() < deadline:
        if one("SELECT value FROM meta WHERE key = 'cron_done'") != before: return
        time.sleep(0.02)
    raise AssertionError(f"таймер не отработал за {timeout} с")

def parallel(*calls):
    out = [None] * len(calls)
    gate = threading.Barrier(len(calls))
    def run(i, fn):
        gate.wait()
        try: out[i] = fn()
        except Exception as e: out[i] = (0, repr(e))
    threads = [threading.Thread(target=run, args=(i, fn)) for i, fn in enumerate(calls)]
    for t in threads: t.start()
    for t in threads: t.join()
    return out

def fresh(name, username=None, start=CH):
    uid = FRESH_UID + random.randrange(10 ** 9)
    return uid, init(uid, name, username, start=start)

def sent():
    with urllib.request.urlopen("http://127.0.0.1:8799/sent") as r: return json.loads(r.read().decode())

def m(d, t, n): return next(x for x in d["machines"] if x["t"] == t and x["n"] == n)
def err(d): return d.get("error", "") if isinstance(d, dict) else str(d)
