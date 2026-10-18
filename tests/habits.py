import time
from common import *

db = start()
wipe()
sql("DELETE FROM events")
sql("DELETE FROM badges")
sql("DELETE FROM meta WHERE key = 'badges_week' OR key LIKE 'nag:%'")
sql("UPDATE people SET hidden = 0, digest = 0, digest_asked = 0, digest_day = NULL")

def dms(uid, start): return [x for x in sent()[start:] if x["chat_id"] == uid]
def chat(start): return [x for x in sent()[start:] if x["chat_id"] == CH]
def datas(msg): return [b["callback_data"] for row in (msg.get("markup") or {}).get("inline_keyboard", []) for b in row if "callback_data" in b]
def press(data, uid): return update({"callback_query": {"id": "cb7", "data": data, "from": {"id": uid, "first_name": "X"}, "message": {"message_id": 700, "chat": {"id": uid, "type": "private"}}}})
def col(c, t, n): return one(f"SELECT {c} FROM machines WHERE mtype = ? AND num = ?", t, n)
def finish(t, n): sql("UPDATE machines SET ends_at = ? WHERE mtype = ? AND num = ?", time.time() - 1, t, n); cron()
def ago(t, n, hours): sql("UPDATE machines SET finished_at = ? WHERE mtype = ? AND num = ?", time.time() - hours * 3600 - 5, t, n); cron()
def honor(who): return http("/api/honor", None, {"X-Init-Data": who})
def badge(h, bid): return next(b for b in h["mine"] if b["id"] == bid)
def busy(t, keep):
    for n in range(1, 12):
        if n != keep: sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, ?, ?, 99, 'X', ?, ?, 'run')", CH, t, n, time.time(), time.time() + 3000)

