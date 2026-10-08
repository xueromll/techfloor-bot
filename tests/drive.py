import time
from common import *

db = start()
wipe()
sql("UPDATE people SET hidden = 0")

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
wipe("machines")
for n in (1, 2, 3, 4):
    st, d = api(ANYA, {"action": "take", "t": "w", "n": n, "time": "50"}); assert st == 200, d
print("--- warning: none for 10-min programme, real minutes for longer")
wipe("machines")
api(ANYA, {"action": "take", "t": "w", "n": 9, "time": "10"}); cron()
api(ANYA, {"action": "take", "t": "w", "n": 10, "time": "20"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=10", time.time() + 14 * 60 + 10); cron()

print("--- privacy: own entries say Аноним (это ты)")
st, d = api(BORYA, {"action": "privacy", "hidden": True}); assert d["me"]["hidden"], d["me"]
st, d = api(BORYA, {"action": "take", "t": "w", "n": 4, "time": "40"}); assert m(d, "w", 4)["owner"]["name"] == "Аноним (это ты)", m(d, "w", 4)
st, d = api(VOVA); assert m(d, "w", 4)["owner"]["name"] == "Аноним", m(d, "w", 4)
st, d = api(BORYA, {"action": "privacy", "hidden": False}); assert not d["me"]["hidden"], d["me"]
print("--- время: 1,5 это полтора часа, 0,5 полчаса, а пробел между цифрами не склеивается")
for text, want in (("1,5", 90), ("0,5", 30), ("2,5", 150), ("1:05", 65), ("1,05", 65), ("1,30", 90), ("45", 45), ("2ч", 120), ("1 ч 30", 90)):
    wipe("machines")
    st, d = api(ANYA, {"action": "take", "t": "w", "n": 1, "time": text}); assert st == 200, (text, d)
    got = round((m(d, "w", 1)["ends"] - d["now"]) / 60)
    assert abs(got - want) <= 1, (text, got, want)
wipe("machines")
for text in ("1 5", "301", "6,0", "1,60", "0", "полтора"):
    st, d = api(ANYA, {"action": "take", "t": "w", "n": 1, "time": text}); assert "Не понял время" in err(d), (text, d)
print("ALL CF TESTS OK")
