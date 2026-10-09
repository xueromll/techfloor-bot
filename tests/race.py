import time
from common import *

db = start()
wipe()
sql("UPDATE people SET hidden = 0")
ROUNDS = 8

print("--- параллельные take: машину занимает ровно один")
for r in range(ROUNDS):
    wipe("machines")
    res = parallel(lambda: api(ANYA, {"action": "take", "t": "w", "n": 1, "time": "40"}),
                   lambda: api(BORYA, {"action": "take", "t": "w", "n": 1, "time": "40"}))
    ok = [i for i, (st, d) in enumerate(res) if st == 200]
    assert len(ok) == 1, res
    assert "уже занята" in err(res[1 - ok[0]][1]), res
    assert one("SELECT COUNT(*) FROM machines WHERE chat_id = ? AND mtype = 'w' AND num = 1", CH) == 1
    assert one("SELECT user_id FROM machines WHERE chat_id = ? AND mtype = 'w' AND num = 1", CH) == ok[0] + 1

print("--- параллельный claim: хозяин находится ровно один")
for r in range(ROUNDS):
    wipe("machines")
    assert api(ANYA, {"action": "load", "t": "d", "n": 2})[0] == 200
    res = parallel(lambda: api(VOVA, {"action": "claim", "t": "d", "n": 2}),
                   lambda: api(GALYA, {"action": "claim", "t": "d", "n": 2}))
    ok = [i for i, (st, d) in enumerate(res) if st == 200]
    assert len(ok) == 1, res
    assert "уже есть хозяин" in err(res[1 - ok[0]][1]), res
    assert one("SELECT user_id FROM machines WHERE chat_id = ? AND mtype = 'd' AND num = 2", CH) == ok[0] + 3

print("--- параллельный free: освобождает ровно один")
for r in range(ROUNDS):
    wipe()
    assert api(ANYA, {"action": "take", "t": "w", "n": 3, "time": "40"})[0] == 200
    res = parallel(lambda: api(ANYA, {"action": "free", "t": "w", "n": 3}),
                   lambda: api(ANYA, {"action": "free", "t": "w", "n": 3}))
    ok = [i for i, (st, d) in enumerate(res) if st == 200]
    assert len(ok) == 1, res
    assert "уже свободна" in err(res[1 - ok[0]][1]), res
    assert one("SELECT COUNT(*) FROM machines WHERE chat_id = ?", CH) == 0

print("--- параллельный move: вещи переложит один, проигравший не оставляет следов")
for r in range(ROUNDS):
    wipe()
    assert api(ANYA, {"action": "load", "t": "w", "n": 5})[0] == 200
    res = parallel(lambda: api(BORYA, {"action": "move", "ft": "w", "fn": 5, "to": "machine", "tt": "w", "tn": 6}),
                   lambda: api(VOVA, {"action": "move", "ft": "w", "fn": 5, "to": "machine", "tt": "w", "tn": 7}))
    ok = [i for i, (st, d) in enumerate(res) if st == 200]
    assert len(ok) == 1, res
    assert err(res[1 - ok[0]][1]) in ("Эти вещи уже переложили.", "В этой машине нет оставленных вещей."), res
    won, lost = (6, 7) if ok[0] == 0 else (7, 6)
    assert one("SELECT kind FROM machines WHERE chat_id = ? AND mtype = 'w' AND num = ?", CH, won) == "parked"
    assert one("SELECT kind FROM machines WHERE chat_id = ? AND mtype = 'w' AND num = ?", CH, lost) is None, "проигравший занял свою машину"
    assert one("SELECT COUNT(*) FROM machines WHERE chat_id = ? AND mtype = 'w' AND num = 5", CH) == 0
    assert one("SELECT COUNT(*) FROM moved WHERE chat_id = ?", CH) == 1

print("--- вещи можно переложить в выбранную машину")
wipe()
assert api(GALYA, {"action": "take", "t": "w", "n": 3, "time": "40"})[0] == 200
sql("UPDATE machines SET ends_at = ? WHERE chat_id = ? AND mtype = 'w' AND num = 3", time.time() - 1, CH); cron()
st, d = api(ANYA); assert m(d, "w", 3)["status"] == "done", m(d, "w", 3)
st, d = api(ANYA, {"action": "move", "ft": "w", "fn": 3, "to": "machine", "tt": "d", "tn": 1}); assert st == 200, d
assert m(d, "w", 3)["status"] == "free", m(d, "w", 3)
d1 = m(d, "d", 1); assert d1["status"] == "parked" and d1["owner"]["id"] == 4 and d1["reporter"]["id"] == 1, d1
mv = d["moved"][0]; assert mv["from"] == {"t": "w", "n": 3} and mv["to"] == {"t": "d", "n": 1} and mv["byMe"], mv
st, d = api(ANYA, {"action": "move", "ft": "d", "fn": 1, "to": "machine", "tt": "d", "tn": 1}); assert "Выбери другую" in err(d), d
assert api(BORYA, {"action": "take", "t": "d", "n": 2, "time": "40"})[0] == 200
st, d = api(ANYA, {"action": "move", "ft": "d", "fn": 1, "to": "machine", "tt": "d", "tn": 2}); assert "занята" in err(d), d
assert one("SELECT kind FROM machines WHERE chat_id = ? AND mtype = 'd' AND num = 1", CH) == "parked"
st, d = api(GALYA, {"action": "picked", "id": mv["id"]}); assert st == 200, d
assert m(d, "d", 1)["status"] == "free", m(d, "d", 1)
assert one("SELECT COUNT(*) FROM moved WHERE chat_id = ?", CH) == 0
wipe()
print("RACE TESTS OK")