print("--- личка закрыта: в общий чат с тегом и объяснением, почему тегаем")
api(VOVA, {"action": "take", "t": "w", "n": 4, "time": "10"})
before = len(sent()); finish("w", 4)
said = chat(before); assert [x["text"] for x in said] == ["Стиралка 4 закончила. @vova, у тебя закрыты личные сообщения — забери, пожалуйста, вещи."], said
wipe()
print("--- конец программы: в личку сообщение с кнопками")
api(GALYA, {"action": "take", "t": "w", "n": 3, "time": "40"})
before = len(sent())
finish("w", 3)
got = dms(4, before); assert len(got) == 1 and got[0]["text"] == "Стиралка 3 закончила — забери бельё.", got
keys = datas(got[0]); assert [k[:3] for k in keys] == ["lp:", "lz:", "lm:"], keys
pick, snooze, _ = keys
print("--- через час напоминание, «Через 15 мин» откладывает и напоминает, не больше двух раз")
before = len(sent())
ago("w", 3, 1)
got = dms(4, before); assert len(got) == 1 and "закончила час назад" in got[0]["text"] and datas(got[0])[0] == pick, got
assert col("nag", "w", 3) == 1
press(snooze, 4)
assert col("snoozes", "w", 3) == 1 and col("snooze_until", "w", 3) > time.time() + 600
before = len(sent()); cron(); assert dms(4, before) == [], dms(4, before)
sql("UPDATE machines SET snooze_until = ? WHERE mtype = 'w' AND num = 3", time.time() - 1); cron()
got = dms(4, before); assert len(got) == 1 and got[0]["text"].startswith("Напоминаю: стиралка 3 закончила"), got
press(snooze, 4); press(snooze, 4)
assert col("snoozes", "w", 3) == 2
sql("UPDATE machines SET snooze_until = NULL WHERE mtype = 'w' AND num = 3")
print("--- через 3 часа")
before = len(sent()); ago("w", 3, 3)
got = dms(4, before); assert len(got) == 1 and "лежит уже 3 часа" in got[0]["text"], got
print("--- через 5 часов: в личку ещё одно, в общий чат — без имени, потому что машину ждут")
busy("w", 3)
st, d = api(BORYA, {"action": "queue", "t": "w"}); assert st == 200, d
before = len(sent()); ago("w", 3, 5)
assert len(dms(4, before)) == 1, dms(4, before)
said = chat(before); assert len(said) == 1, said
assert "Хозяин, отзовись" in said[0]["text"] and "в очереди уже 1" in said[0]["text"], said
assert "galya" not in said[0]["text"] and "Галя" not in said[0]["text"], said
assert col("called", "w", 3) == 1 and col("nag", "w", 3) == 3
before = len(sent()); cron(); assert dms(4, before) == [] and chat(before) == []
print("--- «Вещи забраны» из лички: машина уходит очереди, сообщение в чате правится, бот предлагает сводку")
warn = col("warn_msg", "w", 3); edited = len(edits()); before = len(sent())
press(pick, 4)
st, d = api(BORYA); w3 = m(d, "w", 3); assert w3["status"] == "hold" and w3["owner"]["id"] == 2, w3
assert any(x["message_id"] == warn and x["text"] == "Стиралка 3 освободилась. Спасибо!" for x in edits()[edited:]), edits()[edited:]
offer = [x for x in dms(4, before) if "сводку" in x["text"]]
assert len(offer) == 1 and datas(offer[0]) == [f"d1:{CH}", f"dx:{CH}"], dms(4, before)
assert one("SELECT COUNT(*) FROM events WHERE action = 'free' AND actor_id = 4 AND owner_id = 4") == 1
print("--- старая и чужая кнопки ничего не делают")
press(pick, 4); st, d = api(BORYA); assert m(d, "w", 3)["status"] == "hold", m(d, "w", 3)
wipe()
api(ANYA, {"action": "take", "t": "w", "n": 5, "time": "40"})
before = len(sent()); finish("w", 5)
keys = datas(dms(1, before)[0])
press(keys[0], 2); st, d = api(ANYA); assert m(d, "w", 5)["status"] == "done", m(d, "w", 5)
print("--- «Можно переложить»: хозяину больше не напоминаем, забронировавшему — сообщение")
st, d = api(BORYA, {"action": "next", "t": "w", "n": 5}); assert st == 200, d
before = len(sent()); press(keys[2], 1)
assert col("movable", "w", 5) == 1
assert [x for x in dms(2, before) if "разрешил их переложить" in x["text"]], dms(2, before)
st, d = api(BORYA); assert m(d, "w", 5)["movable"] is True, m(d, "w", 5)
before = len(sent()); ago("w", 5, 1); assert dms(1, before) == [], dms(1, before)
print("--- вещи переложили в другую машину — сообщение в чате говорит куда")
sql("UPDATE machines SET called = 1, warn_msg = 4242 WHERE mtype = 'w' AND num = 5")
edited = len(edits())
st, d = api(GALYA, {"action": "move", "ft": "w", "fn": 5, "to": "machine", "tt": "d", "tn": 2}); assert st == 200, d
assert any(x["message_id"] == 4242 and x["text"] == "Вещи из стиралки 5 переложили в сушилку 2. Хозяин, они там." for x in edits()[edited:]), edits()[edited:]
print("--- вечерняя сводка: только тем, кто включил, раз в день, с кнопкой «Отписаться»")
wipe()
press(f"d1:{CH}", 4)
assert one("SELECT digest FROM people WHERE chat_id = ? AND user_id = 4", CH) == 1
st, d = api(ANYA, {"action": "digest", "on": True}); assert st == 200 and d["me"]["digest"] is True, d["me"]
api(BORYA, {"action": "take", "t": "w", "n": 1, "time": "40"})
before = len(sent()); cron()
for uid in (1, 4):
    got = [x for x in dms(uid, before) if "Вечер в прачечной" in x["text"]]
    assert len(got) == 1, (uid, dms(uid, before))
    text = got[0]["text"]
    assert "Свободно: стиралки 2, 3, 4" in text and "Скоро освободится: стиралка 1 — в" in text and "Спокойнее всего с 2 до 10 утра." in text, text
    assert datas(got[0]) == [f"d0:{CH}"], got[0]
assert not [x for x in dms(2, before) if "Вечер в прачечной" in x["text"]]
before = len(sent()); cron(); assert not [x for x in sent()[before:] if "Вечер в прачечной" in x["text"]]
press(f"d0:{CH}", 1)
assert one("SELECT digest FROM people WHERE chat_id = ? AND user_id = 1", CH) == 0
st, d = api(ANYA); assert d["me"]["digest"] is False, d["me"]
print("--- значки за неделю: Молния, Герой, Сова, Чистая неделя")
wipe(); sql("DELETE FROM events")
for n in (1, 2, 3):
    api(ANYA, {"action": "take", "t": "w", "n": n, "time": "40"}); finish("w", n)
    st, d = api(ANYA, {"action": "free", "t": "w", "n": n}); assert st == 200, d
