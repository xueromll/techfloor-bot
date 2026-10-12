from common import *

db = start()
wipe()

def web(path, body=None, cookie=None, origin=None):
    headers = {"Content-Type": "application/json", **({"Cookie": cookie} if cookie else {}), **({"Origin": origin} if origin else {})}
    req = urllib.request.Request(B + path, data=None if body is None else json.dumps(body).encode(), method="GET" if body is None else "POST", headers=headers)
    try:
        with urllib.request.urlopen(req) as r: raw, st, h = r.read().decode(), r.status, r.headers
    except urllib.error.HTTPError as e: raw, st, h = e.read().decode(), e.code, e.headers
    return st, json.loads(raw), h.get("Set-Cookie")

def say(uid, text, name="Веб", username=None):
    sender = {"id": uid, "first_name": name, **({"username": username} if username else {})}
    return update({"message": {"message_id": 900, "text": text, "from": sender, "chat": {"id": uid, "type": "private"}}})

def link(uid, text="/login", **who):
    say(uid, text, **who)
    msg = [x for x in sent() if x["chat_id"] == uid][-1]
    url = msg["markup"]["inline_keyboard"][0][0]["url"] if msg.get("markup") else None
    return msg["text"], url and url.split("#login=", 1)[1], url

def enter(token, **kw):
    st, d, c = web("/api/login", {"token": token}, **kw)
    return st, d, c and c.split(";")[0]

uid = FRESH_UID + random.randrange(10 ** 9)

print("--- /login присылает одноразовую ссылку на сайт, по ней ставится сессия")
text, token, url = link(uid, username="webuser")
assert token and "один раз" in text and url.startswith(B + "/#login="), (text, url)
st, d, c = web("/api/login", {"token": token}); assert st == 200 and c, (st, d, c)
assert "HttpOnly" in c and "SameSite=Strict" in c and "Path=/api" in c, c
session = c.split(";")[0]
assert one("SELECT COUNT(*) FROM sessions WHERE id = ?", session.split("=", 1)[1]) == 0, "в базе лежит сам токен, а не его хеш"
st, d, _ = web("/api/state", cookie=session); assert st == 200 and d["me"]["id"] == uid and d["me"]["username"] == "webuser", (st, d)
st, d, _ = web("/api/action", {"action": "take", "t": "w", "n": 1, "time": "40"}, cookie=session); assert st == 200, (st, d)
assert m(d, "w", 1)["owner"]["id"] == uid, m(d, "w", 1)
assert one("SELECT action FROM events WHERE actor_id = ? ORDER BY id DESC LIMIT 1", uid) == "take"

print("--- ссылка одноразовая, просроченная и мусорная не работают")
st, d, _ = enter(token); assert st == 401 and "/login" in err(d) and d.get("bot") == "technical_floor_bot", (st, d)
text, token2, _ = link(uid, "/start login"); assert token2, text
sql("UPDATE sessions SET expires_at = ? WHERE kind = 'link' AND user_id = ?", time.time() - 1, uid)
st, d, _ = enter(token2); assert st == 401, (st, d)
st, d, _ = enter("x"); assert st == 401, (st, d)
st, d, _ = web("/api/login", {}); assert st == 401, (st, d)

print("--- вход со страницы чужого сайта отклоняется и не тратит ссылку")
_, token3, _ = link(uid)
st, d, _ = enter(token3, origin="https://evil.example"); assert st == 403, (st, d)
st, d, second = enter(token3, origin=B); assert st == 200 and second, (st, d)

print("--- без куки, с мусорной и с чужой кукой не пускают")
st, d, _ = web("/api/state"); assert st == 401 and "через Telegram" in err(d), (st, d)
st, d, _ = web("/api/state", cookie="session=" + "A" * 43); assert st == 401 and "/login" in err(d), (st, d)
st, d, _ = web("/api/state", cookie="session=junk"); assert st == 401, (st, d)

print("--- initData из Telegram важнее куки")
st, d = http("/api/state", headers={"X-Init-Data": BORYA, "Cookie": session}); assert st == 200 and d["me"]["id"] == 2, (st, d)

print("--- /block закрывает сайт, /login объясняет почему, /unblock возвращает")
hook(f"/block {uid} 2h")
st, d, _ = web("/api/state", cookie=session); assert st == 403 and "закрыл" in err(d), (st, d)
text, tok, _ = link(uid); assert tok is None and "закрыл" in text, text
hook(f"/unblock {uid}")
st, d, _ = web("/api/state", cookie=session); assert st == 200, (st, d)

print("--- не участник чата ссылку не получает")
text, tok, _ = link(OUTSIDER_UID); assert tok is None and "Не нашёл" in text, text

print("--- в группе /login ссылку не присылает")
before = len(sent())
hook("/login")
assert not [x for x in sent()[before:] if "login" in json.dumps(x.get("markup"))], sent()[before:]

print("--- выход удаляет только эту сессию, истёкшая сессия не работает")
st, d, c = web("/api/logout", {}, cookie=session); assert st == 200 and "Max-Age=0" in c, (st, c)
st, d, _ = web("/api/state", cookie=session); assert st == 401, (st, d)
st, d, _ = web("/api/state", cookie=second); assert st == 200, (st, d)
sql("UPDATE sessions SET expires_at = ? WHERE kind = 'web' AND user_id = ?", time.time() - 1, uid)
st, d, _ = web("/api/state", cookie=second); assert st == 401 and "/login" in err(d), (st, d)

print("--- страница сайта отдаётся статикой")
with urllib.request.urlopen(B + "/") as r: assert "/api/login" in r.read().decode()

wipe()
print("WEB TESTS OK")
