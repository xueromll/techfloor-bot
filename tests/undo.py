import time
from common import *

db = start()
wipe("machines", "queue", "nexts", "bookings", "moved", "undos")
sql("UPDATE people SET hidden = 0")

def dms(uid, start): return [x for x in sent()[start:] if x["chat_id"] == uid]
def finish(t, n): sql("UPDATE machines SET ends_at = ? WHERE mtype = ? AND num = ?", time.time() - 1, t, n); cron()
def busy(t, keep):
    for n in range(1, 12):
        if n not in keep: sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, ?, ?, 99, 'X', ?, ?, 'run')", CH, t, n, time.time(), time.time() + 3000)

print("--- заняла не ту стиралку: «Отменить» возвращает как было, событие помечено отменённым")
st, d = api(ANYA, {"action": "take", "t": "w", "n": 3, "time": "40"}); assert st == 200, d
assert d["undo"]["text"] == "Стиралка 3 занята" and d["undo"]["until"] > d["now"], d["undo"]
st, d = api(BORYA); assert d["undo"] is None, d["undo"]
st, d = api(ANYA, {"action": "undo"}); assert st == 200, d
assert m(d, "w", 3)["status"] == "free" and d["undo"] is None, m(d, "w", 3)
assert one("SELECT action FROM events WHERE action LIKE 'take%' ORDER BY id DESC LIMIT 1") == "take_undone"
assert one("SELECT json_extract(details, '$.undone') FROM events WHERE action = 'undo' ORDER BY id DESC LIMIT 1") == "take"
st, d = api(ANYA, {"action": "undo"}); assert st == 400 and "только своё последнее действие" in err(d), d

print("--- заняла машину, которую придержали по очереди: отмена возвращает придержку и бронь")
busy("d", [])
st, d = api(GALYA, {"action": "queue", "t": "d"}); assert st == 200 and [p["id"] for p in d["queue"]["d"]] == [4], d["queue"]
sql("DELETE FROM machines WHERE mtype = 'd' AND num = 5")
st, d = api(GALYA); assert m(d, "d", 5)["status"] == "hold" and m(d, "d", 5)["owner"]["id"] == 4, m(d, "d", 5)
st, d = api(GALYA, {"action": "book", "t": "d", "at": d["slots"][-1], "n": 5}); assert st == 200 and len(d["bookings"]) == 1, d
st, d = api(GALYA, {"action": "take", "t": "d", "n": 5, "time": "30"}); assert st == 200 and m(d, "d", 5)["status"] == "run" and not d["bookings"], d
st, d = api(GALYA, {"action": "undo"}); assert st == 200, d
assert m(d, "d", 5)["status"] == "hold" and m(d, "d", 5)["owner"]["id"] == 4 and len(d["bookings"]) == 1, (m(d, "d", 5), d["bookings"])
wipe("machines", "queue", "bookings")

print("--- «Вещи забраны» по ошибке: машина снова с вещами, очередь как была, хозяину и очереди — отбой")
api(GALYA, {"action": "take", "t": "w", "n": 5, "time": "40"}); finish("w", 5)
busy("w", [5])
st, d = api(ANYA, {"action": "queue", "t": "w"}); assert st == 200, d
before = len(sent())
st, d = api(BORYA, {"action": "free", "t": "w", "n": 5}); w5 = m(d, "w", 5)
assert w5["status"] == "hold" and w5["owner"]["id"] == 1 and d["undo"]["text"] == "Вещи из стиралки 5 отмечены забранными", (w5, d["undo"])
st, d = api(BORYA, {"action": "undo"}); assert st == 200, d
w5 = m(d, "w", 5); assert w5["status"] == "done" and w5["owner"]["id"] == 4, w5
assert [p["id"] for p in d["queue"]["w"]] == [1], d["queue"]
assert any("забранными по ошибке — отметку сняли. Кто:" in x["text"] and "Боря" in x["text"] for x in dms(4, before)), dms(4, before)
assert any(x["text"].startswith("Отбой: Стиралка 5") and "место в очереди сохранено" in x["text"] for x in dms(1, before)), dms(1, before)

