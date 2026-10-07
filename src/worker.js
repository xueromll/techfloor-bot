import PAGE from "../webapp/index.html";

const WARN_MINUTES = 15;
const MAX_MINUTES = 300;
const CLAIM_MINUTES = 10;
const SLOT_MINUTES = 30;
const BOOK_DAYS = 2;
const CLOTHES_HOURS = 12;
const BOOKING_GAP_MINUTES = 90;
const PEOPLE_DAYS = 60;
const ROOM_NAME = "Игровая";
const ROOM_DAYS = 90;
const ROOM_STEP_MINUTES = 30;
const ROOM_MAX_HOURS = 12;
const ROOM_REASON_LENGTH = 100;
const INIT_DATA_TTL = 24 * 3600;
const MEMBER_CACHE_SECONDS = 600;

const WALLS = [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11]];

const MACHINES = {
  w: { name: "Стиралка", title: "Стиралки", acc: "стиралку", gen: "Стиралки", many: "стиралок" },
  d: { name: "Сушилка", title: "Сушилки", acc: "сушилку", gen: "Сушилки", many: "сушилок" },
};

const IRONING_BOARD = "Гладильная доска";
const ANONYMOUS = "Аноним";

const HELP =
  "Привет! Я бот техэтажа общаги.\n\n" +
  "• Прачечная — стиралки и сушилки: что свободно, кто занял и сколько осталось, очередь, бронь, " +
  "напоминания и отметка «переложил чужие вещи».\n" +
  "• Игровая — календарь: свободна ли она сейчас, брони на любой день и бронь своего времени.\n\n" +
  "Как пользоваться: в чате общаги открой тему про стирку или про игровую и нажми кнопку " +
  "в закреплённом сообщении — «Открыть прачечную» или «Открыть игровую».\n\n" +
  "Уведомления: если в приложении включить «Не показывать моё имя», напоминания будут приходить сюда, в личку. " +
  "Теперь, после /start, я могу тебе писать.\n\n" +
  "Для админов чата: сделайте бота админом (закреплять и удалять сообщения) и отправьте " +
  "/board в теме про стирку и /playroom в теме про игровую.";

const DESCRIPTION =
  "Бот техэтажа общаги.\n\n" +
  "Прачечная: стиралки и сушилки, кто занял и сколько осталось, очередь, бронь и напоминания.\n" +
  "Игровая: календарь броней — посмотреть, свободна ли, и забронировать время.\n\n" +
  "Открывай приложение кнопкой из закреплённых сообщений в чате общаги.";

const SHORT_DESCRIPTION = "Прачечная и игровая техэтажа: кто занял, очередь, брони и напоминания.";

const PIN_HELP =
  "Не получилось закрепить сообщение.\n" +
  "Админы, сделайте бота администратором с правами «Закреплять сообщения» " +
  "и «Удалять сообщения», затем отправьте /board.";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS machines (
    chat_id INTEGER NOT NULL, mtype TEXT NOT NULL, num INTEGER NOT NULL,
    user_id INTEGER NOT NULL, user_name TEXT NOT NULL, username TEXT,
    started_at REAL NOT NULL, ends_at REAL NOT NULL, kind TEXT NOT NULL DEFAULT 'run', warned INTEGER NOT NULL DEFAULT 0,
    reporter_id INTEGER, reporter_name TEXT, reporter_username TEXT, finished_at REAL,
    PRIMARY KEY (chat_id, mtype, num))`,
  `CREATE TABLE IF NOT EXISTS boards (chat_id INTEGER PRIMARY KEY, message_id INTEGER NOT NULL, text TEXT, thread_id INTEGER)`,
  `CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, mtype TEXT NOT NULL,
    user_id INTEGER NOT NULL, user_name TEXT NOT NULL, username TEXT, priority INTEGER NOT NULL,
    UNIQUE (chat_id, mtype, user_id))`,
  `CREATE TABLE IF NOT EXISTS nexts (
    chat_id INTEGER NOT NULL, mtype TEXT NOT NULL, num INTEGER NOT NULL,
    user_id INTEGER NOT NULL, user_name TEXT NOT NULL, username TEXT,
    PRIMARY KEY (chat_id, mtype, num))`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, mtype TEXT NOT NULL,
    user_id INTEGER NOT NULL, user_name TEXT NOT NULL, username TEXT, at REAL NOT NULL, num INTEGER)`,
  `CREATE TABLE IF NOT EXISTS moved (
    id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL, owner_name TEXT NOT NULL, owner_username TEXT,
    from_mtype TEXT NOT NULL, from_num INTEGER NOT NULL, to_mtype TEXT, to_num INTEGER,
    mover_id INTEGER NOT NULL, mover_name TEXT NOT NULL, mover_username TEXT, at REAL NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS people (
    chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, name TEXT NOT NULL, username TEXT,
    hidden INTEGER NOT NULL DEFAULT 0, seen_at REAL NOT NULL,
    PRIMARY KEY (chat_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS pboards (chat_id INTEGER PRIMARY KEY, message_id INTEGER NOT NULL, text TEXT, thread_id INTEGER)`,
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value)`,
  `CREATE TABLE IF NOT EXISTS cron_log (at REAL NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS dm (user_id INTEGER PRIMARY KEY, ok INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS room_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, user_name TEXT NOT NULL, username TEXT,
    starts REAL NOT NULL, ends REAL NOT NULL, reason TEXT, created_at REAL NOT NULL)`,
];

const MIGRATIONS = [
  "ALTER TABLE machines ADD COLUMN warned INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE machines ADD COLUMN reporter_id INTEGER",
  "ALTER TABLE machines ADD COLUMN reporter_name TEXT",
  "ALTER TABLE machines ADD COLUMN reporter_username TEXT",
  "ALTER TABLE boards ADD COLUMN text TEXT",
  "ALTER TABLE bookings ADD COLUMN num INTEGER",
  "ALTER TABLE boards ADD COLUMN thread_id INTEGER",
  "ALTER TABLE machines ADD COLUMN finished_at REAL",
];

const NUMBERS = WALLS.flat();
const TABLES = ["machines", "boards", "queue", "nexts", "bookings", "moved", "people", "pboards", "room_bookings"];
const UNKNOWN = { id: 0, name: "неизвестно", username: null };
const memberCache = new Map();
const encoder = new TextEncoder();
let botUsername = null;
let schemaReady = false;

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      await ensureSchema(env);
      if (url.pathname === "/telegram" && request.method === "POST") return await onWebhook(request, env);
      if (url.pathname === "/setup") return await onSetup(url, env);
      if (url.pathname === "/api/state") return await apiState(request, env);
      if (url.pathname === "/api/action" && request.method === "POST") return await apiAction(request, env);
      if (url.pathname === "/") return new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
      return new Response("Not found", { status: 404 });
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "Ошибка сервера, попробуй ещё раз." }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(cronRun(env));
  },
};

async function cronRun(env) {
  await ensureSchema(env);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO cron_log (at) VALUES (?)").bind(now()),
    env.DB.prepare("DELETE FROM cron_log WHERE at < ?").bind(now() - 3600),
  ]);
  try {
    await tick(env);
  } catch (e) {
    console.error("Cron tick failed", e);
    await env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('cron_error', ?)").bind(`${new Date().toISOString()} ${e}`).run();
  }
}

const now = () => Date.now() / 1000;
const formatters = new Map();

function fmt(env, locale, options) {
  const id = `${locale}|${JSON.stringify(options)}`;
  if (!formatters.has(id)) formatters.set(id, new Intl.DateTimeFormat(locale, { timeZone: env.TZ_NAME || "Asia/Yekaterinburg", ...options }));
  return formatters.get(id);
}
const key = (mtype, num) => `${mtype}:${num}`;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)));
  for (const sql of MIGRATIONS) {
    try {
      await env.DB.prepare(sql).run();
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
  }
  schemaReady = true;
}

async function all(env, sql, ...args) {
  return (await env.DB.prepare(sql).bind(...args).all()).results;
}

function first(env, sql, ...args) {
  return env.DB.prepare(sql).bind(...args).first();
}

async function changed(env, sql, ...args) {
  return (await env.DB.prepare(sql).bind(...args).run()).meta.changes > 0;
}

async function tg(env, method, payload = {}) {
  try {
    const res = await fetch(`${env.TELEGRAM_API || "https://api.telegram.org"}/bot${env.BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) console.warn(`${method} failed: ${data.description}`);
    return data;
  } catch (e) {
    console.warn(`${method} failed: ${e}`);
    return { ok: false, description: String(e) };
  }
}

