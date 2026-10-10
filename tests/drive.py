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
print("--- админ отмечает машину сломанной: занять нельзя, кто ждал её — в начале очереди")
wipe()
st, d = api(GALYA); slots = d["slots"]
st, d = api(GALYA, {"action": "book", "t": "w", "at": slots[-1], "n": 4}); assert st == 200, d
st, d = api(BORYA, {"action": "take", "t": "w", "n": 4, "time": "60"}); assert st == 200, d
st, d = api(VOVA, {"action": "next", "t": "w", "n": 4}); assert st == 200, d
st, d = api(BORYA, {"action": "broken", "t": "w", "n": 4}); assert "только админы" in err(d), d
before = len(sent())
st, d = api(ANYA, {"action": "broken", "t": "w", "n": 4, "note": "  не сливает   воду "}); assert st == 200, d
w4 = m(d, "w", 4); assert w4["status"] == "broken" and w4["note"] == "не сливает воду" and "next" not in w4, w4
assert [x for x in d["machines"] if x["status"] == "hold" and x["owner"]["id"] == 3], "Вова не получил другую стиралку"
assert [b["n"] for b in d["bookings"] if b["user"]["id"] == 4] == [None], d["bookings"]
texts = [x["text"] for x in sent()[before:]]
assert any("Стиралка 4 сломалась" in t and "забери" in t for t in texts), texts
assert any("начало очереди" in t for t in texts) and any("любая свободная стиралка" in t for t in texts), texts
assert "Не работают: стиралка 4." in one("SELECT text FROM boards WHERE chat_id = ?", CH)
st, d = api(ANYA, {"action": "broken", "t": "w", "n": 4}); assert "уже отмечена" in err(d), d
for extra in ({"action": "take", "time": "30"}, {"action": "load"}, {"action": "next"}, {"action": "claim"}, {"action": "free"}):
    st, d = api(BORYA, {**extra, "t": "w", "n": 4}); assert st == 400, (extra, d)
st, d = api(BORYA, {"action": "book", "t": "w", "at": slots[-1], "n": 4}); assert "недоступна" in err(d), d
st, d = api(ANYA, {"action": "admin_reset_laundry"}); assert st == 200 and m(d, "w", 4)["status"] == "broken", m(d, "w", 4)
st, d = api(BORYA, {"action": "fixed", "t": "w", "n": 4}); assert "только админы" in err(d), d
st, d = api(ANYA, {"action": "fixed", "t": "w", "n": 4}); assert st == 200 and m(d, "w", 4)["status"] == "free", m(d, "w", 4)
assert "Не работают" not in one("SELECT text FROM boards WHERE chat_id = ?", CH)
wipe()
print("--- время на дисплее изменилось: исправить может любой, но каждый один раз и в пределах лимитов")
st, d = api(BORYA, {"action": "take", "t": "w", "n": 1, "time": "40"}); assert st == 200, d
planned = m(d, "w", 1)["ends"]
st, d = api(VOVA, {"action": "next", "t": "w", "n": 1}); assert st == 200, d
st, d = api(GALYA, {"action": "retime", "t": "w", "n": 1, "time": "0"}); assert "Не понял время" in err(d), d
sql("UPDATE machines SET warned = 1 WHERE mtype = 'w' AND num = 1")
before = len(sent())
st, d = api(GALYA, {"action": "retime", "t": "w", "n": 1, "time": "55"}); assert st == 200, d
w1 = m(d, "w", 1)
assert w1["edits"] == 1 and w1["editedByMe"] and w1["editor"]["id"] == 4 and abs(w1["planned"] - planned) < 1, w1
assert abs(w1["ends"] - time.time() - 55 * 60) < 30, w1
assert one("SELECT warned FROM machines WHERE mtype = 'w' AND num = 1") == 0
told = [x for x in sent()[before:] if x["chat_id"] == 2 and "Стиралка 1 закончит в" in x["text"]]
assert told and "Если неверно" in told[0]["text"] and "galya" in told[0]["text"], sent()[before:]
st, d = api(GALYA, {"action": "retime", "t": "w", "n": 1, "time": "50"}); assert "уже исправлял" in err(d), d
st, d = api(VOVA, {"action": "retime", "t": "w", "n": 1, "time": "55"}); assert "и так закончит" in err(d), d
st, d = api(VOVA, {"action": "retime", "t": "w", "n": 1, "time": "120"}); assert "Можно поставить от 1 до" in err(d), d
st, d = api(VOVA, {"action": "retime", "t": "w", "n": 1, "time": "90"}); assert st == 200 and m(d, "w", 1)["edits"] == 2, d
_, third = fresh("Третий")
st, d = api(third, {"action": "retime", "t": "w", "n": 1, "time": "30"}); assert st == 200 and m(d, "w", 1)["edits"] == 3, d
_, fourth = fresh("Четвёртый")
st, d = api(fourth, {"action": "retime", "t": "w", "n": 1, "time": "35"}); assert "уже исправили 3 человека" in err(d), d
print("--- кто запустил, исправляет сколько угодно (в пределах ±60 мин), админ — без ограничений")
for minutes in ("45", "50"):
    st, d = api(BORYA, {"action": "retime", "t": "w", "n": 1, "time": minutes}); assert st == 200, d
w1 = m(d, "w", 1); assert w1["edits"] == 3 and w1["editor"]["id"] == 2 and abs(w1["planned"] - planned) < 1, w1
st, d = api(BORYA, {"action": "retime", "t": "w", "n": 1, "time": "150"}); assert "Можно поставить" in err(d), d
st, d = api(ANYA, {"action": "retime", "t": "w", "n": 1, "time": "200"}); assert st == 200, d
assert abs(m(d, "w", 1)["ends"] - time.time() - 200 * 60) < 30, m(d, "w", 1)
print("--- закончившую программу нельзя «продлить»; у отмеченной машины без лимита правит отметивший")
sql("UPDATE machines SET ends_at = ? WHERE mtype = 'w' AND num = 1", time.time() - 1); cron()
st, d = api(BORYA, {"action": "retime", "t": "w", "n": 1, "time": "30"}); assert "сейчас не работает" in err(d), d
st, d = api(GALYA, {"action": "retime", "t": "w", "n": 3, "time": "60"}); assert "сейчас не работает" in err(d), d
st, d = api(GALYA, {"action": "take", "t": "w", "n": 2, "time": "40", "owner": "unknown"}); assert st == 200, d
st, d = api(VOVA, {"action": "claim", "t": "w", "n": 2}); assert st == 200, d
st, d = api(VOVA, {"action": "retime", "t": "w", "n": 2, "time": "60"}); assert st == 200 and m(d, "w", 2)["edits"] == 1, d
st, d = api(VOVA, {"action": "retime", "t": "w", "n": 2, "time": "50"}); assert "уже исправлял" in err(d), d
for minutes in ("30", "35"):
    st, d = api(GALYA, {"action": "retime", "t": "w", "n": 2, "time": minutes}); assert st == 200 and m(d, "w", 2)["edits"] == 1, d
wipe()

print("ALL CF TESTS OK")
