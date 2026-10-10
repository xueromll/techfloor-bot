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
print("--- открытые события: «Я приду», на закрытые и свои не записываются")
wipe("room_bookings", "room_joins")
PGALYA = init(4, "Галя", "galya", start=f"{CH}_p")
host, PHOST = fresh("Хост", start=f"{CH}_p")
ev_at = lambda d: next(x for x in d["room"]["bookings"] if x["id"] == ev["id"])
st, d = api(PHOST, {"action": "room_book", "starts": tom + 18 * 3600, "ends": tom + 20 * 3600, "reason": "Мафия", "public": True}); assert st == 200, d
ev = d["room"]["bookings"][0]; assert ev["public"] and ev["going"] == [] and not ev["joined"] and ev["capacity"] is None, ev
st, d = api(PANYA, {"action": "room_book", "starts": tom + 21 * 3600, "ends": tom + 22 * 3600, "public": "yes", "capacity": 5}); assert st == 200, d
priv = next(x for x in d["room"]["bookings"] if x["starts"] == tom + 21 * 3600); assert not priv["public"] and priv["capacity"] is None, priv
st, d = api(PHOST, {"action": "room_join", "id": ev["id"]}); assert "твоё" in err(d), d
st, d = api(PBORYA, {"action": "room_join", "id": priv["id"]}); assert "закрытая" in err(d), d
st, d = api(PBORYA, {"action": "room_join", "id": 10 ** 9}); assert "отменено" in err(d), d
for _ in range(2): st, d = api(PGALYA, {"action": "room_join", "id": ev["id"]}); assert st == 200, d
st, d = api(PANYA, {"action": "room_join", "id": ev["id"]}); assert st == 200, d
g = ev_at(d); assert [p["name"] for p in g["going"]] == ["Галя", "Аня"] and g["joined"], g
st, d = api(PBORYA); assert not ev_at(d)["joined"] and len(ev_at(d)["going"]) == 2, ev_at(d)
st, d = api(PGALYA, {"action": "room_leave", "id": ev["id"]}); assert [p["name"] for p in ev_at(d)["going"]] == ["Аня"], ev_at(d)
print("--- открытое событие «до N человек»: лишним — «мест нет»; без лимита — сколько угодно")
nine = {"action": "room_book", "starts": tom + 9 * 3600, "ends": tom + 10 * 3600, "public": True}
for bad in (0, -1, 101, 1.5, "2", True):
    st, d = api(PHOST, {**nine, "capacity": bad}); assert "от 1 до 100" in err(d), (bad, d)
before = len(sent())
st, d = api(PHOST, {**nine, "reason": "Настолки", "capacity": 2}); assert st == 200, d
assert any("Ждём до 2 чел." in x["text"] for x in sent()[before:]), sent()[before:]
capped = next(x for x in d["room"]["bookings"] if x["starts"] == tom + 9 * 3600); assert capped["capacity"] == 2, capped
for P in (PGALYA, PBORYA, PGALYA): st, d = api(P, {"action": "room_join", "id": capped["id"]}); assert st == 200, d
st, d = api(PANYA, {"action": "room_join", "id": capped["id"]}); assert "Мест больше нет" in err(d), d
assert one("SELECT COUNT(*) FROM room_joins WHERE booking_id = ?", capped["id"]) == 2
st, d = api(PBORYA, {"action": "room_leave", "id": capped["id"]}); assert st == 200, d
st, d = api(PANYA, {"action": "room_join", "id": capped["id"]}); assert st == 200, d
got = next(x for x in d["room"]["bookings"] if x["id"] == capped["id"]); assert [p["name"] for p in got["going"]] == ["Галя", "Аня"], got
before = len(sent())
st, d = api(PANYA, {"action": "room_book", "starts": tom + 6 * 3600, "ends": tom + 7 * 3600, "public": True, "capacity": None}); assert st == 200, d
assert any("не ограничено" in x["text"] for x in sent()[before:]), sent()[before:]
wide = next(x for x in d["room"]["bookings"] if x["starts"] == tom + 6 * 3600); assert wide["capacity"] is None, wide
for _ in range(5): st, d = api(fresh("Гость", start=f"{CH}_p")[1], {"action": "room_join", "id": wide["id"]}); assert st == 200, d
assert one("SELECT COUNT(*) FROM room_joins WHERE booking_id = ?", wide["id"]) == 5
print("--- двое жмут «Я приду» на последнее место одновременно — проходит ровно один")
for r in range(4):
    st, d = api(PANYA, {"action": "room_book", "starts": tom + (11 + r) * 3600, "ends": tom + (12 + r) * 3600, "public": True, "capacity": 1}); assert st == 200, d
    last = next(x for x in d["room"]["bookings"] if x["starts"] == tom + (11 + r) * 3600)
    a, b = fresh("Раз", start=f"{CH}_p")[1], fresh("Два", start=f"{CH}_p")[1]
    res = parallel(lambda: api(a, {"action": "room_join", "id": last["id"]}), lambda: api(b, {"action": "room_join", "id": last["id"]}))
    assert sorted(st for st, _ in res) == [200, 400], res
    assert one("SELECT COUNT(*) FROM room_joins WHERE booking_id = ?", last["id"]) == 1