async function username(env) {
  if (!botUsername) {
    const me = await tg(env, "getMe");
    if (me.ok) botUsername = me.result.username;
  }
  return botUsername || "";
}

function person(row, prefix = "") {
  if (prefix) {
    if (row[`${prefix}_id`] == null) return null;
    return { id: row[`${prefix}_id`], name: row[`${prefix}_name`], username: row[`${prefix}_username`] };
  }
  return { id: row.user_id, name: row.user_name, username: row.username };
}

function escape(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tag(p) {
  return p.username ? `@${escape(p.username)}` : `<a href="tg://user?id=${p.id}">${escape(p.name)}</a>`;
}

function mname(mtype, num) {
  return `${MACHINES[mtype].name} ${num}`;
}

function clock(env, ts) {
  return fmt(env, "ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts * 1000));
}

function parseMinutes(text) {
  const t = String(text).trim().toLowerCase().replace(/\s/g, "");
  let match = t.match(/^(\d{1,2})[:.,чh](\d{1,2})(?:мин|м|m)?$/);
  let total;
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (minutes >= 60) return null;
    total = hours * 60 + minutes;
  } else {
    match = t.match(/^(\d{1,3})(?:мин|м|m)?$/);
    if (!match) return null;
    total = Number(match[1]);
  }
  return total >= 1 && total <= MAX_MINUTES ? total : null;
}

function localMidnight(env, daysAhead) {
  const parts = Object.fromEntries(
    fmt(env, "en-US", {
      year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map((p) => [p.type, Number(p.value)])
  );
  const localNow = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const offset = localNow - Math.floor(Date.now() / 1000) * 1000;
  return (Date.UTC(parts.year, parts.month - 1, parts.day + daysAhead) - offset) / 1000;
}

function slots(env) {
  const step = SLOT_MINUTES * 60;
  let start = Math.ceil(now() / step) * step;
  if (start - now() < 300) start += step;
  const end = localMidnight(env, BOOK_DAYS);
  const result = [];
  for (let at = start; at < end; at += step) result.push(at);
  return result;
}

async function isHidden(env, chatId, userId) {
  if (!userId) return false;
  const row = await first(env, "SELECT hidden FROM people WHERE chat_id = ? AND user_id = ?", chatId, userId);
  return !!(row && row.hidden);
}

async function label(env, chatId, p) {
  return (await isHidden(env, chatId, p.id)) ? ANONYMOUS.toLowerCase() : tag(p);
}

async function setDm(env, userId, ok) {
  await env.DB.prepare("INSERT OR REPLACE INTO dm (user_id, ok) VALUES (?, ?)").bind(userId, ok ? 1 : 0).run();
}

async function notice(env, chatId, p, text, dmFirst = false) {
  if (!p || !p.id) return;
  const hidden = await isHidden(env, chatId, p.id);
  if (hidden || dmFirst) {
    const markup = dmFirst ? { inline_keyboard: [[{ text: "Открыть прачечную", url: await appLink(env, chatId) }]] } : undefined;
    const dm = await tg(env, "sendMessage", { chat_id: p.id, text: capitalize(text), parse_mode: "HTML", reply_markup: markup });
    if (dm.ok) {
      await setDm(env, p.id, true);
      return;
    }
    if (dm.error_code === 403 || /chat not found/i.test(dm.description || "")) await setDm(env, p.id, false);
    if (hidden) {
      await say(env, chatId, `<a href="tg://user?id=${p.id}">${ANONYMOUS}</a>, ${text}`);
      return;
    }
  }
  await say(env, chatId, `${tag(p)}, ${text}`);
}

async function noticeMachine(env, row, text, unknownText) {
  if (row.user_id) await notice(env, row.chat_id, person(row), text);
  else await say(env, row.chat_id, unknownText);
}

async function busyMap(env, chatId) {
  const rows = await all(env, "SELECT * FROM machines WHERE chat_id = ?", chatId);
  return new Map(rows.map((r) => [key(r.mtype, r.num), r]));
}

async function getMachine(env, chatId, mtype, num) {
  return first(env, "SELECT * FROM machines WHERE chat_id = ? AND mtype = ? AND num = ?", chatId, mtype, num);
}

async function occupy(env, chatId, mtype, num, p, started, ends, kind = "run", reporter = null) {
  try {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM machines WHERE chat_id = ? AND mtype = ? AND num = ? AND kind IN ('hold', 'done') AND user_id = ?").bind(chatId, mtype, num, p.id),
      env.DB.prepare(
        "INSERT INTO machines (chat_id, mtype, num, user_id, user_name, username, started_at, ends_at, kind, warned, reporter_id, reporter_name, reporter_username) " +
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)"
      ).bind(chatId, mtype, num, p.id, p.name, p.username ?? null, started, ends, kind, reporter ? reporter.id : null, reporter ? reporter.name : null, reporter ? reporter.username ?? null : null),
    ]);
    return true;
  } catch (e) {
    if (/UNIQUE|constraint/i.test(String(e))) return false;
    throw e;
  }
}

async function enqueue(env, chatId, mtype, p, priority) {
  await env.DB.prepare(
    "INSERT INTO queue (chat_id, mtype, user_id, user_name, username, priority) VALUES (?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT (chat_id, mtype, user_id) DO UPDATE SET priority = MIN(priority, excluded.priority)"
  ).bind(chatId, mtype, p.id, p.name, p.username ?? null, priority).run();
}

async function queueOf(env, chatId, mtype) {
  return all(env, "SELECT * FROM queue WHERE chat_id = ? AND mtype = ? ORDER BY priority, id", chatId, mtype);
}

