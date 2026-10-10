import re, time
from common import *

db = start()
wipe()
sql("UPDATE people SET hidden = 0")

print("--- programme ends -> 'done', not free; next booker waits")
api(ANYA, {"action": "take", "t": "w", "n": 3, "time": "40"})
st, d = api(BORYA, {"action": "next", "t": "w", "n": 3}); assert st == 200, d
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=3", time.time() - 1); cron()
st, d = api(BORYA); w3 = m(d, "w", 3); assert w3["status"] == "done" and w3["owner"]["id"] == 1 and w3["finished"], w3
st, d = api(VOVA, {"action": "take", "t": "w", "n": 3, "time": "30"}); assert "чужие вещи" in err(d), d
print("--- owner taps «Вещи забраны» -> booker gets it")
st, d = api(BORYA, {"action": "free", "t": "w", "n": 3}); assert "Освободить может" in err(d), d
st, d = api(ANYA, {"action": "free", "t": "w", "n": 3}); w3 = m(d, "w", 3); assert w3["status"] == "hold" and w3["owner"]["id"] == 2, w3
print("--- someone moves clothes from a done machine -> freed + DM + queue")
api(GALYA, {"action": "take", "t": "w", "n": 5, "time": "40"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=5", time.time() - 1); cron()
for n in [1, 2, 4, 6, 7, 8, 9, 10, 11]: sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, 'w', ?, 99, 'X', ?, ?, 'run')", CH, n, time.time(), time.time() + 3000)
st, d = api(VOVA, {"action": "queue", "t": "w"}); assert st == 200, d
st, d = api(ANYA, {"action": "move", "ft": "w", "fn": 5, "to": "board"}); assert st == 200, d
w5 = m(d, "w", 5); assert w5["status"] == "hold" and w5["owner"]["id"] == 3 and d["moved"], w5
print("--- owner re-takes own done machine; unknown-owner done machine can be claimed")
wipe("machines")
api(ANYA, {"action": "take", "t": "d", "n": 2, "time": "40"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='d' AND num=2", time.time() - 1); cron()
st, d = api(ANYA, {"action": "take", "t": "d", "n": 2, "time": "30"}); assert m(d, "d", 2)["status"] == "run", d
api(BORYA, {"action": "take", "t": "d", "n": 4, "time": "40", "owner": "unknown"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='d' AND num=4", time.time() - 1); cron()
st, d = api(GALYA, {"action": "claim", "t": "d", "n": 4}); assert m(d, "d", 4)["status"] == "done" and m(d, "d", 4)["owner"]["id"] == 4, m(d, "d", 4)
print("--- 12h later a forgotten done machine frees itself silently")
sql("UPDATE machines SET ends_at = ? WHERE mtype='d' AND num=4", time.time() - 1); cron()
st, d = api(ANYA); assert m(d, "d", 4)["status"] == "free", m(d, "d", 4)
print("--- unknown owner's clothes moved -> chat is told where they went")
api(BORYA, {"action": "take", "t": "w", "n": 8, "time": "40", "owner": "unknown"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=8", time.time() - 1); cron()
before = len(sent())
st, d = api(VOVA, {"action": "move", "ft": "w", "fn": 8, "to": "board"}); assert st == 200, d
said = [x for x in sent()[before:] if x["chat_id"] == CH and "переложили на гладильную доску" in x["text"]]
assert len(said) == 1 and "Стиралки 8" in said[0]["text"] and "Хозяин вещей не отмечен" in said[0]["text"], sent()[before:]
print("--- вещи внутри, программу не запускали -> машина занята без таймера")
wipe()
st, d = api(BORYA, {"action": "load", "t": "w", "n": 6}); assert st == 200, d
w6 = m(d, "w", 6); assert w6["status"] == "loaded" and w6["owner"]["id"] == 0 and w6["reporter"]["id"] == 2, w6
st, d = api(VOVA, {"action": "load", "t": "w", "n": 6}); assert "уже отмечена" in err(d), d
st, d = api(VOVA, {"action": "take", "t": "w", "n": 6, "time": "40"}); assert "чужие вещи" in err(d), d
print("--- хозяин нашёлся и запустил программу")
st, d = api(GALYA, {"action": "claim", "t": "w", "n": 6}); assert m(d, "w", 6)["owner"]["id"] == 4, m(d, "w", 6)
st, d = api(GALYA, {"action": "take", "t": "w", "n": 6, "time": "40"}); assert m(d, "w", 6)["status"] == "run", m(d, "w", 6)
print("--- кто отметил, тот может и запустить программу, и снять отметку")
st, d = api(ANYA, {"action": "load", "t": "d", "n": 3}); assert st == 200, d
st, d = api(ANYA, {"action": "take", "t": "d", "n": 3, "time": "30"}); d3 = m(d, "d", 3)
assert d3["status"] == "run" and d3["owner"]["id"] == 1, d3
st, d = api(ANYA, {"action": "free", "t": "d", "n": 3}); assert m(d, "d", 3)["status"] == "free", m(d, "d", 3)
print("--- чужие вещи без программы можно переложить, машина уходит очереди")
st, d = api(BORYA, {"action": "load", "t": "d", "n": 7}); d7 = m(d, "d", 7)
assert d7["status"] == "loaded" and d7["owner"]["id"] == 0, d7
for n in [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]: sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, 'd', ?, 99, 'X', ?, ?, 'run')", CH, n, time.time(), time.time() + 3000)
st, d = api(VOVA, {"action": "queue", "t": "d"}); assert st == 200, d
st, d = api(ANYA, {"action": "move", "ft": "d", "fn": 7, "to": "board"}); assert st == 200, d
d7 = m(d, "d", 7); assert d7["status"] == "hold" and d7["owner"]["id"] == 3, d7
print("--- через 12 ч отметка снимается сама")
wipe("machines")
st, d = api(ANYA, {"action": "load", "t": "w", "n": 9, "owner": "me"}); w9 = m(d, "w", 9)
assert w9["status"] == "loaded" and w9["owner"]["id"] == 0 and w9["reporter"]["id"] == 1, w9
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=9", time.time() - 1); cron()
st, d = api(ANYA); assert m(d, "w", 9)["status"] == "free", m(d, "w", 9)
print("--- «Это мои вещи» на идущей программе не даёт её освободить, отметивший получает уведомление")
wipe("machines")
api(BORYA, {"action": "take", "t": "w", "n": 2, "time": "40", "owner": "unknown"})
before = len(sent())
st, d = api(GALYA, {"action": "claim", "t": "w", "n": 2}); assert m(d, "w", 2)["owner"]["id"] == 4, m(d, "w", 2)
assert [x for x in sent()[before:] if x["chat_id"] == 2 and "нашёлся хозяин" in x["text"]], sent()[before:]
st, d = api(GALYA, {"action": "free", "t": "w", "n": 2}); assert "Пока программа идёт" in err(d), d
st, d = api(GALYA); assert m(d, "w", 2)["status"] == "run", m(d, "w", 2)
before = len(sent())
st, d = api(BORYA, {"action": "free", "t": "w", "n": 2}); assert m(d, "w", 2)["status"] == "free", m(d, "w", 2)
assert [x for x in sent()[before:] if x["chat_id"] == 4 and "освободили" in x["text"]], sent()[before:]
print("--- «Не знаю чьи» не перезаписывает чужую отметку")
st, d = api(BORYA, {"action": "load", "t": "w", "n": 4}); assert st == 200, d
st, d = api(GALYA, {"action": "take", "t": "w", "n": 4, "time": "40", "owner": "unknown"}); assert "чужие вещи" in err(d), d
st, d = api(GALYA, {"action": "free", "t": "w", "n": 4}); assert "Освободить может" in err(d), d
st, d = api(GALYA); w4 = m(d, "w", 4); assert w4["status"] == "loaded" and w4["reporter"]["id"] == 2, w4
print("--- /status в личке: что свободно, что работает и что твоё")
wipe()
api(ANYA, {"action": "take", "t": "w", "n": 1, "time": "40"})
api(BORYA, {"action": "take", "t": "w", "n": 2, "time": "30"})
api(VOVA, {"action": "load", "t": "w", "n": 3})
api(GALYA, {"action": "take", "t": "d", "n": 5, "time": "50"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='d' AND num=5", time.time() - 1); cron()
status = lambda uid, mid=900: update({"message": {"message_id": mid, "text": "/status", "from": {"id": uid, "first_name": "X"}, "chat": {"id": uid, "type": "private"}}})
said = lambda uid, start: [x for x in sent()[start:] if x["chat_id"] == uid]
before = len(sent())
st, d = status(2); assert st == 200, d
got = said(2, before); assert len(got) == 1, got
text = got[0]["text"]
assert "свободно 8 из 11: 4, 5, 6, 7, 8, 9, 10, 11" in text and "Работают: 2 до" in text and "1 до" in text, text
assert "С вещами внутри: 3" in text and "свободно 10 из 11" in text and "С вещами внутри: 5" in text, text
assert "<b>Твоё</b>" in text and "Стиралка 2 — программа до" in text and "Стиралка 1" not in text.split("Твоё")[1], text
assert "Аня" not in text and "anya" not in text, text
before = len(sent())
status(4)
text = said(4, before)[0]["text"]; assert "Сушилка 5 закончила" in text and "забери вещи" in text, text
print("--- /status: очередь и брони попадают в «Твоё», занятые все — когда закончит ближайшая")
for n in range(1, 12): sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, 'w', ?, 99, 'X', ?, ?, 'run')", CH, n, time.time(), time.time() + 600 + n * 60)
st, d = api(BORYA, {"action": "queue", "t": "w"}); assert st == 200, d
before = len(sent())
status(2, 901)
text = said(2, before)[0]["text"]
assert "свободно 0 из 11" in text and "Ближайшая закончит в" in text and "В очереди: 1 чел." in text and "Очередь на стиралку: ты 1 из 1" in text, text
print("--- /status не для чужих")
before = len(sent())
status(OUTSIDER_UID, 902)
text = said(OUTSIDER_UID, before)[0]["text"]; assert "Не нашёл прачечную" in text, text
print("--- «Обновить» переписывает сообщение свежим статусом, время со секундами")
wipe("queue")
sql("DELETE FROM machines WHERE mtype='w' AND num=4")
before = len(edits())
st, d = update({"callback_query": {"id": "cb9", "data": "ls", "from": {"id": 2, "first_name": "Боря"}, "message": {"message_id": 777, "chat": {"id": 2, "type": "private"}, "text": "Прачечная · обновлено в 00:00:00\n\nстарое"}}})
assert st == 200, d
got = [x for x in edits()[before:] if x["chat_id"] == 2 and x["message_id"] == 777]; assert len(got) == 1, edits()[before:]
text = got[0]["text"]; assert "свободно 1 из 11: 4" in text and re.search(r"обновлено в \d\d:\d\d:\d\d", text), text
print("DONE TESTS OK")
