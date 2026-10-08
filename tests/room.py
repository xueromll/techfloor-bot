import time
from common import *

db = start()
wipe("room_bookings")
print("--- /playroom in topic 77")
topic("/playroom", 77)
assert rows("SELECT thread_id FROM pboards WHERE chat_id = ?", CH) == [(77,)]
st, d = api(PBORYA); assert st == 200 and d["section"] == "playroom", d
R = d["room"]; days = R["days"]; assert len(days) == 91, len(days)
s = 1800; now = time.time(); cur = int(now // s) * s
tom = days[1]["start"]
st, d = api(PBORYA, {"action": "room_book", "starts": tom + 18 * 3600, "ends": tom + 20 * 3600, "reason": "  Настолки   и чай "}); assert st == 200, d
b = d["room"]["bookings"][0]; assert b["reason"] == "Настолки и чай" and b["mine"], b
st, d = api(PANYA, {"action": "room_book", "starts": tom + 19 * 3600, "ends": tom + 21 * 3600}); assert "пересекается" in err(d), d
st, d = api(PANYA, {"action": "room_book", "starts": tom + 20 * 3600, "ends": tom + 21 * 3600}); assert st == 200, d
st, d = api(PANYA, {"action": "room_book", "starts": tom, "ends": tom + 13 * 3600}); assert "не дольше" in err(d), d
st, d = api(PANYA, {"action": "room_book", "starts": cur - s, "ends": cur + s}); assert "прошло" in err(d), d
st, d = api(PANYA, {"action": "room_book", "starts": days[-1]["end"], "ends": days[-1]["end"] + s}); assert "дней вперёд" in err(d), d
st, d = api(PANYA, {"action": "room_book", "starts": cur, "ends": cur + 2 * s, "reason": "Сейчас"}); assert st == 200, d
st, d = api(PANYA, {"action": "room_book", "starts": tom + 123, "ends": tom + 1800}); assert st == 400
print("--- cancel permissions")
st, d = api(PANYA)
anya_tom = next(x for x in d["room"]["bookings"] if x["starts"] == tom + 20 * 3600)
boria = next(x for x in d["room"]["bookings"] if x["starts"] == tom + 18 * 3600)
st, d = api(PBORYA, {"action": "room_cancel", "id": anya_tom["id"]}); assert "Отменить может" in err(d), d
st, d = api(PANYA, {"action": "room_cancel", "id": boria["id"]}); assert st == 200 and len(d["room"]["bookings"]) == 2, d["room"]["bookings"]
print("--- laundry section still separate; laundry app link still works")
st, d = api(ANYA); assert d["section"] == "laundry"
cron()
print("pinned:", one("SELECT text FROM pboards WHERE chat_id = ?", CH).replace("\n", " | "))
print("--- вечером спрашиваем про завтрашние брони, кнопка «да» оставляет бронь")
wipe("room_bookings")
st, d = api(PBORYA, {"action": "room_book", "starts": tom + 15 * 3600, "ends": tom + 17 * 3600, "reason": "Кино"}); assert st == 200, d
bid = d["room"]["bookings"][0]["id"]
sql("UPDATE room_bookings SET created_at = ? WHERE id = ?", 0, bid)
cron()
assert one("SELECT asked FROM room_bookings WHERE id = ?", bid) == 1, "бронь не отмечена как спрошенная"
tap(bid, "k", 2)
st, d = api(PBORYA); assert [b["id"] for b in d["room"]["bookings"]] == [bid], d["room"]["bookings"]
print("--- спрашиваем один раз")
cron()
st, d = api(PBORYA); assert [b["id"] for b in d["room"]["bookings"]] == [bid], d["room"]["bookings"]
print("--- кнопка «нет» удаляет бронь, чужой палец ничего не делает")
tap(bid, "c", 1)
st, d = api(PBORYA); assert [b["id"] for b in d["room"]["bookings"]] == [bid], "отменить смог не хозяин"
tap(bid, "c", 2)
st, d = api(PBORYA); assert d["room"]["bookings"] == [], d["room"]["bookings"]
tap(bid, "c", 2)
print("--- за полчаса до начала приходит напоминание")
wipe("room_bookings")
st, d = api(PANYA, {"action": "room_book", "starts": tom + 9 * 3600, "ends": tom + 11 * 3600}); assert st == 200, d
bid = d["room"]["bookings"][0]["id"]
sql("UPDATE room_bookings SET starts = ?, ends = ?, created_at = 0 WHERE id = ?", time.time() + 15 * 60, time.time() + 75 * 60, bid)
cron()
assert one("SELECT warned FROM room_bookings WHERE id = ?", bid) == 1, "напоминание не отправлено"
tap(bid, "c", 1)
st, d = api(PANYA); assert d["room"]["bookings"] == [], d["room"]["bookings"]
print("ROOM TESTS OK")