async function position(env, chatId, mtype, userId) {
  return (await queueOf(env, chatId, mtype)).findIndex((r) => r.user_id === userId) + 1;
}

async function offer(env, chatId, mtype, num, p) {
  const t = now();
  if (!(await occupy(env, chatId, mtype, num, p, t, t + CLAIM_MINUTES * 60, "hold"))) return null;
  return getMachine(env, chatId, mtype, num);
}

async function handoff(env, chatId, mtype, num) {
  const nxt = await first(env, "SELECT * FROM nexts WHERE chat_id = ? AND mtype = ? AND num = ?", chatId, mtype, num);
  if (nxt && (await changed(env, "DELETE FROM nexts WHERE chat_id = ? AND mtype = ? AND num = ? AND user_id = ?", chatId, mtype, num, nxt.user_id))) {
    const row = await offer(env, chatId, mtype, num, person(nxt));
    if (row) await notice(env, chatId, person(row), `твоя бронь: ${mname(mtype, num)} освободилась и ждёт тебя до ${clock(env, row.ends_at)}.`);
  }
  await dispatch(env, chatId, mtype);
}

async function upcomingBooking(env, chatId, mtype, num, exceptUser = -1) {
  return first(
    env,
    "SELECT * FROM bookings WHERE chat_id = ? AND mtype = ? AND num = ? AND at > ? AND user_id != ? ORDER BY at LIMIT 1",
    chatId, mtype, num, now(), exceptUser
  );
}

async function bookableNumbers(env, chatId, mtype, at) {
  const busy = await busyMap(env, chatId);
  const nexts = await all(env, "SELECT num FROM nexts WHERE chat_id = ? AND mtype = ?", chatId, mtype);
  const near = await all(
    env,
    "SELECT num FROM bookings WHERE chat_id = ? AND mtype = ? AND num IS NOT NULL AND ABS(at - ?) < ?",
    chatId, mtype, at, BOOKING_GAP_MINUTES * 60
  );
  const blocked = new Set([...nexts, ...near].map((r) => r.num));
  const ok = NUMBERS.filter((n) => {
    const row = busy.get(key(mtype, n));
    return !blocked.has(n) && (!row || row.ends_at <= at);
  });
  return ok.sort((a, b) => Number(busy.has(key(mtype, a))) - Number(busy.has(key(mtype, b))));
}

async function bookedSoon(env, chatId, mtype) {
  const rows = await all(
    env,
    "SELECT num FROM bookings WHERE chat_id = ? AND mtype = ? AND num IS NOT NULL AND at <= ?",
    chatId, mtype, now() + (CLAIM_MINUTES + 30) * 60
  );
  return new Set(rows.map((r) => r.num));
}

async function dispatch(env, chatId, mtype) {
  const busy = await busyMap(env, chatId);
  const soon = await bookedSoon(env, chatId, mtype);
  let offered = false;
  for (const num of NUMBERS) {
    if (busy.has(key(mtype, num)) || soon.has(num)) continue;
    let given = false;
    for (const head of await queueOf(env, chatId, mtype)) {
      if (!(await changed(env, "DELETE FROM queue WHERE id = ?", head.id))) continue;
      const row = await offer(env, chatId, mtype, num, person(head));
      if (!row) {
        await enqueue(env, chatId, mtype, person(head), head.priority);
        break;
      }
      const reason = head.priority === 0 ? "время твоей брони" : "подошла твоя очередь";
      await notice(env, chatId, person(row), `${reason}: ${mname(mtype, num)} ждёт тебя до ${clock(env, row.ends_at)}.`);
      given = offered = true;
      break;
    }
    if (!given) break;
  }
  return offered;
}

async function tick(env) {
  const t = now();
  const dirty = new Set();

  if (WARN_MINUTES > 0) {
    const due = await all(
      env,
      "SELECT * FROM machines WHERE kind = 'run' AND warned = 0 AND ends_at > ? AND ends_at - ? <= ? AND ends_at - started_at > ?",
      t, WARN_MINUTES * 60, t, WARN_MINUTES * 60
    );
    for (const row of due) {
      const left = Math.max(1, Math.round((row.ends_at - t) / 60));
      const ok = await changed(
        env,
        "UPDATE machines SET warned = 1 WHERE chat_id = ? AND mtype = ? AND num = ? AND started_at = ? AND warned = 0",
        row.chat_id, row.mtype, row.num, row.started_at
      );
      if (!ok) continue;
      await noticeMachine(
        env,
        row,
        `${mname(row.mtype, row.num)} закончит через ${left} мин.`,
        `${mname(row.mtype, row.num)} закончит через ${left} мин. Хозяин вещей не отмечен.`
      );
      const nxt = await first(env, "SELECT * FROM nexts WHERE chat_id = ? AND mtype = ? AND num = ?", row.chat_id, row.mtype, row.num);
      if (nxt) await notice(env, row.chat_id, person(nxt), `${mname(row.mtype, row.num)} освободится через ${left} мин — она забронирована за тобой.`);
    }
  }

  for (const row of await all(env, "SELECT * FROM machines WHERE ends_at <= ?", t)) {
    if (row.kind === "run") {
      const finished = await changed(
        env,
        "UPDATE machines SET kind = 'done', finished_at = ends_at, ends_at = ? WHERE chat_id = ? AND mtype = ? AND num = ? AND started_at = ? AND kind = 'run'",
        row.ends_at + CLOTHES_HOURS * 3600, row.chat_id, row.mtype, row.num, row.started_at
      );
      if (!finished) continue;
      dirty.add(row.chat_id);
      await noticeMachine(
        env,
        row,
        `${mname(row.mtype, row.num)} закончила — забери бельё и отметь в приложении «Вещи забраны».`,
        `${mname(row.mtype, row.num)} закончила. Хозяин вещей не отмечен — если это твои вещи, забери их.`
      );
      continue;
    }
    const ok = await changed(
      env,
      "DELETE FROM machines WHERE chat_id = ? AND mtype = ? AND num = ? AND started_at = ?",
      row.chat_id, row.mtype, row.num, row.started_at
    );
    if (!ok) continue;
    dirty.add(row.chat_id);
    if (row.kind === "hold") {
      await notice(env, row.chat_id, person(row), `время вышло — ${mname(row.mtype, row.num)} передана дальше.`);
    }
    await handoff(env, row.chat_id, row.mtype, row.num);
  }

  for (const b of await all(env, "SELECT * FROM bookings WHERE at <= ?", t)) {
    if (!(await changed(env, "DELETE FROM bookings WHERE id = ?", b.id))) continue;
    dirty.add(b.chat_id);
    if (b.num && !(await getMachine(env, b.chat_id, b.mtype, b.num))) {
      const row = await offer(env, b.chat_id, b.mtype, b.num, person(b));
      if (row) {
        await notice(env, b.chat_id, person(b), `время твоей брони: ${mname(b.mtype, b.num)} ждёт тебя до ${clock(env, row.ends_at)}.`);
        continue;
      }
    }
    await enqueue(env, b.chat_id, b.mtype, person(b), 0);
    await dispatch(env, b.chat_id, b.mtype);
    if (await position(env, b.chat_id, b.mtype, b.user_id)) {
      await notice(env, b.chat_id, person(b), `время твоей брони, но все ${MACHINES[b.mtype].title.toLowerCase()} заняты. Ты первый в очереди.`);
    }
  }

  for (const q of await all(env, "SELECT DISTINCT chat_id, mtype FROM queue")) {
    if (await dispatch(env, q.chat_id, q.mtype)) dirty.add(q.chat_id);
  }

  await env.DB.batch([
    env.DB.prepare("DELETE FROM moved WHERE at < ?").bind(t - CLOTHES_HOURS * 3600),
    env.DB.prepare("DELETE FROM room_bookings WHERE ends < ?").bind(t - 86400),
  ]);

  for (const chatId of dirty) await updatePinned(env, chatId);
  for (const r of await all(env, "SELECT chat_id FROM pboards")) await updateRoomBoard(env, r.chat_id);
}

