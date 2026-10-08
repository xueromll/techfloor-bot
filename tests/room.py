import time, glob, sqlite3, json, hashlib, hmac
from urllib.parse import urlencode
exec(open("drive.py", encoding="utf-8").read().split('st, txt = http("/setup')[0])
db = sqlite3.connect([p for p in glob.glob(".wrangler/state/v3/d1/**/*.sqlite", recursive=True) if "metadata" not in p][0])
def init_p(uid, name, username):
    f = {"auth_date": str(int(time.time())), "start_param": f"{CH}_p", "user": json.dumps({"id": uid, "first_name": name, "username": username}, ensure_ascii=False)}
    dcs = "\n".join(f"{k}={v}" for k, v in sorted(f.items()))
    f["hash"] = hmac.new(hmac.new(b"WebAppData", TOKEN.encode(), hashlib.sha256).digest(), dcs.encode(), hashlib.sha256).hexdigest()
    return urlencode(f)
PA, PB = init_p(1, "Аня", "anya"), init_p(2, "Боря", None)
topic = lambda text, th: http("/telegram", {"message": {"message_id": 7, "text": text, "message_thread_id": th, "is_topic_message": True, "chat": {"id": CH, "type": "supergroup", "is_forum": True}}}, {"X-Telegram-Bot-Api-Secret-Token": SECRET})
def sql(q, *a): db.execute(q, a); db.commit()
tap = lambda bid, what, uid: http("/telegram", {"callback_query": {"id": "cb1", "data": f"r{what}:{bid}", "from": {"id": uid, "first_name": "X"}, "message": {"message_id": 500, "chat": {"id": uid, "type": "private"}}}}, {"X-Telegram-Bot-Api-Secret-Token": SECRET})
db.execute("DELETE FROM room_bookings"); db.commit()
print("--- /playroom in topic 77")
topic("/playroom", 77)
assert db.execute("SELECT thread_id FROM pboards").fetchall() == [(77,)]
st, d = api(PB); assert st == 200 and d["section"] == "playroom", d
R = d["room"]; days = R["days"]; assert len(days) == 91, len(days)
s = 1800; now = time.time(); cur = int(now // s) * s
tom = days[1]["start"]
st, d = api(PB, {"action": "room_book", "starts": tom + 18 * 3600, "ends": tom + 20 * 3600, "reason": "  Настолки   и чай "}); assert st == 200, d
b = d["room"]["bookings"][0]; assert b["reason"] == "Настолки и чай" and b["mine"], b
st, d = api(PA, {"action": "room_book", "starts": tom + 19 * 3600, "ends": tom + 21 * 3600}); assert "пересекается" in d["error"], d
st, d = api(PA, {"action": "room_book", "starts": tom + 20 * 3600, "ends": tom + 21 * 3600}); assert st == 200, d
st, d = api(PA, {"action": "room_book", "starts": tom, "ends": tom + 13 * 3600}); assert "не дольше" in d["error"], d
st, d = api(PA, {"action": "room_book", "starts": cur - s, "ends": cur + s}); assert "прошло" in d["error"], d
st, d = api(PA, {"action": "room_book", "starts": days[-1]["end"], "ends": days[-1]["end"] + s}); assert "дней вперёд" in d["error"], d
st, d = api(PA, {"action": "room_book", "starts": cur, "ends": cur + 2 * s, "reason": "Сейчас"}); assert st == 200, d
st, d = api(PA, {"action": "room_book", "starts": tom + 123, "ends": tom + 1800}); assert st == 400
print("--- cancel permissions")
st, d = api(PA)
anya_tom = next(x for x in d["room"]["bookings"] if x["starts"] == tom + 20 * 3600)
boria = next(x for x in d["room"]["bookings"] if x["starts"] == tom + 18 * 3600)
st, d = api(PB, {"action": "room_cancel", "id": anya_tom["id"]}); assert "Отменить может" in d["error"]
st, d = api(PA, {"action": "room_cancel", "id": boria["id"]}); assert st == 200 and len(d["room"]["bookings"]) == 2, d["room"]["bookings"]
print("--- laundry section still separate; laundry app link still works")
st, d = api(ANYA); assert d["section"] == "laundry"
cron()
print("pinned:", db.execute("SELECT text FROM pboards").fetchone()[0].replace("\n", " | "))
print("--- вечером спрашиваем про завтрашние брони, кнопка «да» оставляет бронь")
db.execute("DELETE FROM room_bookings"); db.commit()
st, d = api(PB, {"action": "room_book", "starts": tom + 15 * 3600, "ends": tom + 17 * 3600, "reason": "Кино"}); assert st == 200, d
bid = d["room"]["bookings"][0]["id"]
sql("UPDATE room_bookings SET created_at = ? WHERE id = ?", 0, bid)
cron()
assert db.execute("SELECT asked FROM room_bookings WHERE id = ?", (bid,)).fetchone()[0] == 1, "бронь не отмечена как спрошенная"
tap(bid, "k", 2)
st, d = api(PB); assert [b["id"] for b in d["room"]["bookings"]] == [bid], d["room"]["bookings"]
print("--- спрашиваем один раз")
cron()
st, d = api(PB); assert [b["id"] for b in d["room"]["bookings"]] == [bid], d["room"]["bookings"]
print("--- кнопка «нет» удаляет бронь, чужой палец ничего не делает")
tap(bid, "c", 1)
st, d = api(PB); assert [b["id"] for b in d["room"]["bookings"]] == [bid], "отменить смог не хозяин"
tap(bid, "c", 2)
st, d = api(PB); assert d["room"]["bookings"] == [], d["room"]["bookings"]
tap(bid, "c", 2)
print("--- за полчаса до начала приходит напоминание")
db.execute("DELETE FROM room_bookings"); db.commit()
soon = int((time.time() + 20 * 60) // s) * s
st, d = api(PA, {"action": "room_book", "starts": soon, "ends": soon + 2 * s}); assert st == 200, d
bid = d["room"]["bookings"][0]["id"]
sql("UPDATE room_bookings SET created_at = ? WHERE id = ?", 0, bid)
cron()
assert db.execute("SELECT warned FROM room_bookings WHERE id = ?", (bid,)).fetchone()[0] == 1, "напоминание не отправлено"
tap(bid, "c", 1)
st, d = api(PA); assert d["room"]["bookings"] == [], d["room"]["bookings"]
print("ROOM TESTS OK")
