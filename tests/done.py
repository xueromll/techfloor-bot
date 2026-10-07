import time, glob, sqlite3
exec(open("drive.py", encoding="utf-8").read().split('st, txt = http("/setup')[0])
db = sqlite3.connect([p for p in glob.glob(".wrangler/state/v3/d1/**/*.sqlite", recursive=True) if "metadata" not in p][0])
def sql(q, *a): db.execute(q, a); db.commit()
for t in ("machines", "queue", "nexts", "bookings", "moved"): db.execute(f"DELETE FROM {t}")
db.execute("UPDATE people SET hidden = 0"); db.commit()
print("--- programme ends -> 'done', not free; next booker waits")
api(ANYA, {"action": "take", "t": "w", "n": 3, "time": "40"})
st, d = api(BORYA, {"action": "next", "t": "w", "n": 3}); assert st == 200, d
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=3", time.time() - 1); cron()
st, d = api(BORYA); w3 = m(d, "w", 3); assert w3["status"] == "done" and w3["owner"]["id"] == 1 and w3["finished"], w3
st, d = api(VOVA, {"action": "take", "t": "w", "n": 3, "time": "30"}); assert "чужие вещи" in d["error"], d
print("--- owner taps 'Вещи забраны' -> booker gets it")
st, d = api(BORYA, {"action": "free", "t": "w", "n": 3}); assert "Освободить может" in d["error"], d
st, d = api(ANYA, {"action": "free", "t": "w", "n": 3}); w3 = m(d, "w", 3); assert w3["status"] == "hold" and w3["owner"]["id"] == 2, w3
print("--- someone moves clothes from a done machine -> freed + DM + queue")
api(GALYA, {"action": "take", "t": "w", "n": 5, "time": "40"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='w' AND num=5", time.time() - 1); cron()
for n in [1, 2, 4, 6, 7, 8, 9, 10, 11]: sql("INSERT OR REPLACE INTO machines (chat_id, mtype, num, user_id, user_name, started_at, ends_at, kind) VALUES (?, 'w', ?, 99, 'X', ?, ?, 'run')", CH, n, time.time(), time.time() + 3000)
st, d = api(VOVA, {"action": "queue", "t": "w"}); assert st == 200, d
st, d = api(ANYA, {"action": "move", "ft": "w", "fn": 5, "to": "board"}); assert st == 200, d
w5 = m(d, "w", 5); assert w5["status"] == "hold" and w5["owner"]["id"] == 3 and d["moved"], w5
print("--- owner re-takes own done machine; unknown-owner done machine can be claimed")
sql("DELETE FROM machines WHERE chat_id = ?", CH)
api(ANYA, {"action": "take", "t": "d", "n": 2, "time": "40"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='d' AND num=2", time.time() - 1); cron()
st, d = api(ANYA, {"action": "take", "t": "d", "n": 2, "time": "30"}); assert m(d, "d", 2)["status"] == "run", d
api(BORYA, {"action": "take", "t": "d", "n": 4, "time": "40", "owner": "unknown"})
sql("UPDATE machines SET ends_at = ? WHERE mtype='d' AND num=4", time.time() - 1); cron()
st, d = api(GALYA, {"action": "claim", "t": "d", "n": 4}); assert m(d, "d", 4)["status"] == "done" and m(d, "d", 4)["owner"]["id"] == 4, m(d, "d", 4)
print("--- 12h later a forgotten done machine frees itself silently")
sql("UPDATE machines SET ends_at = ? WHERE mtype='d' AND num=4", time.time() - 1); cron()
st, d = api(ANYA); assert m(d, "d", 4)["status"] == "free", m(d, "d", 4)
print("DONE TESTS OK")
