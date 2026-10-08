import json, time
from common import *

db = start()
wipe()
sql("UPDATE people SET hidden = 0")

print("--- без initData внутрь не пускают")
st, d = http("/api/state"); assert st == 401 and "через Telegram" in err(d), (st, d)
st, d = api(""); assert st == 401 and "через Telegram" in err(d), (st, d)
st, d = api("user=%7B%22id%22%3A1%7D&auth_date=" + str(int(time.time()))); assert st == 401, (st, d)

print("--- подпись: подделанные поля, чужой бот и отсутствующий user")
fake_user = json.dumps({"id": OUTSIDER_UID, "first_name": "Хакер"}, ensure_ascii=False)
st, d = api(init(1, "Аня", "anya", tamper={"user": fake_user})); assert st == 401 and "через Telegram" in err(d), (st, d)
st, d = api(init(1, "Аня", "anya", tamper={"start_param": str(SPARE_CH)})); assert st == 401, (st, d)
st, d = api(init(1, "Аня", "anya", tamper={"hash": "0" * 64})); assert st == 401, (st, d)
st, d = api(init(1, "Аня", "anya", token=OTHER_TOKEN)); assert st == 401, (st, d)
st, d = api(sign({"auth_date": str(int(time.time())), "start_param": str(CH)})); assert st == 401, (st, d)
st, d = api(sign({"auth_date": str(int(time.time())), "start_param": str(CH), "user": "{}"})); assert st == 401, (st, d)
st, d = api(init(1, "Аня", "anya", token=OTHER_TOKEN), {"action": "take", "t": "w", "n": 1, "time": "40"}); assert st == 401, (st, d)
assert one("SELECT COUNT(*) FROM machines WHERE chat_id = ?", CH) == 0

print("--- просроченный и отсутствующий auth_date")
st, d = api(init(1, "Аня", "anya", age=25 * 3600)); assert st == 401 and "Сессия устарела" in err(d), (st, d)
st, d = api(init(1, "Аня", "anya", auth_date=False)); assert st == 401 and "Сессия устарела" in err(d), (st, d)
st, d = api(init(1, "Аня", "anya", age=23 * 3600)); assert st == 200, (st, d)

print("--- start_param: мусор, чужой чат, не участник")
st, d = api(init(1, "Аня", "anya", start=None)); assert st == 400 and "закреплённого" in err(d), (st, d)
st, d = api(init(1, "Аня", "anya", start="laundry")); assert st == 400, (st, d)
st, d = api(init(1, "Аня", "anya", start=SPARE_CH)); assert st == 404 and "не настроен" in err(d), (st, d)
st, d = api(init(OUTSIDER_UID, "Чужой", None)); assert st == 403 and "участникам чата" in err(d), (st, d)

print("--- вебхук без правильного секретного токена игнорируется")
st, d = hook("/board", secret=None, chat=SPARE_CH); assert st == 403, (st, d)
st, d = hook("/board", secret="wrong" + SECRET, chat=SPARE_CH); assert st == 403, (st, d)
st, d = hook("/board", secret=SECRET.upper(), chat=SPARE_CH); assert st == 403, (st, d)
assert rows("SELECT 1 FROM boards WHERE chat_id = ?", SPARE_CH) == [], "вебхук без секрета настроил чат"
st, d = hook("/board", chat=SPARE_CH); assert st == 200, (st, d)
assert rows("SELECT 1 FROM boards WHERE chat_id = ?", SPARE_CH) == [(1,)], "вебхук с секретом не сработал"
sql("DELETE FROM boards WHERE chat_id = ?", SPARE_CH)

print("--- /setup открывается только по секрету")
st, txt = http("/setup"); assert st == 403, (st, txt)
st, txt = http("/setup?key=" + SECRET.upper()); assert st == 403, (st, txt)

print("--- сбросить прачечную может только админ чата")
api(BORYA, {"action": "take", "t": "w", "n": 1, "time": "40"})
api(VOVA, {"action": "queue", "t": "w"})
st, d = api(BORYA, {"action": "admin_reset_laundry"}); assert "только админы" in err(d), d
assert one("SELECT COUNT(*) FROM machines WHERE chat_id = ?", CH) == 1
st, d = api(ANYA, {"action": "admin_reset_laundry"}); assert st == 200, d
assert all(x["status"] == "free" for x in d["machines"]) and d["queue"]["w"] == [], d["queue"]

print("--- отменить все брони игровой может только админ чата")
wipe("room_bookings")
slot = int((time.time() + 3600) // 1800) * 1800
st, d = api(PBORYA, {"action": "room_book", "starts": slot, "ends": slot + 3600}); assert st == 200, d
st, d = api(PBORYA, {"action": "admin_reset_room"}); assert "только админы" in err(d), d
assert one("SELECT COUNT(*) FROM room_bookings WHERE chat_id = ?", CH) == 1
st, d = api(PANYA, {"action": "admin_reset_room"}); assert st == 200 and d["room"]["bookings"] == [], d

print("--- админ видит, кто скрылся, остальные видят Аноним")
wipe()
api(BORYA, {"action": "privacy", "hidden": True})
api(BORYA, {"action": "take", "t": "w", "n": 2, "time": "40"})
st, d = api(ANYA); assert "скрыто" in m(d, "w", 2)["owner"]["name"], m(d, "w", 2)
st, d = api(VOVA); assert m(d, "w", 2)["owner"]["name"] == "Аноним", m(d, "w", 2)
api(BORYA, {"action": "privacy", "hidden": False})
wipe()
print("AUTH TESTS OK")