print("--- закреп показывает, сколько идёт на сегодняшнее открытое событие")
st, d = api(PANYA, {"action": "room_book", "starts": cur, "ends": cur + s, "reason": "Приставка", "public": True}); assert st == 200, d
today = next(x for x in d["room"]["bookings"] if x["starts"] == cur)
st, d = api(PGALYA, {"action": "room_join", "id": today["id"]}); assert st == 200, d
assert "открытое событие, идут: 1)" in one("SELECT text FROM pboards WHERE chat_id = ?", CH)
sql("UPDATE room_bookings SET capacity = 3 WHERE id = ?", today["id"])
st, d = api(PBORYA, {"action": "room_join", "id": today["id"]}); assert st == 200, d
assert "открытое событие, идут: 2 из 3)" in one("SELECT text FROM pboards WHERE chat_id = ?", CH)
print("--- за полчаса до начала записавшимся приходит напоминание с кнопкой «Не приду»")
sql("UPDATE room_bookings SET starts = ?, ends = ?, created_at = 0, warned = 1 WHERE id = ?", time.time() + 15 * 60, time.time() + 75 * 60, ev["id"])
sql("UPDATE room_joins SET created_at = 0 WHERE booking_id = ?", ev["id"])
before = len(sent())
cron()
assert one("SELECT warned FROM room_joins WHERE booking_id = ? AND user_id = 1", ev["id"]) == 1, "записавшемуся не напомнили"
assert any(x["chat_id"] == 1 and "идёшь" in x["text"] for x in sent()[before:]), sent()[before:]
tap(ev["id"], "l", 1)
assert one("SELECT COUNT(*) FROM room_joins WHERE booking_id = ?", ev["id"]) == 0, "кнопка «Не приду» не сработала"
print("--- отмена события снимает записи и пишет записавшимся")
st, d = api(PGALYA, {"action": "room_join", "id": ev["id"]}); assert st == 200, d
before = len(sent())
st, d = api(PHOST, {"action": "room_cancel", "id": ev["id"]}); assert st == 200, d
assert one("SELECT COUNT(*) FROM room_joins WHERE booking_id = ?", ev["id"]) == 0
assert any(x["chat_id"] == 4 and "отменено" in x["text"] for x in sent()[before:]), sent()[before:]
st, d = api(PANYA, {"action": "admin_reset_room"}); assert st == 200, d
assert one("SELECT COUNT(*) FROM room_joins") == 0, "сброс игровой оставил записи"
print("--- изменить бронь может только хозяин; пересечения проверяются, своя бронь не мешает")
ed, PED = fresh("Редактор", start=f"{CH}_p")
st, d = api(PED, {"action": "room_book", "starts": tom + 10 * 3600, "ends": tom + 11 * 3600, "reason": "Кино"}); assert st == 200, d
bk = next(x for x in d["room"]["bookings"] if x["mine"])
def edit(who=None, **kw):
    return api(who or PED, {"action": "room_edit", "id": bk["id"], "starts": bk["starts"], "ends": bk["ends"], "reason": bk["reason"], "public": bk["public"], "capacity": bk["capacity"], **kw})
