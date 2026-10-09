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
for i in range(6):
    st, d = api(NX, {"action": "take", "t": "w", "n": 1, "time": "40", "owner": "unknown"}); assert st == 200, d
    st, d = api(GALYA, {"action": "claim", "t": "w", "n": 1}); assert st == 200 and m(d, "w", 1)["owner"]["id"] == 4, d
    st, d = api(NX, {"action": "free", "t": "w", "n": 1}); assert st == 200, d
pings = [x for x in sent()[before:] if f"tg://user?id={uid}" in x["text"]]
assert len(pings) == 5, [x["text"] for x in pings]

print("--- /start в личке: не больше 5 ответов в минуту")
spammer = FRESH_UID + random.randrange(10 ** 9)
before = len(sent())
for i in range(8):
    update({"message": {"message_id": 10 + i, "text": "/start", "from": {"id": spammer, "first_name": "Спамер"}, "chat": {"id": spammer, "type": "private"}}})
assert len([x for x in sent()[before:] if x["chat_id"] == spammer]) == 5

print("--- /problem в личке: проблема уходит владельцу бота, не больше 5 в час")
reporter = FRESH_UID + random.randrange(10 ** 9)
dm = {"from": {"id": reporter, "first_name": "Жалобщик"}, "chat": {"id": reporter, "type": "private"}}
owner = {"from": {"id": 1, "first_name": "Владелец"}, "chat": {"id": 1, "type": "private"}}
bot = {"from": {"id": 1, "is_bot": True, "first_name": "Бот"}}
before = len(sent())
update({"message": {"message_id": 1, "text": "/problem стиралка 3 не показывается", **dm}})
update({"message": {"message_id": 2, "text": "/problem", **dm}})
prompt = [x for x in sent()[before:] if x["chat_id"] == reporter and "Опиши проблему" in x["text"]]
assert len(prompt) == 1, sent()[before:]
asked = {"message_id": 3, "text": prompt[0]["text"], "chat": dm["chat"], **bot}
update({"message": {"message_id": 4, "text": "приложение не открывается", "reply_to_message": asked, **dm}})
update({"message": {"message_id": 5, "text": "просто сообщение", **dm}})
got = [x["text"] for x in sent()[before:] if x["chat_id"] == 1 and f"id <code>{reporter}</code>" in x["text"]]
assert len(got) == 2 and "стиралка 3 не показывается" in got[0] and "приложение не открывается" in got[1], got

print("--- владелец отвечает на проблему, человек отвечает на ответ")
report = {"message_id": 50, "text": f"Проблема от Жалобщик (id {reporter}):\n\nприложение не открывается", "chat": owner["chat"], **bot}
before = len(sent())
update({"message": {"message_id": 51, "text": "уже починили, проверь", "reply_to_message": report, **owner}})
mine = [x["text"] for x in sent()[before:] if x["chat_id"] == reporter]
assert len(mine) == 1 and mine[0].startswith("Ответ администратора бота:") and "уже починили, проверь" in mine[0], mine
assert [x["text"] for x in sent()[before:] if x["chat_id"] == 1] == ["Отправлено."], sent()[before:]
reply = {"message_id": 52, "text": mine[0], "chat": dm["chat"], **bot}
before = len(sent())
update({"message": {"message_id": 6, "text": "да, работает, спасибо", "reply_to_message": reply, **dm}})
got = [x["text"] for x in sent()[before:] if x["chat_id"] == 1 and f"id <code>{reporter}</code>" in x["text"]]
assert len(got) == 1 and "да, работает, спасибо" in got[0], got

print("--- отвечать от имени владельца может только владелец")
before = len(sent())
update({"message": {"message_id": 53, "text": "подделка", "reply_to_message": {**report, "chat": {"id": 2, "type": "private"}}, "from": {"id": 2, "first_name": "Боря"}, "chat": {"id": 2, "type": "private"}}})
assert [x for x in sent()[before:] if x["chat_id"] == reporter or "подделка" in x["text"]] == [], sent()[before:]
update({"message": {"message_id": 54, "text": "ответ", "reply_to_message": {**report, "text": f"Проблема от Тень (id {DM_BLOCKED_UID}):"}, **owner}})
assert [x["text"] for x in sent()[before:] if x["chat_id"] == 1][-1].startswith("Не доставлено"), sent()[before:]

print("--- лимит сообщений о проблемах")
before = len(sent())
for i in range(3):
    update({"message": {"message_id": 7 + i, "text": f"ещё {i}", "reply_to_message": asked, **dm}})
assert len([x for x in sent()[before:] if x["chat_id"] == 1 and f"id <code>{reporter}</code>" in x["text"]]) == 2
assert len([x for x in sent()[before:] if x["chat_id"] == reporter and "попробуй через" in x["text"]]) == 1

print("--- в проблеме принимаются только текст, JPG/PNG/WebP, PDF и MP4")
shooter = FRESH_UID + random.randrange(10 ** 9)
dm = {"from": {"id": shooter, "first_name": "Скриншотер"}, "chat": {"id": shooter, "type": "private"}}
media = [
    {"photo": [{"file_id": "p", "width": 90, "height": 90}], "caption": "вот скрин"},
    {"document": {"file_id": "d", "mime_type": "image/png"}},
    {"video": {"file_id": "v", "mime_type": "video/mp4"}},
    {"document": {"file_id": "w", "mime_type": "image/webp"}},
    {"document": {"file_id": "f", "mime_type": "application/pdf"}},
    {"sticker": {"file_id": "s"}},
    {"animation": {"file_id": "a", "mime_type": "video/mp4"}, "document": {"file_id": "a", "mime_type": "video/mp4"}},
]
before = len(sent())
for i, extra in enumerate(media):
    update({"message": {"message_id": 20 + i, "reply_to_message": {**asked, "chat": dm["chat"]}, **extra, **dm}})