async function appLink(env, chatId, section = "") {
  return `https://t.me/${await username(env)}/${env.APP_SHORT_NAME || "laundry"}?startapp=${chatId}${section ? "_" + section : ""}`;
}

function dayLabel(env, ts) {
  return fmt(env, "ru-RU", { weekday: "short", day: "numeric", month: "long" }).format(new Date(ts * 1000));
}

function roomDays(env) {
  const base = localMidnight(env, 0);
  const keyOf = fmt(env, "en-CA", {});
  const days = [];
  for (let i = 0; i <= ROOM_DAYS; i++) {
    const start = base + i * 86400;
    days.push({ key: keyOf.format(new Date((start + 3600) * 1000)), start, end: start + 86400 });
  }
  return days;
}

async function plainName(env, chatId, p) {
  if (await isHidden(env, chatId, p.id)) return ANONYMOUS.toLowerCase();
  return p.username ? `@${escape(p.username)}` : escape(p.name);
}

async function roomLine(env, chatId, b) {
  const who = await plainName(env, chatId, person(b));
  return `${clock(env, b.starts)}–${clock(env, b.ends)} — ${who}${b.reason ? ", " + escape(b.reason) : ""}`;
}

async function roomText(env, chatId) {
  const t = now();
  const today = await all(
    env,
    "SELECT * FROM room_bookings WHERE chat_id = ? AND ends > ? AND starts < ? ORDER BY starts",
    chatId, t, localMidnight(env, 1)
  );
  const current = today.find((b) => b.starts <= t);
  let status = "Сейчас свободна.";
  if (current) status = `Сейчас занята до ${clock(env, current.ends)}.`;
  const lines = [];
  for (const b of today) lines.push(await roomLine(env, chatId, b));
  return (
    `<b>${ROOM_NAME}</b>\n${status}\n\n` +
    (lines.length ? `Сегодня:\n${lines.join("\n")}` : "Сегодня броней нет.") +
    "\n\nОткрой календарь, чтобы забронировать или посмотреть другие дни."
  );
}

async function pinnedText(env, chatId) {
  const busy = await busyMap(env, chatId);
  const counts = Object.entries(MACHINES).map(([mtype, cfg]) => {
    const free = NUMBERS.filter((n) => !busy.has(key(mtype, n))).length;
    return `${cfg.many} ${free} из ${NUMBERS.length}`;
  });
  return (
    "<b>Прачечная</b>\n" +
    `Свободно: ${counts.join(", ")}.\n\n` +
    "Открой приложение, чтобы занять машину, встать в очередь, забронировать " +
    "или отметить, что переложил чужие вещи."
  );
}

async function say(env, chatId, text, extra = {}, table = "boards") {
  const board = await first(env, `SELECT thread_id FROM ${table} WHERE chat_id = ?`, chatId);
  const thread = extra.message_thread_id !== undefined ? extra.message_thread_id : board ? board.thread_id : null;
  const payload = { chat_id: chatId, text, parse_mode: "HTML", ...extra };
  delete payload.message_thread_id;
  if (thread) payload.message_thread_id = thread;
  const res = await tg(env, "sendMessage", payload);
  if (res.ok || !thread || !/thread|topic/i.test(res.description || "")) return res;
  delete payload.message_thread_id;
  return tg(env, "sendMessage", payload);
}

async function placeBoard(env, table, chatId, text, markup, recreate, thread) {
  const board = await first(env, `SELECT * FROM ${table} WHERE chat_id = ?`, chatId);
  if (!board && thread === undefined) return;
  const target = thread !== undefined ? thread : board ? board.thread_id : null;
  if (board && !recreate) {
    if (board.text === text) return;
    const res = await tg(env, "editMessageText", { chat_id: chatId, message_id: board.message_id, text, parse_mode: "HTML", reply_markup: markup });
    const reason = res.description || "";
    if (res.ok || reason.includes("not modified")) {
      await env.DB.prepare(`UPDATE ${table} SET text = ? WHERE chat_id = ?`).bind(text, chatId).run();
      return;
    }
    if (res.error_code === 403) {
      await env.DB.prepare(`DELETE FROM ${table} WHERE chat_id = ?`).bind(chatId).run();
      return;
    }
    if (!/not found|can't be edited|MESSAGE_ID_INVALID/i.test(reason)) return;
  }
  if (board && recreate) await tg(env, "deleteMessage", { chat_id: chatId, message_id: board.message_id });
  const sent = await say(env, chatId, text, { reply_markup: markup, message_thread_id: target }, table);
  if (!sent.ok) {
    if (sent.error_code === 403) await env.DB.prepare(`DELETE FROM ${table} WHERE chat_id = ?`).bind(chatId).run();
    return;
  }
  const placed = sent.result.message_thread_id && sent.result.is_topic_message ? sent.result.message_thread_id : null;
  await env.DB.prepare(`INSERT OR REPLACE INTO ${table} (chat_id, message_id, text, thread_id) VALUES (?, ?, ?, ?)`)
    .bind(chatId, sent.result.message_id, text, placed).run();
  const pin = await tg(env, "pinChatMessage", { chat_id: chatId, message_id: sent.result.message_id, disable_notification: true });
  if (!pin.ok) await say(env, chatId, PIN_HELP, {}, table);
}

async function updatePinned(env, chatId, recreate = false, thread = undefined) {
  const markup = { inline_keyboard: [[{ text: "Открыть прачечную", url: await appLink(env, chatId) }]] };
  await placeBoard(env, "boards", chatId, await pinnedText(env, chatId), markup, recreate, thread);
}

async function updateRoomBoard(env, chatId, recreate = false, thread = undefined) {
  const markup = { inline_keyboard: [[{ text: "Открыть игровую", url: await appLink(env, chatId, "p") }]] };
  await placeBoard(env, "pboards", chatId, await roomText(env, chatId), markup, recreate, thread);
}

async function onWebhook(request, env) {
  if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) return new Response("Forbidden", { status: 403 });
  try {
    await onUpdate(await request.json(), env);
  } catch (e) {
    console.error("Update failed", e);
  }
  return new Response("ok");
}