mine = lambda d: next(x for x in d["room"]["bookings"] if x["id"] == bk["id"])
st, d = api(PANYA, {"action": "room_book", "starts": tom + 12 * 3600, "ends": tom + 13 * 3600}); assert st == 200, d
st, d = edit(PBORYA, reason="Чужое"); assert "только тот" in err(d), d
st, d = edit(ends=tom + 13 * 3600); assert "пересекается" in err(d), d
before = len(sent())
st, d = edit(starts=tom + 10 * 3600 + 1800, ends=tom + 12 * 3600, reason="Кино и попкорн"); assert st == 200, d
bk = mine(d); assert (bk["starts"], bk["ends"], bk["reason"]) == (tom + 10 * 3600 + 1800, tom + 12 * 3600, "Кино и попкорн"), bk
news = [x["text"] for x in sent()[before:]]
assert any("Бронь игровой изменена" in t and "было" in t and "Кино и попкорн" in t for t in news), news
print("--- закрытую бронь можно сделать открытой и поменять число мест")
before = len(sent())
st, d = edit(public=True, capacity=1); assert st == 200, d
bk = mine(d); assert bk["public"] and bk["capacity"] == 1, bk
assert any("теперь это открытое событие" in x["text"] and "Ждём до 1 чел." in x["text"] for x in sent()[before:]), sent()[before:]
st, d = api(PGALYA, {"action": "room_join", "id": bk["id"]}); assert st == 200, d
st, d = api(PBORYA, {"action": "room_join", "id": bk["id"]}); assert "Мест больше нет" in err(d), d
st, d = edit(capacity=None); assert st == 200, d
bk = mine(d); assert bk["capacity"] is None, bk
st, d = api(PBORYA, {"action": "room_join", "id": bk["id"]}); assert st == 200, d
st, d = edit(capacity=1); assert "меньше мест поставить нельзя" in err(d), d
st, d = api(PED); assert mine(d)["capacity"] is None, mine(d)
print("--- перенос события пишет записавшимся и заново включает им напоминание")
sql("UPDATE room_joins SET warned = 1 WHERE booking_id = ?", bk["id"])
before = len(sent())
st, d = edit(starts=tom + 14 * 3600, ends=tom + 15 * 3600); assert st == 200, d
bk = mine(d); assert len(bk["going"]) == 2, bk
assert one("SELECT SUM(warned) FROM room_joins WHERE booking_id = ?", bk["id"]) == 0
assert any(x["chat_id"] == 4 and "перенесено" in x["text"] for x in sent()[before:]), sent()[before:]
print("--- открытое событие можно сделать закрытым: записи снимаются, записавшимся приходит сообщение")
before = len(sent())
st, d = edit(public=False); assert st == 200, d
bk = mine(d); assert not bk["public"] and bk["going"] == [], bk
assert one("SELECT COUNT(*) FROM room_joins WHERE booking_id = ?", bk["id"]) == 0
assert any(x["chat_id"] == 2 and "закрытой бронью" in x["text"] for x in sent()[before:]), sent()[before:]
st, d = api(PGALYA, {"action": "room_join", "id": bk["id"]}); assert "закрытая" in err(d), d
print("--- у идущей брони можно продлить конец, а начало в прошлое не перенести; правка без изменений ничего не пишет")
ed2, PED2 = fresh("Редактор-2", start=f"{CH}_p")
st, d = api(PED2, {"action": "room_book", "starts": cur, "ends": cur + s}); assert st == 200, d
bk = next(x for x in d["room"]["bookings"] if x["mine"])
st, d = edit(PED2, ends=cur + 2 * s); assert st == 200 and mine(d)["ends"] == cur + 2 * s, d
bk = mine(d)
st, d = edit(PED2, starts=cur - s); assert "прошло" in err(d), d
before = len(sent())
st, d = edit(PED2); assert st == 200, d
assert not any("изменен" in x.get("text", "") for x in sent()[before:]), sent()[before:]
print("--- к закрытой брони просятся, организатор принимает в приложении")
wipe("room_bookings", "room_joins", "room_requests")
own, POWN = fresh("Хозяин", start=f"{CH}_p")
st, d = api(POWN, {"action": "room_book", "starts": tom + 16 * 3600, "ends": tom + 18 * 3600, "reason": "Приставка"}); assert st == 200, d
cl = next(x for x in d["room"]["bookings"] if x["mine"])
at = lambda d: next(x for x in d["room"]["bookings"] if x["id"] == cl["id"])
st, d = api(POWN, {"action": "room_ask", "id": cl["id"]}); assert "твоя" in err(d), d
before = len(sent())
st, d = api(PGALYA, {"action": "room_ask", "id": cl["id"], "note": "  Можно   с вами? "}); assert st == 200, d
assert at(d)["requested"] == "pending" and at(d)["requests"] == [] and not at(d)["joined"], at(d)
assert any(x["chat_id"] == own and "просится" in x["text"] and "Можно с вами?" in x["text"] for x in sent()[before:]), sent()[before:]
st, d = api(PGALYA, {"action": "room_ask", "id": cl["id"]}); assert "уже отправлена" in err(d), d
st, d = api(PGALYA, {"action": "room_join", "id": cl["id"]}); assert "попроситься" in err(d), d
st, d = api(PBORYA, {"action": "room_ask", "id": cl["id"]}); assert st == 200, d
st, d = api(POWN); reqs = at(d)["requests"]
assert [r["name"] for r in reqs] == ["Галя", "Боря"] and reqs[0]["note"] == "Можно с вами?", reqs
st, d = api(PANYA, {"action": "room_answer", "id": cl["id"], "user": 4, "accept": True}); assert "только тот" in err(d), d
before = len(sent())
st, d = api(POWN, {"action": "room_answer", "id": cl["id"], "user": 4, "accept": True}); assert st == 200, d
assert [p["name"] for p in at(d)["going"]] == ["Галя"] and [r["name"] for r in at(d)["requests"]] == ["Боря"], at(d)
assert any(x["chat_id"] == 4 and "принял" in x["text"] for x in sent()[before:]), sent()[before:]
st, d = api(PGALYA); assert at(d)["joined"] and at(d)["requested"] is None, at(d)
st, d = api(POWN, {"action": "room_answer", "id": cl["id"], "user": 4, "accept": False}); assert "уже ответили" in err(d), d
print("--- отказ кнопкой в личке; чужой палец не отвечает; после отказа снова не попроситься")
answer = lambda what, uid, by: update({"callback_query": {"id": "cb2", "data": f"r{what}:{cl['id']}:{uid}", "from": {"id": by, "first_name": "X"}, "message": {"message_id": 501, "chat": {"id": by, "type": "private"}}}})
answer("a", 2, 2)
assert one("SELECT status FROM room_requests WHERE booking_id = ? AND user_id = 2", cl["id"]) == "pending", "ответил не хозяин"
before = len(sent())
answer("d", 2, own)
assert one("SELECT status FROM room_requests WHERE booking_id = ? AND user_id = 2", cl["id"]) == "declined"
assert any(x["chat_id"] == 2 and "отказал" in x["text"] for x in sent()[before:]), sent()[before:]
st, d = api(PBORYA); assert at(d)["requested"] == "declined" and not at(d)["joined"], at(d)
st, d = api(PBORYA, {"action": "room_ask", "id": cl["id"]}); assert "отказал" in err(d), d
print("--- заявку можно отозвать; когда бронь становится открытой, заявки снимаются")
guest, PGUEST = fresh("Гость", start=f"{CH}_p")
st, d = api(PGUEST, {"action": "room_ask", "id": cl["id"]}); assert st == 200, d
st, d = api(PGUEST, {"action": "room_unask", "id": cl["id"]}); assert at(d)["requested"] is None, at(d)
st, d = api(PGUEST, {"action": "room_ask", "id": cl["id"]}); assert st == 200, d
before = len(sent())
st, d = api(POWN, {"action": "room_edit", "id": cl["id"], "starts": cl["starts"], "ends": cl["ends"], "reason": cl["reason"], "public": True, "capacity": None}); assert st == 200, d
assert one("SELECT COUNT(*) FROM room_requests WHERE booking_id = ?", cl["id"]) == 0
assert [p["name"] for p in at(d)["going"]] == ["Галя"], at(d)
assert any(x["chat_id"] == guest and "Я приду" in x["text"] for x in sent()[before:]), sent()[before:]
st, d = api(PGUEST, {"action": "room_ask", "id": cl["id"]}); assert "открытое событие" in err(d), d
print("--- отмена закрытой брони пишет принятым и тем, кто ещё ждёт ответа")
st, d = api(POWN, {"action": "room_book", "starts": tom + 19 * 3600, "ends": tom + 20 * 3600}); assert st == 200, d
cl = next(x for x in d["room"]["bookings"] if x["mine"] and x["starts"] == tom + 19 * 3600)
for P in (PGALYA, PGUEST): st, d = api(P, {"action": "room_ask", "id": cl["id"]}); assert st == 200, d
answer("a", 4, own)
before = len(sent())
st, d = api(POWN, {"action": "room_cancel", "id": cl["id"]}); assert st == 200, d
assert any(x["chat_id"] == 4 and "тебя приняли" in x["text"] for x in sent()[before:]), sent()[before:]
assert any(x["chat_id"] == guest and "просился" in x["text"] for x in sent()[before:]), sent()[before:]
assert one("SELECT COUNT(*) FROM room_requests WHERE booking_id = ?", cl["id"]) == 0
print("--- организатору без лички заявку пишут в тему игровой")
PVOVA = init(3, "Вова", "vova", start=f"{CH}_p")
st, d = api(PVOVA, {"action": "room_book", "starts": tom + 21 * 3600, "ends": tom + 22 * 3600}); assert st == 200, d
cl = next(x for x in d["room"]["bookings"] if x["mine"])
before = len(sent())
st, d = api(PGALYA, {"action": "room_ask", "id": cl["id"]}); assert st == 200, d
assert any(x["chat_id"] == CH and "@vova" in x["text"] and "просится" in x["text"] for x in sent()[before:]), sent()[before:]
st, d = api(PVOVA, {"action": "room_cancel", "id": cl["id"]}); assert st == 200, d
print("--- /unpin убирает закреп только из своей темы, /unpin all — отовсюду")
topic("/unpin", 5)
assert rows("SELECT thread_id FROM pboards WHERE chat_id = ?", CH) == [(77,)]
assert one("SELECT COUNT(*) FROM boards WHERE chat_id = ?", CH) == 1
topic("/unpin", 77)
assert one("SELECT COUNT(*) FROM pboards WHERE chat_id = ?", CH) == 0
assert one("SELECT COUNT(*) FROM boards WHERE chat_id = ?", CH) == 1
st, d = api(ANYA); assert st == 200 and d["section"] == "laundry", d
topic("/playroom", 77)
hook("/unpin all", sender={"id": 2, "first_name": "Боря"})
assert one("SELECT COUNT(*) FROM boards WHERE chat_id = ?", CH) == 1, "не-админ открепил бота"
hook("/unpin all")
assert one("SELECT COUNT(*) FROM boards WHERE chat_id = ?", CH) == 0
assert one("SELECT COUNT(*) FROM pboards WHERE chat_id = ?", CH) == 0
st, d = api(ANYA); assert st == 404, (st, d)
hook("/board")
topic("/playroom", 77)
print("ROOM TESTS OK")