st, d = api(BORYA, {"action": "load", "t": "w", "n": 7}); assert st == 200, d
st, d = api(BORYA, {"action": "take", "t": "w", "n": 8, "time": "40", "owner": "unknown"}); assert st == 200, d
api(BORYA, {"action": "load", "t": "w", "n": 9}); st, d = api(BORYA, {"action": "free", "t": "w", "n": 9}); assert m(d, "w", 9)["status"] == "free", d
api(GALYA, {"action": "load", "t": "d", "n": 9}); api(GALYA, {"action": "free", "t": "d", "n": 9})
api(GALYA, {"action": "take", "t": "d", "n": 1, "time": "40"}); api(GALYA, {"action": "take", "t": "d", "n": 2, "time": "40"})
OFF = 3 * 3600
day = int((time.time() + OFF) // 86400) * 86400
week = day - time.gmtime(day).tm_wday * 86400 - OFF
sql("UPDATE events SET at = ? + (CASE num WHEN 1 THEN 3 ELSE 4 END) * 3600 WHERE action = 'take' AND actor_id = 4", week)
sql("UPDATE events SET at = ? WHERE action = 'take' AND actor_id = 1", week + 15 * 3600)
st, h = honor(ANYA); assert st == 200, h
assert badge(h, "lightning")["value"] == 3 and badge(h, "clean")["value"] == 3 and badge(h, "clean")["late"] == 0, h["mine"]
assert all(b["earned"] is None for b in h["mine"]), h["mine"]
st, h = honor(BORYA); assert badge(h, "hero")["value"] == 2, h["mine"]
st, h = honor(GALYA); assert badge(h, "owl")["value"] == 2 and badge(h, "hero")["value"] == 0, h["mine"]
print("--- в понедельник значки за прошлую неделю попадают на доску почёта, без сообщений")
sql("UPDATE events SET at = at - 7 * 86400")
sql("DELETE FROM meta WHERE key = 'badges_week'")
before = len(sent()); cron()
if time.time() >= week + 3600:
    got = rows("SELECT user_id, badge, value FROM badges ORDER BY user_id, badge")
    assert got == [(1, "clean", 3), (1, "lightning", 3), (2, "hero", 2), (4, "owl", 2)], got
    assert sent()[before:] == [], sent()[before:]
    st, h = honor(ANYA)
    board = {c["id"]: c["people"] for c in h["board"]["categories"]}
    assert [p["user"]["username"] for p in board["lightning"]] == ["anya"] and board["lightning"][0]["me"], board
    assert [p["value"] for p in board["hero"]] == [2] and board["owl"][0]["place"] == 1, board
    assert badge(h, "lightning")["earned"] and badge(h, "lightning")["value"] == 0, h["mine"]
    st, d = api(ANYA); assert d["badgeWeek"] == week - 7 * 86400, d["badgeWeek"]
    print("--- скрытое имя на доске — «Аноним»")
    sql("UPDATE people SET hidden = 1 WHERE user_id = 2")
    st, h = honor(GALYA)
    hero = next(c for c in h["board"]["categories"] if c["id"] == "hero")["people"]
    assert hero[0]["user"]["name"] == "Аноним" and hero[0]["user"]["id"] is None, hero
    sql("UPDATE people SET hidden = 0")
else:
    print("(первый час недели — проверку доски пропускаю)")
sql("UPDATE people SET digest = 0")
print("--- «переложил» в чате: бот отвечает кнопкой в приложение, не чаще раза в 10 мин; открыли по ней — подсказка удаляется")
sql("DELETE FROM hints")
def post(mid, **body): return update({"message": {"message_id": mid, "from": {"id": 2, "first_name": "Боря"}, "chat": {"id": CH, "type": "supergroup"}, **body}})
before = len(sent())
post(7001, text="кто-нибудь видел мои носки")
post(7002, caption="5 стиралка, вещи перекинули", photo=[{"file_id": "x", "file_size": 10}])
post(7003, text="Вытащил вещи из сушилки 3")
hints = chat(before)
assert len(hints) == 1 and hints[0]["text"].startswith("Переложил чужие вещи?"), hints
url = hints[0]["markup"]["inline_keyboard"][0][0]["url"]
assert url.endswith(f"?startapp={CH}_m7002"), url
gone = len(deleted())
st, d = api(init(2, "Боря", None, start=f"{CH}_m7001")); assert st == 200, d
st, d = api(init(OUTSIDER_UID, "Чужой", None, start=f"{CH}_m7002")); assert st == 403, d
assert deleted()[gone:] == [], deleted()[gone:]
via = init(3, "Вова", "vova", start=f"{CH}_m7002")
st, d = api(via); assert st == 200, d
st, d = api(via); assert st == 200, d
assert deleted()[gone:] == [{"chat_id": CH, "message_id": hints[0]["message_id"]}], deleted()[gone:]
assert one("SELECT COUNT(*) FROM hints") == 0
print("HABITS TESTS OK")