async function onUpdate(update, env) {
  const msg = update.message;
  if (!msg) return;
  if (msg.migrate_to_chat_id) {
    await env.DB.batch(TABLES.map((t) => env.DB.prepare(`UPDATE ${t} SET chat_id = ? WHERE chat_id = ?`).bind(msg.migrate_to_chat_id, msg.chat.id)));
    await updatePinned(env, msg.migrate_to_chat_id, true);
    await updateRoomBoard(env, msg.migrate_to_chat_id, true);
    return;
  }
  if (!msg.text || !msg.text.startsWith("/")) return;
  const [command, target] = msg.text.trim().split(/\s+/)[0].split("@");
  if (target && target.toLowerCase() !== (await username(env)).toLowerCase()) return;
  if (!["/start", "/board", "/playroom"].includes(command)) return;
  const chat = msg.chat;
  if (chat.type === "private") {
    if (msg.from) await setDm(env, msg.from.id, true);
    await tg(env, "sendMessage", { chat_id: chat.id, text: command === "/start" ? HELP : `Отправь ${command} в групповом чате.` });
    return;
  }
  if (chat.type !== "group" && chat.type !== "supergroup") return;
  await tg(env, "deleteMessage", { chat_id: chat.id, message_id: msg.message_id });
  const thread = msg.is_topic_message && msg.message_thread_id ? msg.message_thread_id : null;
  if (command === "/playroom") await updateRoomBoard(env, chat.id, true, thread);
  else await updatePinned(env, chat.id, command === "/board", thread);
}

async function cronStatus(env) {
  const row = await first(env, "SELECT MAX(at) AS last, SUM(at > ?) AS recent FROM cron_log", now() - 15 * 60);
  const error = await first(env, "SELECT value FROM meta WHERE key = 'cron_error'");
  const lines = [];
  if (!row || !row.last) {
    lines.push("Таймер: ни разу не запускался — добавь Cron trigger «* * * * *» в настройках Worker (Settings → Trigger Events). После сохранения он может заработать только через 15 минут.");
  } else {
    const ago = Math.round(now() - row.last);
    const verdict = row.recent >= 12 ? "работает каждую минуту" : row.recent >= 1 ? "запускается реже, чем раз в минуту — проверь, что в Cron trigger стоит «* * * * *»" : "не запускался последние 15 минут";
    lines.push(`Таймер: ${verdict}. Запусков за 15 мин: ${row.recent} (нужно ~15), последний — ${ago} сек назад.`);
  }
  if (error) lines.push(`Последняя ошибка таймера: ${error.value}`);
  return lines.join("\n");
}

async function onSetup(url, env) {
  if (!env.WEBHOOK_SECRET || url.searchParams.get("key") !== env.WEBHOOK_SECRET) return new Response("Forbidden", { status: 403 });
  const hook = await tg(env, "setWebhook", {
    url: `${url.origin}/telegram`,
    secret_token: env.WEBHOOK_SECRET,
    allowed_updates: ["message"],
  });
  const name = await username(env);
  const profile = [
    await tg(env, "setMyDescription", { description: DESCRIPTION }),
    await tg(env, "setMyShortDescription", { short_description: SHORT_DESCRIPTION }),
    await tg(env, "setMyCommands", { commands: [{ command: "start", description: "Что умеет бот" }], scope: { type: "all_private_chats" } }),
    await tg(env, "setMyCommands", {
      commands: [
        { command: "board", description: "Закрепить прачечную в этой теме" },
        { command: "playroom", description: "Закрепить игровую в этой теме" },
      ],
      scope: { type: "all_chat_administrators" },
    }),
  ];
  const failed = profile.filter((r) => !r.ok).map((r) => r.description);
  const lines = [
    `Бот: ${name ? "@" + name : "не найден — проверь BOT_TOKEN"}`,
    `Вебхук: ${hook.ok ? "подключён" : "ошибка — " + hook.description}`,
    `Описание и команды бота: ${failed.length ? "ошибка — " + failed.join("; ") : "обновлены"}`,
    "База данных: готова",
    await cronStatus(env),
    `Адрес Mini App для BotFather: ${url.origin}/`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function hmac(secret, data) {
  const material = typeof secret === "string" ? encoder.encode(secret) : secret;
  const cryptoKey = await crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data)));
}

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function membership(env, chatId, userId) {
  const cacheKey = `${chatId}:${userId}`;
  const hit = memberCache.get(cacheKey);
  if (hit && now() - hit.at < MEMBER_CACHE_SECONDS) return hit;
  const res = await tg(env, "getChatMember", { chat_id: chatId, user_id: userId });
  if (!res.ok) return { inside: false, admin: false };
  const status = res.result.status;
  const admin = status === "creator" || status === "administrator";
  const inside = admin || status === "member" || (status === "restricted" && res.result.is_member);
  const entry = { inside, admin, at: now() };
  memberCache.set(cacheKey, entry);
  return entry;
}

async function remember(env, chatId, me) {
  const row = await first(env, "SELECT * FROM people WHERE chat_id = ? AND user_id = ?", chatId, me.id);
  if (row && row.name === me.name && row.username === me.username && now() - row.seen_at < 3600) return !!row.hidden;
  await env.DB.prepare(
    "INSERT INTO people (chat_id, user_id, name, username, hidden, seen_at) VALUES (?, ?, ?, ?, 0, ?) " +
      "ON CONFLICT (chat_id, user_id) DO UPDATE SET name = excluded.name, username = excluded.username, seen_at = excluded.seen_at"
  ).bind(chatId, me.id, me.name, me.username, now()).run();
  return !!(row && row.hidden);
}

async function authorize(request, env) {
  const params = new URLSearchParams(request.headers.get("X-Init-Data") || "");
  const hash = params.get("hash");
  if (!hash) throw new ApiError("Открой приложение через Telegram.", 401);
  params.delete("hash");
  const check = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = await hmac("WebAppData", env.BOT_TOKEN);
  if (hex(await hmac(secret, check)) !== hash) throw new ApiError("Открой приложение через Telegram.", 401);
  if (now() - Number(params.get("auth_date")) > INIT_DATA_TTL) throw new ApiError("Сессия устарела — закрой и открой приложение заново.", 401);
  const user = JSON.parse(params.get("user") || "null");
  if (!user) throw new ApiError("Открой приложение через Telegram.", 401);
  const start = (params.get("start_param") || "").match(/^(-?\d+)(?:_([a-z]))?$/);
  if (!start) throw new ApiError("Открой приложение кнопкой из закреплённого сообщения в чате.", 400);
  const chatId = Number(start[1]);
  const section = start[2] === "p" ? "playroom" : "laundry";
  const configured = await first(env, "SELECT 1 AS ok FROM boards WHERE chat_id = ? UNION SELECT 1 FROM pboards WHERE chat_id = ?", chatId, chatId);
  if (!configured) throw new ApiError("В этом чате бот не настроен. Админу нужно отправить /board или /playroom.", 404);
  const { inside, admin } = await membership(env, chatId, user.id);
  if (!inside) throw new ApiError("Приложение доступно только участникам чата.", 403);
  const me = { id: user.id, name: user.first_name, username: user.username ?? null };
  me.hidden = await remember(env, chatId, me);
  return { chatId, me, admin, section };
}