assert len([x for x in sent()[before:] if x["chat_id"] == 1 and f"id <code>{shooter}</code>" in x["text"]]) == 5, sent()[before:]
mine = [x["text"] for x in sent()[before:] if x["chat_id"] == shooter]
assert [t.startswith("Спасибо") for t in mine] == [True] * 5 + [False, False] and mine[-1].startswith("Такой файл не подходит") and "Опиши проблему" in mine[-1], mine

print("--- в проблеме не принимаются файлы больше 20 МБ")
heavy = FRESH_UID + random.randrange(10 ** 9)
dm = {"from": {"id": heavy, "first_name": "Тяжеловес"}, "chat": {"id": heavy, "type": "private"}}
mb = 1024 * 1024
media = [
    {"video": {"file_id": "v", "mime_type": "video/mp4", "file_size": 21 * mb}},
    {"document": {"file_id": "d", "mime_type": "image/png", "file_size": 50 * mb}},
    {"document": {"file_id": "d", "mime_type": "image/jpeg", "file_size": 20 * mb}},
    {"photo": [{"file_id": "s", "width": 90, "height": 90, "file_size": 5000}, {"file_id": "p", "width": 1280, "height": 1280, "file_size": 300000}]},
]
before = len(sent())
for i, extra in enumerate(media):
    update({"message": {"message_id": 40 + i, "reply_to_message": {**asked, "chat": dm["chat"]}, **extra, **dm}})
assert len([x for x in sent()[before:] if x["chat_id"] == 1 and f"id <code>{heavy}</code>" in x["text"]]) == 2, sent()[before:]
mine = [x["text"] for x in sent()[before:] if x["chat_id"] == heavy]
assert [t.startswith("Файл слишком большой") for t in mine] == [True, True, False, False] and mine[-1].startswith("Спасибо"), mine
assert "50 МБ, а можно до 20 МБ" in mine[1] and "Опиши проблему" in mine[1], mine[1]
before = len(sent())
retry = {"message_id": 60, "text": mine[1], "chat": dm["chat"], **bot}
update({"message": {"message_id": 61, "text": "вот текстом", "reply_to_message": retry, **dm}})
assert len([x for x in sent()[before:] if x["chat_id"] == 1 and "вот текстом" in x["text"]]) == 1, sent()[before:]

print("--- сообщение в личке не ответом на вопрос: бот объясняет и спрашивает снова")
loner = FRESH_UID + random.randrange(10 ** 9)
dm = {"from": {"id": loner, "first_name": "Одиночка"}, "chat": {"id": loner, "type": "private"}}
txt = {"document": {"file_id": "t", "mime_type": "text/plain", "file_name": "log.txt", "file_size": 120}}
before = len(sent())
update({"message": {"message_id": 70, **txt, **dm}})
update({"message": {"message_id": 71, "write_access_allowed": {"web_app_name": "techfloor"}, **dm}})
mine = [x["text"] for x in sent()[before:] if x["chat_id"] == loner]
assert len(mine) == 1 and mine[0].startswith("Это сообщение никуда не ушло") and "Опиши проблему" in mine[0], mine
assert not [x for x in sent()[before:] if x["chat_id"] == 1 and f"id <code>{loner}</code>" in x["text"]]
before = len(sent())
update({"message": {"message_id": 72, "reply_to_message": {"message_id": 73, "text": mine[0], "chat": dm["chat"], **bot}, **txt, **dm}})
mine = [x["text"] for x in sent()[before:] if x["chat_id"] == loner]
assert len(mine) == 1 and mine[0].startswith("Такой файл не подходит"), mine

print("--- проблема из приложения: категория уходит владельцу бота, владелец может ответить")
uid, X = fresh("Приложенец")
st, d = api(X); assert st == 200 and {"app", "notify", "other"} <= {k["id"] for k in d["problems"]["kinds"]}, d
before = len(sent())
st, d = api(X, {"action": "problem", "kind": "app", "text": "белый <экран>"}); assert st == 200, d
got = [x["text"] for x in sent()[before:] if x["chat_id"] == 1 and f"id <code>{uid}</code>" in x["text"]]
assert len(got) == 1 and "<b>Приложение не открывается или выдаёт ошибку</b>\n\nбелый &lt;экран&gt;" in got[0], got
assert not [x for x in sent()[before:] if x["chat_id"] == CH], sent()[before:]
before = len(sent())
report = {"message_id": 80, "text": f"Проблема от Приложенец (id {uid}):\n\nПриложение не открывается или выдаёт ошибку\n\nбелый <экран>", "chat": owner["chat"], **bot}
update({"message": {"message_id": 81, "text": "уже починили", "reply_to_message": report, **owner}})
mine = [x["text"] for x in sent()[before:] if x["chat_id"] == uid]
assert len(mine) == 1 and "уже починили" in mine[0], sent()[before:]
st, d = api(X, {"action": "problem", "kind": "nope", "text": "x"}); assert st == 400, d
st, d = api(X, {"action": "problem", "kind": "app", "text": "   "}); assert st == 400 and "Опиши" in err(d), d
for i in range(4): st, d = api(X, {"action": "problem", "kind": "other", "text": f"ещё {i}"}); assert st == 200, d
st, d = api(X, {"action": "problem", "kind": "other", "text": "шестая"}); assert st == 400 and "попробуй через" in err(d), d

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
