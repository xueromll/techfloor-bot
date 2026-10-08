import time
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
print("--- вещи внутри, программу не запускали -> машина занята без таймера")
wipe()
st, d = api(BORYA, {"action": "load", "t": "w", "n": 6, "owner": "unknown"}); assert st == 200, d
w6 = m(d, "w", 6); assert w6["status"] == "loaded" and w6["owner"]["id"] == 0 and w6["reporter"]["id"] == 2, w6
st, d = api(VOVA, {"action": "load", "t": "w", "n": 6}); assert "уже отмечена" in err(d), d
st, d = api(VOVA, {"action": "take", "t": "w", "n": 6, "time": "40"}); assert "чужие вещи" in err(d), d
print("--- хозяин нашёлся и запустил программу")
st, d = api(GALYA, {"action": "claim", "t": "w", "n": 6}); assert m(d, "w", 6)["owner"]["id"] == 4, m(d, "w", 6)
st, d = api(GALYA, {"action": "take", "t": "w", "n": 6, "time": "40"}); assert m(d, "w", 6)["status"] == "run", m(d, "w", 6)
print("--- кто отметил, тот может и запустить программу, и снять отметку")
st, d = api(ANYA, {"action": "load", "t": "d", "n": 3, "owner": "unknown"}); assert st == 200, d
st, d = api(ANYA, {"action": "take", "t": "d", "n": 3, "time": "30"}); d3 = m(d, "d", 3)
assert d3["status"] == "run" and d3["owner"]["id"] == 1, d3
st, d = api(ANYA, {"action": "free", "t": "d", "n": 3}); assert m(d, "d", 3)["status"] == "free", m(d, "d", 3)
print("--- чужие вещи без программы можно переложить, машина уходит очереди")
st, d = api(BORYA, {"action": "load", "t": "d", "n": 7, "owner": 4}); d7 = m(d, "d", 7)
assert d7["status"] == "loaded" and d7["owner"]["id"] == 4, d7
for n in [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]: sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, 'd', ?, 99, 'X', ?, ?, 'run')", CH, n, time.time(), time.time() + 3000)
st, d = api(VOVA, {"action": "queue", "t": "d"}); assert st == 200, d
st, d = api(ANYA, {"action": "move", "ft": "d", "fn": 7, "to": "board"}); assert st == 200, d
d7 = m(d, "d", 7); assert d7["status"] == "hold" and d7["owner"]["id"] == 3, d7
print("--- через 12 ч отметка снимается сама")
wipe("machines")
st, d = api(ANYA, {"action": "load", "t": "w", "n": 9}); assert m(d, "w", 9)["status"] == "loaded", m(d, "w", 9)
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=9", time.time() - 1); cron()
st, d = api(ANYA); assert m(d, "w", 9)["status"] == "free", m(d, "w", 9)
print("DONE TESTS OK")