async function roomState(env, chatId, me, admin, view) {
  const days = roomDays(env);
  const rows = await all(
    env,
    "SELECT * FROM room_bookings WHERE chat_id = ? AND ends > ? AND starts < ? ORDER BY starts",
    chatId, days[0].start, days[days.length - 1].end
  );
  return {
    name: ROOM_NAME,
    step: ROOM_STEP_MINUTES,
    maxHours: ROOM_MAX_HOURS,
    reasonLength: ROOM_REASON_LENGTH,
    days,
    bookings: rows.map((r) => ({
      id: r.id,
      starts: r.starts,
      ends: r.ends,
      reason: r.reason || "",
      user: view(person(r)),
      mine: r.user_id === me.id,
    })),
  };
}

async function state(env, chatId, me, admin, section = "laundry") {
  const people = new Map((await all(env, "SELECT * FROM people WHERE chat_id = ?", chatId)).map((r) => [r.user_id, r]));
  const view = (p) => {
    if (!p) return null;
    if (!p.id || !people.get(p.id)?.hidden) return p;
    if (p.id === me.id) return { ...p, name: `${ANONYMOUS} (это ты)`, username: null };
    if (admin) return { id: null, name: `${p.username ? "@" + p.username : p.name} (скрыто)`, username: null };
    return { id: null, name: ANONYMOUS, username: null };
  };
  const busy = await busyMap(env, chatId);
  const nexts = new Map((await all(env, "SELECT * FROM nexts WHERE chat_id = ?", chatId)).map((r) => [key(r.mtype, r.num), r]));
  const bookingRows = await all(env, "SELECT * FROM bookings WHERE chat_id = ? ORDER BY at", chatId);
  const machines = [];
  for (const mtype of Object.keys(MACHINES)) {
    for (const num of NUMBERS) {
      const k = key(mtype, num);
      const row = busy.get(k);
      const item = { t: mtype, n: num, status: row ? row.kind : "free" };
      if (row) {
        const showReporter = row.kind !== "parked" || admin || row.reporter_id === me.id;
        Object.assign(item, { owner: view(person(row)), ends: row.ends_at, reporter: showReporter ? view(person(row, "reporter")) : null, finished: row.finished_at });
      }
      if (nexts.has(k)) item.next = view(person(nexts.get(k)));
      const booked = bookingRows.find((b) => b.mtype === mtype && b.num === num);
      if (booked) item.booking = { id: booked.id, at: booked.at, user: view(person(booked)) };
      machines.push(item);
    }
  }
  const queue = {};
  for (const mtype of Object.keys(MACHINES)) queue[mtype] = (await queueOf(env, chatId, mtype)).map((r) => view(person(r)));
  const bookings = bookingRows.map((r) => ({ id: r.id, t: r.mtype, n: r.num, at: r.at, user: view(person(r)) }));
  const moved = (await all(env, "SELECT * FROM moved WHERE chat_id = ? AND at >= ? ORDER BY at DESC", chatId, now() - CLOTHES_HOURS * 3600)).map((r) => ({
    id: r.id,
    owner: view(person(r, "owner")),
    mover: admin ? view(person(r, "mover")) : null,
    byMe: r.mover_id === me.id,
    from: { t: r.from_mtype, n: r.from_num },
    to: r.to_mtype ? { t: r.to_mtype, n: r.to_num } : null,
    at: r.at,
  }));
  const cutoff = now() - PEOPLE_DAYS * 86400;
  const choices = [...people.values()]
    .filter((r) => r.user_id !== me.id && !r.hidden && r.seen_at >= cutoff)
    .map((r) => ({ id: r.user_id, name: r.name, username: r.username }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  return {
    now: now(),
    me: { ...me, admin },
    types: MACHINES,
    walls: WALLS,
    numbers: NUMBERS,
    ironing: IRONING_BOARD,
    claim: CLAIM_MINUTES,
    bookingGap: BOOKING_GAP_MINUTES,
    machines,
    queue,
    bookings,
    moved,
    people: choices,
    bot: await username(env),
    dm: (await first(env, "SELECT ok FROM dm WHERE user_id = ?", me.id))?.ok ?? null,
    slots: slots(env),
    tomorrow: localMidnight(env, 1),
    tz: env.TZ_NAME || "Asia/Yekaterinburg",
    section,
    sections: {
      laundry: !!(await first(env, "SELECT 1 AS ok FROM boards WHERE chat_id = ?", chatId)),
      playroom: !!(await first(env, "SELECT 1 AS ok FROM pboards WHERE chat_id = ?", chatId)),
    },
    room: await roomState(env, chatId, me, admin, view),
  };
}

async function roomAnnounce(env, chatId, text) {
  if (await first(env, "SELECT 1 AS ok FROM pboards WHERE chat_id = ?", chatId)) await say(env, chatId, text, {}, "pboards");
}

function machineArg(body, prefix = "") {
  const mtype = body[`${prefix}t`];
  const num = Number(body[`${prefix}n`]);
  if (!MACHINES[mtype] || !NUMBERS.includes(num)) throw new ApiError("Некорректный запрос.");
  return [mtype, num];
}

function typeArg(body) {
  if (!MACHINES[body.t]) throw new ApiError("Некорректный запрос.");
  return body.t;
}

const ACTIONS = {
  async take(env, chatId, me, admin, body) {
    const [mtype, num] = machineArg(body);
    const minutes = parseMinutes(body.time ?? "");
    if (minutes === null) return `Не понял время. Введи как на дисплее: 1:05 или 45 (от 1 до ${MAX_MINUTES} минут).`;
    let owner = me;
    let reporter = null;
    if (body.owner === "unknown") {
      owner = UNKNOWN;
      reporter = me;
    } else if (body.owner != null && body.owner !== "me" && Number(body.owner) !== me.id) {
      const p = await first(env, "SELECT * FROM people WHERE chat_id = ? AND user_id = ?", chatId, Number(body.owner));
      if (!p) return "Не нашёл этого человека.";
      owner = { id: p.user_id, name: p.name, username: p.username };
      reporter = me;
    }
    const row = await getMachine(env, chatId, mtype, num);
    if (row && !(["hold", "done"].includes(row.kind) && row.user_id === owner.id)) {
      return row.kind === "done" || row.kind === "parked"
        ? `В ${MACHINES[mtype].acc} ${num} ещё лежат чужие вещи. Их нужно забрать или переложить.`
        : `${mname(mtype, num)} уже занята.`;
    }
    const t = now();
    const booked = await upcomingBooking(env, chatId, mtype, num, owner.id);
    if (booked && t + minutes * 60 > booked.at) {
      return `${mname(mtype, num)} забронирована на ${clock(env, booked.at)}, а программа закончится позже. Выбери другую машину.`;
    }
    if (!(await occupy(env, chatId, mtype, num, owner, t, t + minutes * 60, "run", reporter))) return `${mname(mtype, num)} уже занята.`;
    await env.DB.batch([
      env.DB.prepare("DELETE FROM bookings WHERE chat_id = ? AND mtype = ? AND num = ? AND user_id = ?").bind(chatId, mtype, num, owner.id),
      env.DB.prepare("DELETE FROM queue WHERE chat_id = ? AND mtype = ? AND user_id = ?").bind(chatId, mtype, owner.id),
    ]);
    if (reporter && owner.id) {
      await notice(env, chatId, owner, `${mname(mtype, num)} отмечена как занятая твоими вещами (отметил: ${await label(env, chatId, me)}). Напомню, когда закончит.`);
    }
    return null;
  },

  async claim(env, chatId, me, admin, body) {
    const [mtype, num] = machineArg(body);
    const row = await getMachine(env, chatId, mtype, num);
    if (!row || row.kind === "hold" || row.user_id) return "У этой машины уже есть хозяин.";
    const ok = await changed(
      env,
      "UPDATE machines SET user_id = ?, user_name = ?, username = ? WHERE chat_id = ? AND mtype = ? AND num = ? AND user_id = 0",
      me.id, me.name, me.username, chatId, mtype, num
    );
    return ok ? null : "У этой машины уже есть хозяин.";
  },

  async free(env, chatId, me, admin, body) {
    const [mtype, num] = machineArg(body);
    const row = await getMachine(env, chatId, mtype, num);
    if (!row) return `${mname(mtype, num)} уже свободна.`;
    if (row.user_id !== me.id && row.reporter_id !== me.id && !admin) {
      return "Освободить может хозяин вещей, тот, кто отметил машину, или админ чата.";
    }
    if (!(await changed(env, "DELETE FROM machines WHERE chat_id = ? AND mtype = ? AND num = ? AND started_at = ?", chatId, mtype, num, row.started_at))) {
      return `${mname(mtype, num)} уже свободна.`;
    }
    if (row.kind === "parked") {
      await env.DB.prepare("DELETE FROM moved WHERE chat_id = ? AND to_mtype = ? AND to_num = ? AND owner_id = ?").bind(chatId, mtype, num, row.user_id).run();
    } else if (row.user_id && row.user_id !== me.id) {
      await notice(env, chatId, person(row), `${MACHINES[mtype].acc} ${num} освободили. Кто: ${await label(env, chatId, me)}.`);
    }
    await handoff(env, chatId, mtype, num);
    return null;
  },

  async queue(env, chatId, me, admin, body) {
    const mtype = typeArg(body);
    const cfg = MACHINES[mtype];
    if (await position(env, chatId, mtype, me.id)) return `Ты уже в очереди на ${cfg.acc}.`;
    const busy = await busyMap(env, chatId);
    const soon = await bookedSoon(env, chatId, mtype);
    const anyFree = NUMBERS.some((n) => !busy.has(key(mtype, n)) && !soon.has(n));
    if (anyFree && !(await queueOf(env, chatId, mtype)).length) return `Есть свободная ${cfg.name.toLowerCase()} — просто займи её.`;
    await enqueue(env, chatId, mtype, me, 1);
    await dispatch(env, chatId, mtype);
    return null;
  },

  async unqueue(env, chatId, me, admin, body) {
    await env.DB.prepare("DELETE FROM queue WHERE chat_id = ? AND mtype = ? AND user_id = ?").bind(chatId, typeArg(body), me.id).run();
    return null;
  },

  async next(env, chatId, me, admin, body) {
    const [mtype, num] = machineArg(body);
    const cfg = MACHINES[mtype];
    const row = await getMachine(env, chatId, mtype, num);
    if (!row || row.kind === "hold") return `${mname(mtype, num)} сейчас не занята — можно просто занять её.`;
    if (row.user_id === me.id) return "Это твоя машина.";
    if (await first(env, "SELECT 1 FROM nexts WHERE chat_id = ? AND mtype = ? AND user_id = ?", chatId, mtype, me.id)) {
      return `У тебя уже есть бронь на ${cfg.acc} после программы.`;
    }
    try {
      await env.DB.prepare("INSERT INTO nexts (chat_id, mtype, num, user_id, user_name, username) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(chatId, mtype, num, me.id, me.name, me.username ?? null).run();
    } catch (e) {
      return "Эту машину уже забронировали.";
    }
    return null;
  },

  async unnext(env, chatId, me, admin, body) {
    const [mtype, num] = machineArg(body);
    await env.DB.prepare("DELETE FROM nexts WHERE chat_id = ? AND mtype = ? AND num = ? AND user_id = ?").bind(chatId, mtype, num, me.id).run();
    return null;
  },

  async book(env, chatId, me, admin, body) {
    const mtype = typeArg(body);
    const at = Number(body.at);
    const cfg = MACHINES[mtype];
    if (!slots(env).includes(at)) return "Это время уже недоступно — выбери другое.";
    if (await first(env, "SELECT 1 FROM bookings WHERE chat_id = ? AND mtype = ? AND user_id = ?", chatId, mtype, me.id)) {
      return `У тебя уже есть бронь на ${cfg.acc}.`;
    }
    const free = await bookableNumbers(env, chatId, mtype, at);
    if (!free.length) return `На ${clock(env, at)} все ${cfg.title.toLowerCase()} заняты или забронированы — выбери другое время.`;
    let num = free[0];
    if (body.n != null && body.n !== "any") {
      num = Number(body.n);
      if (!free.includes(num)) return `${mname(mtype, num)} на это время недоступна — выбери другую.`;
    }
    await env.DB.prepare("INSERT INTO bookings (chat_id, mtype, user_id, user_name, username, at, num) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(chatId, mtype, me.id, me.name, me.username ?? null, at, num).run();
    return null;
  },

  async unbook(env, chatId, me, admin, body) {
    const row = await first(env, "SELECT * FROM bookings WHERE id = ? AND chat_id = ?", Number(body.id), chatId);
    if (row && (row.user_id === me.id || admin)) await env.DB.prepare("DELETE FROM bookings WHERE id = ?").bind(row.id).run();
    return null;
  },

  async move(env, chatId, me, admin, body) {
    const src = machineArg(body, "f");
    const dest = body.to === "machine" ? machineArg(body, "t") : null;
    const row = await getMachine(env, chatId, ...src);
    if (!row || (row.kind !== "done" && row.kind !== "parked")) return "В этой машине нет оставленных вещей.";
    if (dest) {
      if (key(...dest) === key(...src)) return "Выбери другую машину.";
      if (await getMachine(env, chatId, ...dest)) return `${mname(...dest)} занята.`;
    }
    const ownerP = person(row);
    if (dest && !(await occupy(env, chatId, ...dest, ownerP, now(), now() + CLOTHES_HOURS * 3600, "parked", me))) {
      return `${mname(...dest)} занята.`;
    }
    if (!(await changed(env, "DELETE FROM machines WHERE chat_id = ? AND mtype = ? AND num = ? AND started_at = ?", chatId, ...src, row.started_at))) {
      if (dest) await env.DB.prepare("DELETE FROM machines WHERE chat_id = ? AND mtype = ? AND num = ? AND kind = 'parked'").bind(chatId, ...dest).run();
      return "Эти вещи уже переложили.";
    }
    await env.DB.prepare("DELETE FROM moved WHERE chat_id = ? AND to_mtype = ? AND to_num = ?").bind(chatId, ...src).run();
    await env.DB.prepare(
      "INSERT INTO moved (chat_id, owner_id, owner_name, owner_username, from_mtype, from_num, to_mtype, to_num, mover_id, mover_name, mover_username, at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(chatId, ownerP.id, ownerP.name, ownerP.username ?? null, ...src, dest ? dest[0] : null, dest ? dest[1] : null, me.id, me.name, me.username ?? null, now()).run();
    if (ownerP.id && ownerP.id !== me.id) {
      const where = dest ? `в ${capitalize(MACHINES[dest[0]].acc)} ${dest[1]}` : "на гладильную доску";
      await notice(
        env,
        chatId,
        ownerP,
        `твои вещи из ${MACHINES[src[0]].gen} ${src[1]} переложили ${where}. Когда заберёшь, отметь это в приложении.`,
        true
      );
    }
    await handoff(env, chatId, ...src);
    return null;
  },

  async picked(env, chatId, me, admin, body) {
    const item = await first(env, "SELECT * FROM moved WHERE id = ? AND chat_id = ?", Number(body.id), chatId);
    if (!item) return null;
    if (me.id !== item.owner_id && me.id !== item.mover_id && !admin) return "Отметить может хозяин вещей, тот, кто их переложил, или админ.";
    await env.DB.prepare("DELETE FROM moved WHERE id = ?").bind(item.id).run();
    if (item.to_mtype) {
      const freed = await changed(
        env,
        "DELETE FROM machines WHERE chat_id = ? AND mtype = ? AND num = ? AND kind = 'parked' AND user_id = ?",
        chatId, item.to_mtype, item.to_num, item.owner_id
      );
      if (freed) await handoff(env, chatId, item.to_mtype, item.to_num);
    }
    return null;
  },

  async privacy(env, chatId, me, admin, body) {
    const hidden = body.hidden ? 1 : 0;
    await env.DB.prepare("UPDATE people SET hidden = ? WHERE chat_id = ? AND user_id = ?").bind(hidden, chatId, me.id).run();
    me.hidden = !!hidden;
    return null;
  },

  async room_book(env, chatId, me, admin, body) {
    const starts = Number(body.starts);
    const ends = Number(body.ends);
    const step = ROOM_STEP_MINUTES * 60;
    const days = roomDays(env);
    if (!Number.isInteger(starts) || !Number.isInteger(ends) || starts % step || ends % step) throw new ApiError("Некорректный запрос.");
    if (starts < Math.floor(now() / step) * step) return "Это время уже прошло — выбери другое.";
    if (ends <= starts) return "Конец брони должен быть позже начала.";
    if (ends - starts > ROOM_MAX_HOURS * 3600) return `Бронь — не дольше ${ROOM_MAX_HOURS} ч.`;
    if (starts >= days[days.length - 1].end) return `Бронировать можно не дальше чем на ${ROOM_DAYS} дней вперёд.`;
    const reason = String(body.reason ?? "").replace(/\s+/g, " ").trim().slice(0, ROOM_REASON_LENGTH);
    const res = await env.DB.prepare(
      "INSERT INTO room_bookings (chat_id, user_id, user_name, username, starts, ends, reason, created_at) " +
        "SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM room_bookings WHERE chat_id = ? AND starts < ? AND ends > ?)"
    ).bind(chatId, me.id, me.name, me.username ?? null, starts, ends, reason || null, now(), chatId, ends, starts).run();
    if (!res.meta.changes) {
      const clash = await first(env, "SELECT * FROM room_bookings WHERE chat_id = ? AND starts < ? AND ends > ? ORDER BY starts LIMIT 1", chatId, ends, starts);
      return `Это время пересекается с бронью ${clock(env, clash.starts)}–${clock(env, clash.ends)}. Выбери другое.`;
    }
    const who = await plainName(env, chatId, me);
    await roomAnnounce(env, chatId, `${ROOM_NAME} забронирована: ${dayLabel(env, starts)}, ${clock(env, starts)}–${clock(env, ends)} — ${who}${reason ? ", " + escape(reason) : ""}.`);
    return null;
  },

  async admin_reset_laundry(env, chatId, me, admin, body) {
    if (!admin) return "Это могут только админы чата.";
    await env.DB.batch(
      ["machines", "queue", "nexts", "bookings", "moved"].map((t) => env.DB.prepare(`DELETE FROM ${t} WHERE chat_id = ?`).bind(chatId))
    );
    await say(env, chatId, "Админ сбросил статусы прачечной: все машины свободны, очередь и брони очищены.");
    return null;
  },

  async admin_reset_room(env, chatId, me, admin, body) {
    if (!admin) return "Это могут только админы чата.";
    await env.DB.prepare("DELETE FROM room_bookings WHERE chat_id = ? AND ends > ?").bind(chatId, now()).run();
    await roomAnnounce(env, chatId, "Админ отменил все брони игровой.");
    return null;
  },

  async room_cancel(env, chatId, me, admin, body) {
    const row = await first(env, "SELECT * FROM room_bookings WHERE id = ? AND chat_id = ?", Number(body.id), chatId);
    if (!row) return "Эта бронь уже отменена.";
    if (row.user_id !== me.id && !admin) return "Отменить может только тот, кто бронировал, или админ чата.";
    await env.DB.prepare("DELETE FROM room_bookings WHERE id = ?").bind(row.id).run();
    const by = row.user_id === me.id ? "" : " (отменено админом)";
    await roomAnnounce(env, chatId, `Бронь игровой отменена: ${dayLabel(env, row.starts)}, ${clock(env, row.starts)}–${clock(env, row.ends)}${by}.`);
    return null;
  },
};

async function apiState(request, env) {
  const { chatId, me, admin, section } = await authorize(request, env);
  await tick(env);
  return json(await state(env, chatId, me, admin, section));
}

async function apiAction(request, env) {
  const { chatId, me, admin, section } = await authorize(request, env);
  let body;
  try {
    body = await request.json();
  } catch (e) {
    throw new ApiError("Некорректный запрос.");
  }
  const action = Object.hasOwn(ACTIONS, body.action) ? ACTIONS[body.action] : null;
  if (!action) throw new ApiError("Некорректный запрос.");
  await tick(env);
  const error = await action(env, chatId, { id: me.id, name: me.name, username: me.username }, admin, body);
  if (error) throw new ApiError(error);
  if (body.action === "privacy") me.hidden = !!body.hidden;
  await updatePinned(env, chatId);
  await updateRoomBoard(env, chatId);
  return json(await state(env, chatId, me, admin, section));
}