print("--- переложила не туда: вещи снова в исходной машине, целевая свободна")
wipe("machines", "queue")
api(GALYA, {"action": "take", "t": "w", "n": 6, "time": "40"}); finish("w", 6)
st, d = api(BORYA, {"action": "move", "ft": "w", "fn": 6, "to": "machine", "tt": "w", "tn": 7}); assert st == 200, d
assert m(d, "w", 7)["status"] == "parked" and d["moved"], d["moved"]
st, d = api(BORYA, {"action": "undo"}); assert st == 200, d
assert m(d, "w", 6)["status"] == "done" and m(d, "w", 7)["status"] == "free" and not d["moved"], (m(d, "w", 6), m(d, "w", 7), d["moved"])

print("--- «Это мои вещи» по ошибке: хозяин снова неизвестен, отметившему — что это была ошибка")
api(VOVA, {"action": "take", "t": "d", "n": 4, "time": "40", "owner": "unknown"})
st, d = api(GALYA, {"action": "claim", "t": "d", "n": 4}); assert m(d, "d", 4)["owner"]["id"] == 4, m(d, "d", 4)
st, d = api(GALYA, {"action": "undo"}); assert st == 200, d
assert m(d, "d", 4)["owner"]["id"] == 0 and m(d, "d", 4)["status"] == "run", m(d, "d", 4)

print("--- после чужого изменения отменить нельзя")
api(VOVA, {"action": "take", "t": "w", "n": 8, "time": "40"})
st, d = api(ANYA, {"action": "free", "t": "w", "n": 8}); assert st == 200, d
st, d = api(VOVA, {"action": "undo"}); assert st == 400 and "уже что-то изменилось" in err(d), d
st, d = api(VOVA); assert m(d, "w", 8)["status"] == "free" and d["undo"] is None, (m(d, "w", 8), d["undo"])

print("--- если машину уже кто-то занял, отмена «Освободить» не перезапишет его")
api(VOVA, {"action": "take", "t": "w", "n": 9, "time": "40"})
api(VOVA, {"action": "free", "t": "w", "n": 9})
api(GALYA, {"action": "take", "t": "w", "n": 9, "time": "30"})
st, d = api(VOVA, {"action": "undo"}); assert st == 400 and "уже что-то изменилось" in err(d), d
st, d = api(VOVA); assert m(d, "w", 9)["owner"]["id"] == 4, m(d, "w", 9)

print("--- через две минуты отменять уже поздно")
api(BORYA, {"action": "take", "t": "w", "n": 10, "time": "40"})
sql("UPDATE undos SET at = at - 121 WHERE user_id = 2")
st, d = api(BORYA); assert d["undo"] is None, d["undo"]
st, d = api(BORYA, {"action": "undo"}); assert st == 400, d
st, d = api(BORYA); assert m(d, "w", 10)["status"] == "run", m(d, "w", 10)

print("--- кнопка «Забрал» в личке не оставляет «Отменить» в приложении")
wipe("machines", "undos")
before = len(sent())
api(GALYA, {"action": "take", "t": "w", "n": 2, "time": "40"}); finish("w", 2)
data = next(b["callback_data"] for x in dms(4, before) for row in (x.get("markup") or {}).get("inline_keyboard", []) for b in row if b.get("callback_data", "").startswith("lp:"))
update({"callback_query": {"id": "cb9", "data": data, "from": {"id": 4, "first_name": "Галя"}, "message": {"message_id": 900, "chat": {"id": 4, "type": "private"}}}})
st, d = api(GALYA); assert m(d, "w", 2)["status"] == "free" and d["undo"] is None, (m(d, "w", 2), d["undo"])
print("UNDO OK")
