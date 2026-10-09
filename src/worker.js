import PAGE from "../webapp/index.html";

const WARN_MINUTES = 15;
const MAX_MINUTES = 300;
const CLAIM_MINUTES = 10;
const SLOT_MINUTES = 30;
const BOOK_DAYS = 2;
const CLOTHES_HOURS = 12;
const LOG_DAYS = 90;
const BOOKING_GAP_MINUTES = 90;
const ROOM_NAME = "Игровая";
const ROOM_GEN = "игровой";
const ROOM_REMIND_HOUR = 18;
const ROOM_SOON_MINUTES = 30;
const ROOM_DAYS = 90;
const ROOM_STEP_MINUTES = 30;
const ROOM_MAX_HOURS = 12;
const ROOM_REASON_LENGTH = 100;
const ROOM_CAPACITY_MAX = 100;
const INIT_DATA_TTL = 24 * 3600;
const MEMBER_CACHE_SECONDS = 600;
const MEMBER_CACHE_MAX = 500;
const AUTH_CACHE_SECONDS = 300;
const AUTH_CACHE_MAX = 200;
const SWEEP_SECONDS = 600;
const RECENT_SECONDS = 120;
const SCHEMA_VERSION = 5;
const ROOM_USER_BOOKINGS = 3;
const INIT_DATA_MAX = 4096;
const API_BODY_MAX = 8 * 1024;
const WEBHOOK_BODY_MAX = 1024 * 1024;
const FLOOD_BLOCK_MINUTES = 30;
const BLOCK_CACHE_SECONDS = 60;
const BLOCK_CACHE_MAX = 500;
const HITS_MAX = 10000;
const BLOCK_MAX_DAYS = 365;

const LIMITS = {
  state: { limit: 60, seconds: 60, scaled: true },
  action: { limit: 20, seconds: 60, scaled: true },
  fail: { limit: 30, seconds: 600, scaled: true },
  strike: { limit: 20, seconds: 600 },
  room: { limit: 6, seconds: 600 },
  nudge: { limit: 5, seconds: 3600 },
  command: { limit: 5, seconds: 60 },
  tap: { limit: 20, seconds: 60 },
  problem: { limit: 5, seconds: 3600 },
};

const WALLS = [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11]];

const MACHINES = {
  w: { name: "Стиралка", title: "Стиралки", acc: "стиралку", gen: "Стиралки", prep: "стиралке", many: "стиралок" },
  d: { name: "Сушилка", title: "Сушилки", acc: "сушилку", gen: "Сушилки", prep: "сушилке", many: "сушилок" },
};

const IRONING_BOARD = "Гладильная доска";
const ANONYMOUS = "Аноним";
const NOT_FROM_TELEGRAM = "Открой приложение через Telegram.";

const HELP =
  "Привет! Я бот техэтажа общаги.\n\n" +
  "Прачечная — стиралки и сушилки: что свободно, кто занял и сколько осталось, очередь, бронь, " +
  "напоминания и отметки «внутри чужие вещи, программа не запущена» и «переложил чужие вещи».\n\n" +
  "Как пользоваться: в чате общаги открой тему про стирку и нажми кнопку «Открыть прачечную» " +
  "в закреплённом сообщении.\n\n" +
  "Уведомления: напоминания про стирку приходят сюда, в личку. Теперь я могу тебе писать.\n\n" +
  "Что-то не работает? Отправь /problem и опиши проблему.";

const ROOM_HELP =
  "Привет! Я бот техэтажа общаги.\n\n" +
  "• Прачечная — стиралки и сушилки: что свободно, кто занял и сколько осталось, очередь, бронь, " +
  "напоминания и отметки «внутри чужие вещи, программа не запущена» и «переложил чужие вещи».\n" +
  "• Игровая — календарь: свободна ли она сейчас, брони на любой день и бронь своего времени. " +
  "Бронь может быть открытым событием — тогда любой может нажать «Я приду».\n\n" +
  "Как пользоваться: в чате общаги открой тему про стирку или про игровую и нажми кнопку " +
  "в закреплённом сообщении — «Открыть прачечную» или «Открыть игровую».\n\n" +
  "Уведомления: напоминания про стирку и про брони игровой приходят сюда, в личку — " +
  "вечером накануне я спрошу, нужна ли бронь на завтра, и напомню за полчаса до начала. " +
  "Теперь я могу тебе писать.\n\n" +
  "Что-то не работает? Отправь /problem и опиши проблему.";

const PROBLEM_ASK = "Опиши проблему одним сообщением";
const PROBLEM_FILE_MB = 20;
const PROBLEM_PROMPT = `${PROBLEM_ASK} в ответ на это — можно приложить скриншот (JPG, PNG, WebP), PDF или видео (MP4) до ${PROBLEM_FILE_MB} МБ. Я передам её администратору бота.`;
const PROBLEM_INPUT = { force_reply: true, input_field_placeholder: "Что случилось?" };
const PROBLEM_LENGTH = 3500;
const PROBLEM_FILES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"];
const PROBLEM_HEAD = /^Проблема от .+ \(id (\d+)\):/;
const ANSWER_HEAD = "Ответ администратора бота:";
const ANSWER_TAIL = "Чтобы написать ещё, ответь на это сообщение.";

const DESCRIPTION =
  "Бот прачечной техэтажа общаги.\n\n" +
  "Стиралки и сушилки: кто занял и сколько осталось, вещи без программы, очередь, бронь и напоминания.\n\n" +
  "Открывай приложение кнопкой из закреплённого сообщения в чате общаги.";

const ROOM_DESCRIPTION =
  "Бот техэтажа общаги.\n\n" +
  "Прачечная: стиралки и сушилки, кто занял и сколько осталось, вещи без программы, очередь, бронь и напоминания.\n" +
  "Игровая: календарь броней — посмотреть, свободна ли, забронировать время, устроить открытое событие или записаться на чужое.\n\n" +
  "Открывай приложение кнопкой из закреплённых сообщений в чате общаги.";

const SHORT_DESCRIPTION = "Прачечная техэтажа: кто занял стиралку или сушилку, очередь, брони и напоминания.";

const ROOM_SHORT_DESCRIPTION = "Прачечная и игровая техэтажа: кто занял, очередь, брони и напоминания.";

const FOREIGN_CHAT = "Этот бот работает только в чате общаги техэтажа.";

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
    starts REAL NOT NULL, ends REAL NOT NULL, reason TEXT, created_at REAL NOT NULL,
    asked INTEGER NOT NULL DEFAULT 0, warned INTEGER NOT NULL DEFAULT 0, public INTEGER NOT NULL DEFAULT 0, capacity INTEGER)`,
  `CREATE TABLE IF NOT EXISTS room_joins (
    booking_id INTEGER NOT NULL, chat_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, user_name TEXT NOT NULL, username TEXT,
    created_at REAL NOT NULL, warned INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (booking_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS blocks (
    chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, until REAL, reason TEXT NOT NULL,
    by_id INTEGER, created_at REAL NOT NULL,
    PRIMARY KEY (chat_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, at REAL NOT NULL, action TEXT NOT NULL,
    actor_id INTEGER, actor_name TEXT, actor_username TEXT, mtype TEXT, num INTEGER,
    owner_id INTEGER, owner_name TEXT, owner_username TEXT, details TEXT)`,
  `CREATE INDEX IF NOT EXISTS events_chat_at ON events (chat_id, at)`,
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
  "ALTER TABLE room_bookings ADD COLUMN asked INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE room_bookings ADD COLUMN warned INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE room_bookings ADD COLUMN public INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE room_bookings ADD COLUMN capacity INTEGER",
];

const NUMBERS = WALLS.flat();
const TABLES = ["machines", "boards", "queue", "nexts", "bookings", "moved", "people", "pboards", "room_bookings", "room_joins", "blocks", "events"];
const UNKNOWN = { id: 0, name: "неизвестно", username: null };

const LEFTOVER = new Set(["done", "parked", "loaded"]);
const REPLACEABLE = new Set(["hold", "done", "loaded"]);
const ROOM_ACTIONS = new Set(["room_book", "room_edit", "room_cancel", "room_join", "room_leave", "admin_reset_room", "privacy"]);
const PLAYROOM_ONLY = new Set(["room_book", "room_edit", "room_cancel", "room_join", "room_leave", "admin_reset_room"]);
const ANNOUNCING = new Set(["room_book", "room_edit", "room_cancel"]);
const COMMANDS = ["/start", "/problem", "/board", "/playroom", "/unpin", "/block", "/unblock", "/blocked"];

const memberCache = new Map();
const authCache = new Map();
const blockCache = new Map();
const hits = new Map();
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let botUsername = null;
let schemaReady = false;
let initDataKey = null;
let cleanupAt = 0;
let roomSweepAt = 0;

function fingerprint(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

const PAGE_ETAG = '"' + fingerprint(PAGE) + '"';

function cacheGet(map, k, ttl) {
  const hit = map.get(k);
  if (!hit || now() - hit.at > ttl) return null;
  return hit.data;
}

function cacheSet(map, k, data, max) {
  map.set(k, { at: now(), data });
  if (map.size > max) map.delete(map.keys().next().value);
}

function limitOf(env, name) {
  const { limit, seconds, scaled } = LIMITS[name];
  const scale = Number(env.RATE_LIMIT_SCALE) > 0 ? Number(env.RATE_LIMIT_SCALE) : 1;
  return { limit: scaled ? Math.round(limit * scale) : limit, seconds };
}

function meter(env, name, id) {
  const { limit, seconds } = limitOf(env, name);
  const k = `${name}:${id}`;
  const t = now();
  let entry = hits.get(k);
  if (!entry || t - entry.at >= seconds) {
    entry = { at: t, n: 0 };
    hits.delete(k);
    hits.set(k, entry);
    if (hits.size > HITS_MAX) hits.delete(hits.keys().next().value);
  }
  return { entry, limit, retry: Math.max(1, Math.ceil(entry.at + seconds - t)) };
}

function full(env, name, id) {
  const { entry, limit, retry } = meter(env, name, id);
  return entry.n >= limit ? retry : 0;
}

function spend(env, name, id) {
  const { entry, limit, retry } = meter(env, name, id);
  entry.n += 1;
  return entry.n > limit ? retry : 0;
}

function same(a, b) {
  const x = encoder.encode(String(a ?? ""));
  const y = encoder.encode(String(b ?? ""));
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function readBody(request, limit) {
  if (Number(request.headers.get("Content-Length")) > limit) throw new ApiError("Слишком большой запрос.", 413);
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new ApiError("Слишком большой запрос.", 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return decoder.decode(bytes);
}

async function readObject(request, limit) {
  let body;
  try {
    body = JSON.parse(await readBody(request, limit));
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Некорректный запрос.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Некорректный запрос.");
  return body;
}

class ApiError extends Error {
  constructor(message, status = 400, retry = 0) {
    super(message);
    this.status = status;
    this.retry = retry;
  }
}

function tooMany(retry) {
  return new ApiError(`Слишком много запросов — подожди ${retry} сек.`, 429, retry);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ip = request.headers.get("CF-Connecting-IP") || "";
    try {
      if (url.pathname === "/") return page(request);
      if (url.pathname === "/telegram" && request.method === "POST") return await onWebhook(request, env, ip);
      if (url.pathname === "/setup") return await onSetup(url, env, ip);
      if (url.pathname === "/api/state") return await apiState(request, env);
      if (url.pathname === "/api/action" && request.method === "POST") return await apiAction(request, env);
      return respond("Not found", 404);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.message === NOT_FROM_TELEGRAM) spend(env, "fail", ip);
        return json({ error: e.message }, e.status, e.retry ? { "Retry-After": String(e.retry) } : {});
      }
      console.error(e);
      return json({ error: "Ошибка сервера, попробуй ещё раз." }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(cronRun(env));
  },
};

function page(request) {
  const headers = { ...SAFE_HEADERS, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache", ETag: PAGE_ETAG };
  if (request.headers.get("If-None-Match") === PAGE_ETAG) return new Response(null, { status: 304, headers });
  return new Response(PAGE, { headers });
}

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
  await env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('cron_done', ?)").bind(now()).run();
}

const now = () => Date.now() / 1000;
const playroom = (env) => env.PLAYROOM === "on";
const allowedChats = (env) => String(env.ALLOWED_CHATS || "").split(/[\s,]+/).filter(Boolean);
const allowed = (env, chatId) => {
  const list = allowedChats(env);
  return !list.length || list.includes(String(chatId));
};
const formatters = new Map();

function fmt(env, locale, options) {
  const id = `${locale}|${JSON.stringify(options)}`;
  if (!formatters.has(id)) formatters.set(id, new Intl.DateTimeFormat(locale, { timeZone: env.TZ_NAME || "Asia/Yekaterinburg", ...options }));
  return formatters.get(id);
}
const key = (mtype, num) => `${mtype}:${num}`;
const SAFE_HEADERS = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...SAFE_HEADERS, "Content-Type": "application/json", "Cache-Control": "no-store", ...extra } });
const respond = (body, status = 200) =>
  new Response(body, { status, headers: { ...SAFE_HEADERS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function ensureSchema(env) {
  if (schemaReady) return;
  let version = null;
  try {
    const out = await env.DB.batch([
      ...SCHEMA.map((sql) => env.DB.prepare(sql)),
      env.DB.prepare("SELECT value AS v FROM meta WHERE key = 'schema'"),
    ]);
    version = out[out.length - 1].results[0]?.v ?? null;
  } catch (e) {
    await env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)));
  }
  if (Number(version) !== SCHEMA_VERSION) {
    for (const sql of MIGRATIONS) {
      try {
        await env.DB.prepare(sql).run();
      } catch (e) {
        if (!/duplicate column/i.test(String(e))) throw e;
      }
    }
    await env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema', ?)").bind(SCHEMA_VERSION).run();
  }
  schemaReady = true;
}

const q = (env, sql, ...args) => (args.length ? env.DB.prepare(sql).bind(...args) : env.DB.prepare(sql));

async function batch(env, ...statements) {
  return (await env.DB.batch(statements)).map((r) => r.results ?? []);
}

async function all(env, sql, ...args) {
  return (await q(env, sql, ...args).all()).results;
}

function first(env, sql, ...args) {
  return q(env, sql, ...args).first();
}

async function changed(env, sql, ...args) {
  return (await q(env, sql, ...args).run()).meta.changes > 0;
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

async function audit(env, chatId, action, actor, trail = {}) {
  const owner = trail.owner ?? null;
  const entry = {
    chat: chatId, action, actor: actor ? { id: actor.id, name: actor.name, username: actor.username ?? null } : "system",
    mtype: trail.mtype ?? null, num: trail.num ?? null, owner, ...(trail.details ?? {}),
  };
  console.log(JSON.stringify({ event: entry }));
  try {
    await env.DB.prepare(
      "INSERT INTO events (chat_id, at, action, actor_id, actor_name, actor_username, mtype, num, owner_id, owner_name, owner_username, details) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      chatId, now(), action, actor?.id ?? null, actor?.name ?? null, actor?.username ?? null, trail.mtype ?? null, trail.num ?? null,
      owner?.id ?? null, owner?.name ?? null, owner?.username ?? null, trail.details ? JSON.stringify(trail.details) : null
    ).run();
  } catch (e) {
    console.error("Audit failed", e);
  }
}

function machineTrail(row) {
  return {
    mtype: row.mtype, num: row.num, owner: row.user_id ? person(row) : null,
    details: { kind: row.kind, started_at: row.started_at, ends_at: row.ends_at, finished_at: row.finished_at ?? null, reporter: person(row, "reporter") },
  };
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
  const bound = (n) => (n >= 1 && n <= MAX_MINUTES ? n : null);
  const raw = String(text).trim().toLowerCase();
  if (/\d\s+\d/.test(raw)) return null;
  const t = raw.replace(/\s+/g, "");
  let match = t.match(/^(\d{1,2})[:чh](\d{1,2})$/);
  if (match) {
    if (Number(match[2]) >= 60) return null;
    return bound(Number(match[1]) * 60 + Number(match[2]));
  }
  match = t.match(/^(\d{1,2})[.,](\d{1,2})(ч|h|час[а-я]*)?$/);
  if (match) {
    if (match[2].length === 1 || match[3]) return bound(Math.round(Number(`${match[1]}.${match[2]}`) * 60));
    if (Number(match[2]) >= 60) return null;
    return bound(Number(match[1]) * 60 + Number(match[2]));
  }
  match = t.match(/^(\d{1,2})(?:ч|h|час[а-я]*)$/);
  if (match) return bound(Number(match[1]) * 60);
  match = t.match(/^(\d{1,3})(?:мин[а-я]*|м|m)?$/);
  if (match) return bound(Number(match[1]));
  return null;
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

async function mention(env, chatId, p, text) {
  const who = (await isHidden(env, chatId, p.id)) ? `<a href="tg://user?id=${p.id}">${ANONYMOUS}</a>` : tag(p);
  await say(env, chatId, `${who}, ${text}`);
}

async function notice(env, chatId, p, text) {
  if (!p || !p.id) return;
  const markup = { inline_keyboard: [[{ text: "Открыть прачечную", url: await appLink(env, chatId) }]] };
  const dm = await tg(env, "sendMessage", { chat_id: p.id, text: capitalize(text), parse_mode: "HTML", reply_markup: markup });
  if (dm.ok) {
    await setDm(env, p.id, true);
    return;
  }
  if (dm.error_code === 403 || /chat not found/i.test(dm.description || "")) await setDm(env, p.id, false);
  await mention(env, chatId, p, text);
}

async function nudge(env, chatId, from, p, text) {
  if (!p || !p.id) return;
  if (p.id !== from.id && spend(env, "nudge", `${from.id}:${p.id}`)) return;
  await notice(env, chatId, p, text);
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

async function occupy(env, chatId, mtype, num, p, started, ends, kind = "run", reporter = null, replaces = null) {
  const insert = env.DB.prepare(
    "INSERT INTO machines (chat_id, mtype, num, user_id, user_name, username, started_at, ends_at, kind, warned, reporter_id, reporter_name, reporter_username) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)"
  ).bind(chatId, mtype, num, p.id, p.name, p.username ?? null, started, ends, kind, reporter ? reporter.id : null, reporter ? reporter.name : null, reporter ? reporter.username ?? null : null);
  try {
    if (replaces === null) await insert.run();
    else {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM machines WHERE chat_id = ? AND mtype = ? AND num = ? AND started_at = ?").bind(chatId, mtype, num, replaces),
        insert,
      ]);
    }
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

async function position(env, chatId, mtype, userId) {
  const row = await first(
    env,
    "SELECT (SELECT COUNT(*) FROM queue WHERE chat_id = q.chat_id AND mtype = q.mtype " +
      "AND (priority < q.priority OR (priority = q.priority AND id < q.id))) + 1 AS pos " +
      "FROM queue q WHERE q.chat_id = ? AND q.mtype = ? AND q.user_id = ?",
    chatId, mtype, userId
  );
  return row ? row.pos : 0;
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

const takenSql = "SELECT num FROM machines WHERE chat_id = ? AND mtype = ?";
const soonSql = "SELECT num FROM bookings WHERE chat_id = ? AND mtype = ? AND num IS NOT NULL AND at <= ?";
const soonAt = () => now() + (CLAIM_MINUTES + 30) * 60;

async function dispatch(env, chatId, mtype) {
  const [takenRows, soonRows, waiting] = await batch(
    env,
    q(env, takenSql, chatId, mtype),
    q(env, soonSql, chatId, mtype, soonAt()),
    q(env, "SELECT * FROM queue WHERE chat_id = ? AND mtype = ? ORDER BY priority, id", chatId, mtype)
  );
  const taken = new Set(takenRows.map((r) => r.num));
  const soon = new Set(soonRows.map((r) => r.num));
  let offered = false;
  for (const num of NUMBERS) {
    if (!waiting.length) break;
    if (taken.has(num) || soon.has(num)) continue;
    let given = false;
    for (let i = 0; i < waiting.length; i++) {
      const head = waiting[i];
      if (!(await changed(env, "DELETE FROM queue WHERE id = ?", head.id))) {
        waiting.splice(i--, 1);
        continue;
      }
      const row = await offer(env, chatId, mtype, num, person(head));
      if (!row) {
        await enqueue(env, chatId, mtype, person(head), head.priority);
        break;
      }
      waiting.splice(i, 1);
      const reason = head.priority === 0 ? "время твоей брони" : "подошла твоя очередь";
      await notice(env, chatId, person(row), `${reason}: ${mname(mtype, num)} ждёт тебя до ${clock(env, row.ends_at)}.`);
      given = offered = true;
      break;
    }
    if (!given) break;
  }
  return offered;
}

async function tick(env, chatId = null) {
  const t = now();
  const scope = chatId === null ? "" : " AND chat_id = ?";
  const arg = chatId === null ? [] : [chatId];
  const [warnDue, expired, dueBookings, hungry] = await batch(
    env,
    q(env,
      "SELECT * FROM machines WHERE kind = 'run' AND warned = 0 AND ends_at > ? AND ends_at - ? <= ? AND ends_at - started_at > ?" + scope,
      t, WARN_MINUTES * 60, t, WARN_MINUTES * 60, ...arg),
    q(env, "SELECT * FROM machines WHERE ends_at <= ?" + scope, t, ...arg),
    q(env, "SELECT * FROM bookings WHERE at <= ?" + scope, t, ...arg),
    q(env,
      "SELECT chat_id, mtype FROM (SELECT DISTINCT chat_id, mtype FROM queue WHERE 1 = 1" + scope + ") AS waiting " +
        "WHERE (SELECT COUNT(*) FROM machines m WHERE m.chat_id = waiting.chat_id AND m.mtype = waiting.mtype) < ?",
      ...arg, NUMBERS.length)
  );
  const dirty = new Set();

  if (WARN_MINUTES > 0) {
    for (const row of warnDue) {
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

  for (const row of expired) {
    if (row.kind === "run") {
      const finished = await changed(
        env,
        "UPDATE machines SET kind = 'done', finished_at = ends_at, ends_at = ? WHERE chat_id = ? AND mtype = ? AND num = ? AND started_at = ? AND kind = 'run'",
        row.ends_at + CLOTHES_HOURS * 3600, row.chat_id, row.mtype, row.num, row.started_at
      );
      if (!finished) continue;
      dirty.add(row.chat_id);
      await audit(env, row.chat_id, "finished", null, machineTrail(row));
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
    await audit(env, row.chat_id, "expired", null, machineTrail(row));
    if (row.kind === "hold") {
      await notice(env, row.chat_id, person(row), `время вышло — ${mname(row.mtype, row.num)} передана дальше.`);
    } else if (row.kind === "loaded") {
      await noticeMachine(
        env,
        row,
        `${mname(row.mtype, row.num)} больше ${CLOTHES_HOURS} ч стояла с твоими вещами — отметка снята, машина снова свободна.`,
        `${mname(row.mtype, row.num)} больше ${CLOTHES_HOURS} ч стояла с вещами без программы — отметка снята, машина снова свободна.`
      );
    }
    await handoff(env, row.chat_id, row.mtype, row.num);
  }

  for (const b of dueBookings) {
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

  for (const item of hungry) {
    if (await dispatch(env, item.chat_id, item.mtype)) dirty.add(item.chat_id);
  }

  for (const id of dirty) await updatePinned(env, id);
  if (chatId !== null) return;
  if (t - cleanupAt > SWEEP_SECONDS) {
    cleanupAt = t;
    await env.DB.batch([
      env.DB.prepare("DELETE FROM moved WHERE at < ?").bind(t - CLOTHES_HOURS * 3600),
      env.DB.prepare("DELETE FROM room_bookings WHERE ends < ?").bind(t - 86400),
      env.DB.prepare("DELETE FROM room_joins WHERE booking_id NOT IN (SELECT id FROM room_bookings)"),
      env.DB.prepare("DELETE FROM blocks WHERE until IS NOT NULL AND until < ?").bind(t),
      env.DB.prepare("DELETE FROM events WHERE at < ?").bind(t - LOG_DAYS * 86400),
    ]);
  }
  if (!playroom(env)) return;
  await remindRoomBookings(env, t);
  await sweepRoomBoards(env, t);
}

async function sweepRoomBoards(env, t) {
  const full = t - roomSweepAt > SWEEP_SECONDS;
  const chats = full
    ? await all(env, "SELECT chat_id FROM pboards")
    : await all(
        env,
        "SELECT DISTINCT p.chat_id FROM pboards p JOIN room_bookings r ON r.chat_id = p.chat_id " +
          "WHERE (r.starts > ? AND r.starts <= ?) OR (r.ends > ? AND r.ends <= ?)",
        t - RECENT_SECONDS, t, t - RECENT_SECONDS, t
      );
  if (full) roomSweepAt = t;
  for (const r of chats) await updateRoomBoard(env, r.chat_id);
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
  const open = b.public ? ` (открытое событие, идут: ${b.going}${b.capacity ? " из " + b.capacity : ""})` : "";
  return `${clock(env, b.starts)}–${clock(env, b.ends)} — ${who}${b.reason ? ", " + escape(b.reason) : ""}${open}`;
}

async function roomText(env, chatId) {
  const t = now();
  const today = await all(
    env,
    "SELECT r.*, (SELECT COUNT(*) FROM room_joins j WHERE j.booking_id = r.id) AS going " +
      "FROM room_bookings r WHERE r.chat_id = ? AND r.ends > ? AND r.starts < ? ORDER BY r.starts",
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
    "\n\nОткрой календарь, чтобы забронировать, посмотреть другие дни или записаться на открытое событие."
  );
}

async function pinnedText(env, chatId) {
  const busy = await busyMap(env, chatId);
  const counts = Object.entries(MACHINES).map(([mtype, cfg]) => {
    const free = NUMBERS.filter((n) => !busy.has(key(mtype, n))).length;
    return `${cfg.many} ${free} из ${NUMBERS.length}`;
  });
  const leftover = [...busy.values()].filter((r) => LEFTOVER.has(r.kind)).length;
  return (
    "<b>Прачечная</b>\n" +
    `Свободно: ${counts.join(", ")}.\n` +
    (leftover ? `С вещами внутри: ${leftover}.\n` : "") +
    "\nОткрой приложение, чтобы занять машину, встать в очередь, забронировать, " +
    "отметить, что внутри лежат чужие вещи без программы, или что переложил чужие вещи."
  );
}

async function say(env, chatId, text, extra = {}, table = "boards") {
  let thread = extra.message_thread_id;
  if (thread === undefined) {
    const board = await first(env, `SELECT thread_id FROM ${table} WHERE chat_id = ?`, chatId);
    thread = board ? board.thread_id : null;
  }
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
  if (!playroom(env)) return;
  const markup = { inline_keyboard: [[{ text: "Открыть игровую", url: await appLink(env, chatId, "p") }]] };
  await placeBoard(env, "pboards", chatId, await roomText(env, chatId), markup, recreate, thread);
}

async function onWebhook(request, env, ip) {
  const retry = full(env, "fail", ip);
  if (retry) return json({ error: "Too many failed attempts" }, 429, { "Retry-After": String(retry) });
  if (!env.WEBHOOK_SECRET || !same(request.headers.get("X-Telegram-Bot-Api-Secret-Token"), env.WEBHOOK_SECRET)) {
    spend(env, "fail", ip);
    return respond("Forbidden", 403);
  }
  try {
    const update = await readObject(request, WEBHOOK_BODY_MAX);
    await ensureSchema(env);
    await onUpdate(update, env);
  } catch (e) {
    console.error("Update failed", e);
  }
  return respond("ok");
}

async function onUpdate(update, env) {
  if (update.callback_query) return onCallback(env, update.callback_query);
  if (update.my_chat_member) return onJoin(env, update.my_chat_member);
  const msg = update.message;
  if (!msg) return;
  if (msg.chat && msg.chat.type !== "private" && !allowed(env, msg.chat.id)) return leave(env, msg.chat, msg.from);
  if (msg.migrate_to_chat_id) {
    await env.DB.batch(TABLES.map((t) => env.DB.prepare(`UPDATE ${t} SET chat_id = ? WHERE chat_id = ?`).bind(msg.migrate_to_chat_id, msg.chat.id)));
    await updatePinned(env, msg.migrate_to_chat_id, true);
    await updateRoomBoard(env, msg.migrate_to_chat_id, true);
    return;
  }
  const answered = msg.reply_to_message;
  if (msg.chat?.type === "private" && msg.from && answered?.from?.is_bot && !msg.text?.startsWith("/")) {
    const text = typeof msg.text === "string" ? msg.text : null;
    const reporter = msg.from.id === Number(env.OWNER_ID) && PROBLEM_HEAD.exec(answered.text || "");
    if (reporter) return answerProblem(env, msg, Number(reporter[1]), text);
    if (answered.text?.includes(PROBLEM_ASK) || answered.text?.startsWith(ANSWER_HEAD)) return problem(env, msg, text);
  }
  if (typeof msg.text !== "string" || !msg.text.startsWith("/")) return;
  const [command, target] = msg.text.trim().split(/\s+/)[0].split("@");
  if (target && target.toLowerCase() !== (await username(env)).toLowerCase()) return;
  if (!COMMANDS.includes(command) || (command === "/playroom" && !playroom(env))) return;
  const chat = msg.chat;
  if (chat.type === "private") {
    if (!msg.from || spend(env, "command", msg.from.id)) return;
    await setDm(env, msg.from.id, true);
    if (command === "/problem") {
      const text = msg.text.trim().replace(/^\S+\s*/, "");
      if (text) return problem(env, msg, text);
      await tg(env, "sendMessage", {
        chat_id: chat.id,
        text: PROBLEM_PROMPT,
        reply_markup: PROBLEM_INPUT,
      });
      return;
    }
    await tg(env, "sendMessage", { chat_id: chat.id, text: command === "/start" ? (playroom(env) ? ROOM_HELP : HELP) : `Отправь ${command} в групповом чате.` });
    return;
  }
  if (chat.type !== "group" && chat.type !== "supergroup") return;
  const anonymousAdmin = !!msg.sender_chat && msg.sender_chat.id === chat.id;
  const admin = anonymousAdmin || (!!msg.from && (await membership(env, chat.id, msg.from.id)).admin);
  if (!admin) {
    if (msg.from && !spend(env, "command", msg.from.id)) await tg(env, "deleteMessage", { chat_id: chat.id, message_id: msg.message_id });
    return;
  }
  await tg(env, "deleteMessage", { chat_id: chat.id, message_id: msg.message_id });
  const thread = msg.is_topic_message && msg.message_thread_id ? msg.message_thread_id : null;
  if (command === "/playroom") await updateRoomBoard(env, chat.id, true, thread);
  else if (command === "/board" || command === "/start") await updatePinned(env, chat.id, command === "/board", thread);
  else if (command === "/unpin") await unpin(env, msg, thread);
  else if (command !== "/problem") await moderate(env, msg, command, thread, anonymousAdmin ? null : msg.from);
}

async function problem(env, msg, text) {
  const from = msg.from;
  const owner = Number(env.OWNER_ID);
  const answer = (reply) => tg(env, "sendMessage", { chat_id: msg.chat.id, text: reply });
  const retake = (reason) => !spend(env, "command", from.id) && tg(env, "sendMessage", {
    chat_id: msg.chat.id,
    text: `${reason}\n\n${PROBLEM_PROMPT}`,
    reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true },
    reply_markup: PROBLEM_INPUT,
  });
  if (!owner) return answer("Сейчас некому передать проблему — напиши админу чата.");
  if (!reportable(msg)) return retake("Такой файл не подходит: можно текст, картинку JPG, PNG или WebP, PDF или видео MP4.");
  const size = fileSize(msg);
  if (size > PROBLEM_FILE_MB * 1024 * 1024) {
    return retake(`Файл слишком большой: ${Math.ceil(size / 1024 / 1024)} МБ, а можно до ${PROBLEM_FILE_MB} МБ. Сожми его или пришли скриншот.`);
  }
  const retry = spend(env, "problem", from.id);
  if (retry) return answer(`Ты уже отправил несколько сообщений — попробуй через ${Math.ceil(retry / 60)} мин.`);
  const who = tag({ id: from.id, name: from.first_name, username: from.username });
  const head = await tg(env, "sendMessage", {
    chat_id: owner,
    parse_mode: "HTML",
    text: `Проблема от ${who} (id <code>${from.id}</code>)` + (text ? `:\n\n${escape(text.slice(0, PROBLEM_LENGTH))}` : ":"),
  });
  const sent = head.ok && (text || (await tg(env, "copyMessage", { chat_id: owner, from_chat_id: msg.chat.id, message_id: msg.message_id })).ok);
  return answer(sent ? "Спасибо! Передал администратору бота, ответ придёт сюда." : "Не получилось передать — попробуй позже.");
}

function reportable(msg) {
  if (typeof msg.text === "string" || msg.photo) return true;
  if (msg.animation) return false;
  const file = msg.video || msg.document;
  return !!file && PROBLEM_FILES.includes(file.mime_type);
}

function fileSize(msg) {
  const file = msg.photo ? msg.photo[msg.photo.length - 1] : msg.video || msg.document;
  return file?.file_size || 0;
}

async function answerProblem(env, msg, userId, text) {
  const head = await tg(env, "sendMessage", {
    chat_id: userId,
    text: `${ANSWER_HEAD}\n\n${text ? text.slice(0, PROBLEM_LENGTH) + "\n\n" : ""}${ANSWER_TAIL}`,
  });
  const sent = head.ok && (text || (await tg(env, "copyMessage", { chat_id: userId, from_chat_id: msg.chat.id, message_id: msg.message_id })).ok);
  if (head.error_code === 403 || /chat not found/i.test(head.description || "")) await setDm(env, userId, false);
  return tg(env, "sendMessage", {
    chat_id: msg.chat.id,
    text: sent ? "Отправлено." : "Не доставлено — человек заблокировал бота или не начинал с ним чат.",
    reply_parameters: { message_id: msg.message_id },
  });
}

async function onJoin(env, change) {
  const chat = change.chat;
  const status = change.new_chat_member && change.new_chat_member.status;
  if (!chat || chat.type === "private" || allowed(env, chat.id) || status === "left" || status === "kicked") return;
  await leave(env, chat, change.from, true);
}

async function leave(env, chat, from, greet = false) {
  const actor = from ? { id: from.id, name: [from.first_name, from.last_name].filter(Boolean).join(" "), username: from.username } : null;
  await audit(env, chat.id, "foreign", actor, { details: { title: chat.title ?? null, type: chat.type } });
  if (greet && chat.type !== "channel") await tg(env, "sendMessage", { chat_id: chat.id, text: FOREIGN_CHAT });
  await tg(env, "leaveChat", { chat_id: chat.id });
}

async function unpin(env, msg, thread) {
  const chatId = msg.chat.id;
  const everywhere = /^(all|все|всё)$/i.test(msg.text.trim().split(/\s+/)[1] || "");
  const removed = [];
  for (const [table, name] of [["boards", "прачечную"], ["pboards", "игровую"]]) {
    const board = await first(env, `SELECT * FROM ${table} WHERE chat_id = ?`, chatId);
    if (!board || (!everywhere && (board.thread_id ?? null) !== thread)) continue;
    await env.DB.prepare(`DELETE FROM ${table} WHERE chat_id = ? AND message_id = ?`).bind(chatId, board.message_id).run();
    await tg(env, "unpinChatMessage", { chat_id: chatId, message_id: board.message_id });
    await tg(env, "deleteMessage", { chat_id: chatId, message_id: board.message_id });
    removed.push(name);
  }
  const back = playroom(env) ? "/board или /playroom" : "/board";
  const text = removed.length
    ? `Открепил ${removed.join(" и ")}${everywhere ? "" : " в этой теме"}. Вернуть — ${back} в нужной теме.`
    : everywhere
      ? "В этом чате нет закреплённых сообщений бота."
      : "В этой теме нет закреплённых сообщений бота. Убрать их из всего чата — /unpin all.";
  await say(env, chatId, text, { message_thread_id: thread });
}

function quiet(p) {
  return `${escape(p.name)} (id ${p.id})`;
}

function moment(env, ts) {
  return `${dayLabel(env, ts)}, ${clock(env, ts)}`;
}

function parseSpan(token) {
  const match = String(token).toLowerCase().match(/^(\d{1,4})(m|h|d|м|ч|д)$/);
  if (!match) return null;
  const unit = { m: 60, м: 60, h: 3600, ч: 3600, d: 86400, д: 86400 }[match[2]];
  const seconds = Number(match[1]) * unit;
  return seconds > 0 && seconds <= BLOCK_MAX_DAYS * 86400 ? seconds : null;
}

async function blockTarget(env, chatId, msg, words) {
  for (const word of words) {
    const id = word.match(/^\d{1,15}$/);
    const handle = word.match(/^@([A-Za-z0-9_]{4,32})$/);
    if (!id && !handle) continue;
    const row = id
      ? await first(env, "SELECT * FROM people WHERE chat_id = ? AND user_id = ?", chatId, Number(word))
      : await first(env, "SELECT * FROM people WHERE chat_id = ? AND lower(username) = lower(?)", chatId, handle[1]);
    if (row) return { id: row.user_id, name: row.name, username: row.username };
    if (id) return { id: Number(word), name: "без имени", username: null };
    return { missing: word };
  }
  const reply = msg.reply_to_message;
  if (!reply || reply.forum_topic_created || !reply.from || reply.from.is_bot) return null;
  return { id: reply.from.id, name: reply.from.first_name || "без имени", username: reply.from.username ?? null };
}

async function moderate(env, msg, command, thread, by) {
  const chatId = msg.chat.id;
  const t = now();
  const answer = (text) => say(env, chatId, text, { message_thread_id: thread });
  if (command === "/blocked") {
    const rows = await all(
      env,
      "SELECT b.user_id, b.until, b.reason, p.name, p.username FROM blocks b LEFT JOIN people p ON p.chat_id = b.chat_id AND p.user_id = b.user_id " +
        "WHERE b.chat_id = ? AND (b.until IS NULL OR b.until > ?) ORDER BY b.created_at",
      chatId, t
    );
    if (!rows.length) return answer("Сейчас доступ к приложению никому не закрыт.");
    const lines = rows.map((r) => {
      const who = quiet({ id: r.user_id, name: r.name || "без имени" });
      const till = r.until ? `до ${moment(env, r.until)}` : "бессрочно";
      return `• ${who} — ${till}${r.reason === "flood" ? " (слишком много запросов)" : ""}`;
    });
    return answer(`Доступ к приложению закрыт:\n${lines.join("\n")}\n\nВернуть: /unblock id`);
  }
  const words = msg.text.trim().split(/\s+/).slice(1);
  const target = await blockTarget(env, chatId, msg, words);
  if (!target) return answer(`Кого? Ответь командой ${command} на сообщение человека или напиши ${command} @username.`);
  if (target.missing) return answer(`Не нашёл ${escape(target.missing)} среди тех, кто открывал приложение в этом чате. Ответь командой на его сообщение.`);
  if (command === "/unblock") {
    blockCache.delete(`${chatId}:${target.id}`);
    const lifted = await changed(env, "DELETE FROM blocks WHERE chat_id = ? AND user_id = ?", chatId, target.id);
    return answer(lifted ? `${quiet(target)} снова может пользоваться приложением.` : `${quiet(target)}: доступ и так открыт.`);
  }
  if (by && target.id === by.id) return answer("Себе доступ закрыть нельзя.");
  if ((await membership(env, chatId, target.id)).admin) return answer("Админу чата доступ закрыть нельзя.");
  const span = words.map(parseSpan).find((s) => s);
  const until = span ? t + span : null;
  const out = await env.DB.batch([
    env.DB.prepare("INSERT OR REPLACE INTO blocks (chat_id, user_id, until, reason, by_id, created_at) VALUES (?, ?, ?, 'admin', ?, ?)")
      .bind(chatId, target.id, until, by ? by.id : null, t),
    env.DB.prepare("DELETE FROM queue WHERE chat_id = ? AND user_id = ?").bind(chatId, target.id),
    env.DB.prepare("DELETE FROM nexts WHERE chat_id = ? AND user_id = ?").bind(chatId, target.id),
    env.DB.prepare("DELETE FROM bookings WHERE chat_id = ? AND user_id = ?").bind(chatId, target.id),
    env.DB.prepare("DELETE FROM room_bookings WHERE chat_id = ? AND user_id = ? AND starts > ?").bind(chatId, target.id, t),
    env.DB.prepare("DELETE FROM room_joins WHERE chat_id = ? AND user_id = ?").bind(chatId, target.id),
  ]);
  cacheSet(blockCache, `${chatId}:${target.id}`, { until, reason: "admin" }, BLOCK_CACHE_MAX);
  const rooms = playroom(env) ? out[4].meta.changes : 0;
  await answer(
    `${quiet(target)} больше не может пользоваться приложением ${until ? "до " + moment(env, until) : "— пока админ не вернёт доступ (/unblock)"}. ` +
      "Очередь и брони прачечной сняты" + (rooms ? `, будущих броней ${ROOM_GEN} отменено: ${rooms}.` : ".")
  );
  await updatePinned(env, chatId);
  if (rooms || out[5].meta.changes) await updateRoomBoard(env, chatId);
}

async function onCallback(env, cq) {
  if (!cq.from || spend(env, "tap", cq.from.id)) return;
  const parsed = String(cq.data || "").match(/^r([kcl]):(\d+)$/);
  const answer = (text) => tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text });
  const rewrite = (text) =>
    cq.message
      ? tg(env, "editMessageText", { chat_id: cq.message.chat.id, message_id: cq.message.message_id, text, parse_mode: "HTML" })
      : null;
  if (!parsed || !playroom(env)) {
    await answer();
    return;
  }
  const row = await first(env, "SELECT * FROM room_bookings WHERE id = ?", Number(parsed[2]));
  if (parsed[1] === "l") {
    const left = row && (await changed(env, "DELETE FROM room_joins WHERE booking_id = ? AND user_id = ?", row.id, cq.from.id));
    if (!left) {
      await answer("Тебя нет в списке.");
      await rewrite(row ? "Тебя уже нет в списке на это событие." : `Событие в ${ROOM_GEN} уже отменено.`);
      return;
    }
    await answer("Ты больше не в списке.");
    await rewrite(`Ты больше не в списке на событие в ${ROOM_GEN}: ${roomSpan(env, row)}${roomWhy(row)}.`);
    await updateRoomBoard(env, row.chat_id);
    return;
  }
  if (!row || row.user_id !== cq.from.id) {
    await answer("Этой брони больше нет.");
    await rewrite(`Бронь ${ROOM_GEN} уже отменена.`);
    return;
  }
  if (parsed[1] === "k") {
    await answer("Бронь оставлена.");
    await rewrite(`Бронь ${ROOM_GEN} остаётся: ${roomSpan(env, row)}${roomWhy(row)}.`);
    return;
  }
  if (!(await dropRoomBooking(env, row, true))) {
    await answer("Этой брони больше нет.");
    await rewrite(`Бронь ${ROOM_GEN} уже отменена.`);
    return;
  }
  await answer("Бронь отменена.");
  await rewrite(`Бронь ${ROOM_GEN} отменена: ${roomSpan(env, row)}. Время снова свободно.`);
  await updateRoomBoard(env, row.chat_id);
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

async function leaveForeign(env) {
  const rows = await all(env, "SELECT 'boards' AS t, chat_id, message_id FROM boards UNION ALL SELECT 'pboards', chat_id, message_id FROM pboards");
  const chats = [...new Set(rows.map((r) => r.chat_id))];
  if (!allowedChats(env).length) return chats;
  const foreign = chats.filter((id) => !allowed(env, id));
  for (const r of rows.filter((r) => foreign.includes(r.chat_id))) {
    await tg(env, "unpinChatMessage", { chat_id: r.chat_id, message_id: r.message_id });
    await tg(env, "deleteMessage", { chat_id: r.chat_id, message_id: r.message_id });
    await env.DB.prepare(`DELETE FROM ${r.t} WHERE chat_id = ?`).bind(r.chat_id).run();
  }
  for (const id of foreign) await leave(env, { id, type: "supergroup" }, null);
  return foreign;
}

async function onSetup(url, env, ip) {
  const retry = full(env, "fail", ip);
  if (retry) return json({ error: "Too many failed attempts" }, 429, { "Retry-After": String(retry) });
  if (!env.WEBHOOK_SECRET || !same(url.searchParams.get("key"), env.WEBHOOK_SECRET)) {
    spend(env, "fail", ip);
    return respond("Forbidden", 403);
  }
  await ensureSchema(env);
  const hook = await tg(env, "setWebhook", {
    url: `${url.origin}/telegram`,
    secret_token: env.WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query", "my_chat_member"],
  });
  const name = await username(env);
  const left = await leaveForeign(env);
  const rooms = playroom(env);
  const profile = [
    await tg(env, "setMyDescription", { description: rooms ? ROOM_DESCRIPTION : DESCRIPTION }),
    await tg(env, "setMyShortDescription", { short_description: rooms ? ROOM_SHORT_DESCRIPTION : SHORT_DESCRIPTION }),
    await tg(env, "setMyCommands", { commands: [{ command: "start", description: "Что умеет бот" }, { command: "problem", description: "Сообщить о проблеме" }], scope: { type: "all_private_chats" } }),
    await tg(env, "setMyCommands", {
      commands: [
        { command: "board", description: "Закрепить прачечную в этой теме" },
        ...(rooms ? [{ command: "playroom", description: "Закрепить игровую в этой теме" }] : []),
        { command: "unpin", description: "Открепить бота в этой теме (/unpin all — во всём чате)" },
        { command: "block", description: "Закрыть доступ к приложению (ответом на сообщение)" },
        { command: "unblock", description: "Вернуть доступ к приложению" },
        { command: "blocked", description: "Кому закрыт доступ" },
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
    allowedChats(env).length
      ? `Разрешённые чаты: ${allowedChats(env).join(", ")}` + (left.length ? `. Вышел из чужих чатов: ${left.join(", ")}` : "")
      : `Разрешённые чаты: не заданы — бота можно добавить в любой чат. Задай ALLOWED_CHATS. Чаты с закрепом сейчас: ${left.join(", ") || "нет"}`,
    await cronStatus(env),
    `Адрес Mini App для BotFather: ${url.origin}/`,
  ];
  return respond(lines.join("\n"));
}

async function hmac(secret, data) {
  const material = typeof secret === "string" ? encoder.encode(secret) : secret;
  const cryptoKey = await crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data)));
}

async function signInitData(env, data) {
  if (!initDataKey) {
    const seed = await hmac("WebAppData", env.BOT_TOKEN);
    initDataKey = await crypto.subtle.importKey("raw", seed, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  }
  return new Uint8Array(await crypto.subtle.sign("HMAC", initDataKey, encoder.encode(data)));
}

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function membership(env, chatId, userId) {
  const cacheKey = `${chatId}:${userId}`;
  const hit = cacheGet(memberCache, cacheKey, MEMBER_CACHE_SECONDS);
  if (hit) return hit;
  const res = await tg(env, "getChatMember", { chat_id: chatId, user_id: userId });
  if (!res.ok) return { inside: false, admin: false };
  const status = res.result.status;
  const admin = status === "creator" || status === "administrator";
  const inside = admin || status === "member" || (status === "restricted" && res.result.is_member);
  const entry = { inside, admin };
  cacheSet(memberCache, cacheKey, entry, MEMBER_CACHE_MAX);
  return entry;
}

async function remember(env, chatId, me, row) {
  if (row && row.name === me.name && row.username === me.username && now() - row.seen_at < 3600) return !!row.hidden;
  await env.DB.prepare(
    "INSERT INTO people (chat_id, user_id, name, username, hidden, seen_at) VALUES (?, ?, ?, ?, 0, ?) " +
      "ON CONFLICT (chat_id, user_id) DO UPDATE SET name = excluded.name, username = excluded.username, seen_at = excluded.seen_at"
  ).bind(chatId, me.id, me.name, me.username, now()).run();
  return !!(row && row.hidden);
}

async function verifyInitData(env, raw) {
  const cached = cacheGet(authCache, raw, AUTH_CACHE_SECONDS);
  if (cached) return cached;
  if (raw.length > INIT_DATA_MAX) throw new ApiError(NOT_FROM_TELEGRAM, 401);
  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  if (!hash) throw new ApiError(NOT_FROM_TELEGRAM, 401);
  params.delete("hash");
  const check = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join("\n");
  if (!same(hex(await signInitData(env, check)), hash)) throw new ApiError(NOT_FROM_TELEGRAM, 401);
  let user = null;
  try {
    user = JSON.parse(params.get("user") || "null");
  } catch (e) {
    user = null;
  }
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) throw new ApiError(NOT_FROM_TELEGRAM, 401);
  const data = { user, authDate: Number(params.get("auth_date")), start: params.get("start_param") || "" };
  cacheSet(authCache, raw, data, AUTH_CACHE_MAX);
  return data;
}

function blockedText(env, b) {
  if (b.reason === "flood") return `Слишком много запросов — доступ к приложению приостановлен до ${clock(env, b.until)}.`;
  return `Админ чата закрыл тебе доступ к приложению${b.until ? " до " + moment(env, b.until) : ""}.`;
}

function activeBlock(chatId, userId) {
  const hit = cacheGet(blockCache, `${chatId}:${userId}`, BLOCK_CACHE_SECONDS);
  return hit && (hit.until === null || hit.until > now()) ? hit : null;
}

async function strike(env, chatId, userId) {
  if (!spend(env, "strike", userId)) return;
  const t = now();
  const until = t + FLOOD_BLOCK_MINUTES * 60;
  cacheSet(blockCache, `${chatId}:${userId}`, { until, reason: "flood" }, BLOCK_CACHE_MAX);
  await ensureSchema(env);
  await env.DB.prepare(
    "INSERT INTO blocks (chat_id, user_id, until, reason, by_id, created_at) VALUES (?, ?, ?, 'flood', NULL, ?) " +
      "ON CONFLICT (chat_id, user_id) DO UPDATE SET until = excluded.until, reason = excluded.reason, created_at = excluded.created_at " +
      "WHERE blocks.reason = 'flood' OR (blocks.until IS NOT NULL AND blocks.until < excluded.until)"
  ).bind(chatId, userId, until, t).run();
}

async function authorize(request, env, bucket) {
  const { user, authDate, start: startParam } = await verifyInitData(env, request.headers.get("X-Init-Data") || "");
  if (!(now() - authDate <= INIT_DATA_TTL)) throw new ApiError("Сессия устарела — закрой и открой приложение заново.", 401);
  const start = startParam.match(/^(-?\d{1,15})(?:_([a-z]))?$/);
  if (!start) throw new ApiError("Открой приложение кнопкой из закреплённого сообщения в чате.", 400);
  const chatId = Number(start[1]);
  if (!allowed(env, chatId)) throw new ApiError(FOREIGN_CHAT, 403);
  const rooms = playroom(env);
  const section = rooms && start[2] === "p" ? "playroom" : "laundry";
  const cached = activeBlock(chatId, user.id);
  if (cached) throw new ApiError(blockedText(env, cached), 403);
  const retry = spend(env, bucket, user.id);
  if (retry) {
    await strike(env, chatId, user.id);
    const block = activeBlock(chatId, user.id);
    throw block ? new ApiError(blockedText(env, block), 403) : tooMany(retry);
  }
  await ensureSchema(env);
  const [configured, mine, blocked] = await batch(
    env,
    rooms
      ? q(env, "SELECT 1 AS ok FROM boards WHERE chat_id = ? UNION SELECT 1 FROM pboards WHERE chat_id = ?", chatId, chatId)
      : q(env, "SELECT 1 AS ok FROM boards WHERE chat_id = ?", chatId),
    q(env, "SELECT * FROM people WHERE chat_id = ? AND user_id = ?", chatId, user.id),
    q(env, "SELECT until, reason FROM blocks WHERE chat_id = ? AND user_id = ? AND (until IS NULL OR until > ?)", chatId, user.id, now())
  );
  if (!configured.length) throw new ApiError(`В этом чате бот не настроен. Админу нужно отправить ${rooms ? "/board или /playroom" : "/board"}.`, 404);
  if (blocked.length) {
    cacheSet(blockCache, `${chatId}:${user.id}`, blocked[0], BLOCK_CACHE_MAX);
    throw new ApiError(blockedText(env, blocked[0]), 403);
  }
  const { inside, admin } = await membership(env, chatId, user.id);
  if (!inside) throw new ApiError("Приложение доступно только участникам чата.", 403);
  const me = { id: user.id, name: user.first_name, username: user.username ?? null };
  me.hidden = await remember(env, chatId, me, mine[0]);
  return { chatId, me, admin, section };
}

function roomState(days, rows, joins, view, meId) {
  return {
    name: ROOM_NAME,
    step: ROOM_STEP_MINUTES,
    maxHours: ROOM_MAX_HOURS,
    reasonLength: ROOM_REASON_LENGTH,
    capacityMax: ROOM_CAPACITY_MAX,
    days,
    bookings: rows.map((r) => ({
      id: r.id,
      starts: r.starts,
      ends: r.ends,
      reason: r.reason || "",
      user: view(person(r)),
      mine: r.user_id === meId,
      public: !!r.public,
      capacity: r.public ? r.capacity ?? null : null,
      going: joins.filter((j) => j.booking_id === r.id).map((j) => view(person(j))),
      joined: joins.some((j) => j.booking_id === r.id && j.user_id === meId),
    })),
  };
}

async function state(env, chatId, me, admin, section = "laundry") {
  const t = now();
  const rooms = playroom(env);
  const days = rooms ? roomDays(env) : [];
  const [peopleRows, machineRows, nextRows, bookingRows, queueRows, movedRows, dmRows, boardRows, roomRows = [], joinRows = []] = await batch(
    env,
    q(env, "SELECT * FROM people WHERE chat_id = ?", chatId),
    q(env, "SELECT * FROM machines WHERE chat_id = ?", chatId),
    q(env, "SELECT * FROM nexts WHERE chat_id = ?", chatId),
    q(env, "SELECT * FROM bookings WHERE chat_id = ? ORDER BY at", chatId),
    q(env, "SELECT * FROM queue WHERE chat_id = ? ORDER BY priority, id", chatId),
    q(env, "SELECT * FROM moved WHERE chat_id = ? AND at >= ? ORDER BY at DESC", chatId, t - CLOTHES_HOURS * 3600),
    q(env, "SELECT ok FROM dm WHERE user_id = ?", me.id),
    q(env, "SELECT 'laundry' AS s FROM boards WHERE chat_id = ? UNION ALL SELECT 'playroom' FROM pboards WHERE chat_id = ?", chatId, chatId),
    ...(rooms
      ? [
          q(env,
            "SELECT * FROM room_bookings WHERE chat_id = ? AND ends > ? AND starts < ? ORDER BY starts",
            chatId, days[0].start, days[days.length - 1].end),
          q(env,
            "SELECT j.* FROM room_joins j JOIN room_bookings r ON r.id = j.booking_id " +
              "WHERE r.chat_id = ? AND r.ends > ? AND r.starts < ? ORDER BY j.created_at",
            chatId, days[0].start, days[days.length - 1].end),
        ]
      : [])
  );
  const hidden = new Set(peopleRows.filter((r) => r.hidden).map((r) => r.user_id));
  const view = (p) => {
    if (!p) return null;
    if (!p.id || !hidden.has(p.id)) return p;
    if (p.id === me.id) return { ...p, name: `${ANONYMOUS} (это ты)`, username: null };
    if (admin) return { id: null, name: `${p.username ? "@" + p.username : p.name} (скрыто)`, username: null };
    return { id: null, name: ANONYMOUS, username: null };
  };
  const busy = new Map(machineRows.map((r) => [key(r.mtype, r.num), r]));
  const nexts = new Map(nextRows.map((r) => [key(r.mtype, r.num), r]));
  const booked = new Map();
  for (const b of bookingRows) {
    if (b.num != null && !booked.has(key(b.mtype, b.num))) booked.set(key(b.mtype, b.num), b);
  }
  const machines = [];
  const queue = {};
  for (const mtype of Object.keys(MACHINES)) {
    queue[mtype] = queueRows.filter((r) => r.mtype === mtype).map((r) => view(person(r)));
    for (const num of NUMBERS) {
      const k = key(mtype, num);
      const row = busy.get(k);
      const item = { t: mtype, n: num, status: row ? row.kind : "free" };
      if (row) {
        const showReporter = row.kind !== "parked" || admin || row.reporter_id === me.id;
        Object.assign(item, { owner: view(person(row)), ends: row.ends_at, reporter: showReporter ? view(person(row, "reporter")) : null, finished: row.finished_at });
      }
      const nxt = nexts.get(k);
      if (nxt) item.next = view(person(nxt));
      const b = booked.get(k);
      if (b) item.booking = { id: b.id, at: b.at, user: view(person(b)) };
      machines.push(item);
    }
  }
  const bookings = bookingRows.map((r) => ({ id: r.id, t: r.mtype, n: r.num, at: r.at, user: view(person(r)) }));
  const moved = movedRows.map((r) => ({
    id: r.id,
    owner: view(person(r, "owner")),
    mover: admin ? view(person(r, "mover")) : null,
    byMe: r.mover_id === me.id,
    from: { t: r.from_mtype, n: r.from_num },
    to: r.to_mtype ? { t: r.to_mtype, n: r.to_num } : null,
    at: r.at,
  }));
  const boards = new Set(boardRows.map((r) => r.s));
  return {
    now: t,
    me: { ...me, admin },
    types: MACHINES,
    walls: WALLS,
    numbers: NUMBERS,
    ironing: IRONING_BOARD,
    claim: CLAIM_MINUTES,
    clothesHours: CLOTHES_HOURS,
    maxMinutes: MAX_MINUTES,
    bookingGap: BOOKING_GAP_MINUTES,
    machines,
    queue,
    bookings,
    moved,
    bot: await username(env),
    dm: dmRows[0]?.ok ?? null,
    slots: slots(env),
    tomorrow: localMidnight(env, 1),
    tz: env.TZ_NAME || "Asia/Yekaterinburg",
    section,
    sections: { laundry: boards.has("laundry"), playroom: rooms && boards.has("playroom") },
    room: rooms ? roomState(days, roomRows, joinRows, view, me.id) : null,
  };
}

async function roomAnnounce(env, chatId, text) {
  if (await first(env, "SELECT 1 AS ok FROM pboards WHERE chat_id = ?", chatId)) await say(env, chatId, text, {}, "pboards");
}

function roomSpan(env, b) {
  return `${dayLabel(env, b.starts)}, ${clock(env, b.starts)}–${clock(env, b.ends)}`;
}

function roomWhy(b) {
  return b.reason ? ` — ${escape(b.reason)}` : "";
}

async function roomDm(env, b, text, buttons) {
  const dm = await tg(env, "sendMessage", {
    chat_id: b.user_id,
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: buttons.map((row) => [row]) },
  });
  if (dm.ok) {
    await setDm(env, b.user_id, true);
    return true;
  }
  if (dm.error_code === 403 || /chat not found/i.test(dm.description || "")) await setDm(env, b.user_id, false);
  return false;
}

async function askRoomBooking(env, b) {
  const text =
    `Напоминание: ${ROOM_NAME} забронирована за тобой на завтра — ${roomSpan(env, b)}${roomWhy(b)}.\n\n` +
    "Бронь ещё нужна? Если планы изменились, лучше освободить время для других.";
  const sent = await roomDm(env, b, text, [
    { text: "Да, бронь нужна", callback_data: `rk:${b.id}` },
    { text: "Нет, отменить бронь", callback_data: `rc:${b.id}` },
  ]);
  if (sent) return;
  await mention(
    env,
    b.chat_id,
    person(b),
    `напоминание: ${ROOM_NAME} забронирована за тобой на завтра — ${roomSpan(env, b)}${roomWhy(b)}. ` +
      "Если бронь больше не нужна, отмени её в приложении."
  );
}

async function warnRoomBooking(env, b) {
  const text =
    `Твоя бронь ${ROOM_GEN} начинается в ${clock(env, b.starts)} и держится до ${clock(env, b.ends)}${roomWhy(b)}.`;
  const sent = await roomDm(env, b, text, [{ text: "Не приду — отменить бронь", callback_data: `rc:${b.id}` }]);
  if (sent) return;
  await mention(env, b.chat_id, person(b), `твоя бронь ${ROOM_GEN} начинается в ${clock(env, b.starts)}.`);
}

async function warnRoomJoin(env, j) {
  const text = `Событие в ${ROOM_GEN}, на которое ты идёшь, начинается в ${clock(env, j.starts)} и идёт до ${clock(env, j.ends)}${roomWhy(j)}.`;
  await roomDm(env, { user_id: j.joiner }, text, [{ text: "Не приду", callback_data: `rl:${j.id}` }]);
}

async function remindRoomBookings(env, t) {
  const tomorrow = localMidnight(env, 1);
  const hour = Number(env.ROOM_REMIND_HOUR ?? ROOM_REMIND_HOUR);
  const gate = tomorrow - (24 - hour) * 3600;
  const statements = [
    q(env,
      "SELECT * FROM room_bookings WHERE warned = 0 AND starts > ? AND starts - ? <= ? AND created_at < starts - ? ORDER BY starts",
      t, t, ROOM_SOON_MINUTES * 60, ROOM_SOON_MINUTES * 60),
    q(env,
      "SELECT j.user_id AS joiner, r.* FROM room_joins j JOIN room_bookings r ON r.id = j.booking_id " +
        "WHERE j.warned = 0 AND r.starts > ? AND r.starts - ? <= ? AND j.created_at < r.starts - ? ORDER BY r.starts",
      t, t, ROOM_SOON_MINUTES * 60, ROOM_SOON_MINUTES * 60),
  ];
  if (t >= gate) {
    statements.push(
      q(env,
        "SELECT * FROM room_bookings WHERE asked = 0 AND starts >= ? AND starts < ? AND created_at < ? ORDER BY starts",
        tomorrow, localMidnight(env, 2), gate)
    );
  }
  const [soon, joinSoon, asking = []] = await batch(env, ...statements);
  for (const b of asking) {
    if (await changed(env, "UPDATE room_bookings SET asked = 1 WHERE id = ? AND asked = 0", b.id)) await askRoomBooking(env, b);
  }
  for (const b of soon) {
    if (await changed(env, "UPDATE room_bookings SET warned = 1 WHERE id = ? AND warned = 0", b.id)) await warnRoomBooking(env, b);
  }
  for (const j of joinSoon) {
    if (await changed(env, "UPDATE room_joins SET warned = 1 WHERE booking_id = ? AND user_id = ? AND warned = 0", j.id, j.joiner)) {
      await warnRoomJoin(env, j);
    }
  }
}

function roomInput(env, body, keepStarts = null) {
  const starts = Number(body.starts);
  const ends = Number(body.ends);
  const step = ROOM_STEP_MINUTES * 60;
  const days = roomDays(env);
  if (!Number.isInteger(starts) || !Number.isInteger(ends) || starts % step || ends % step) throw new ApiError("Некорректный запрос.");
  if (starts !== keepStarts && starts < Math.floor(now() / step) * step) return "Это время уже прошло — выбери другое.";
  if (ends <= starts) return "Конец брони должен быть позже начала.";
  if (ends <= now()) return "Это время уже прошло — выбери другое.";
  if (ends - starts > ROOM_MAX_HOURS * 3600) return `Бронь — не дольше ${ROOM_MAX_HOURS} ч.`;
  if (starts >= days[days.length - 1].end) return `Бронировать можно не дальше чем на ${ROOM_DAYS} дней вперёд.`;
  const reason = String(body.reason ?? "").replace(/\s+/g, " ").trim().slice(0, ROOM_REASON_LENGTH) || null;
  const open = body.public === true;
  const capacity = open ? body.capacity ?? null : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > ROOM_CAPACITY_MAX)) {
    return `Число людей — от 1 до ${ROOM_CAPACITY_MAX}, или оставь поле пустым, если ограничения нет.`;
  }
  return { starts, ends, reason, open, capacity };
}

async function roomClash(env, chatId, starts, ends, exceptId) {
  const clash = await first(
    env,
    "SELECT * FROM room_bookings WHERE chat_id = ? AND id != ? AND starts < ? AND ends > ? ORDER BY starts LIMIT 1",
    chatId, exceptId, ends, starts
  );
  return clash ? `Это время пересекается с бронью ${clock(env, clash.starts)}–${clock(env, clash.ends)}. Выбери другое.` : null;
}

function roomSeats(capacity) {
  return capacity
    ? `Ждём до ${capacity} чел. — места занимаются по кнопке «Я приду» в приложении.`
    : "Приходите все желающие, число людей не ограничено! Отметиться «Я приду» можно в приложении.";
}

async function dropRoomBooking(env, row, byOwner) {
  if (!(await changed(env, "DELETE FROM room_bookings WHERE id = ?", row.id))) return false;
  const joiners = await all(env, "DELETE FROM room_joins WHERE booking_id = ? RETURNING user_id", row.id);
  const by = byOwner ? "" : " (отменено админом)";
  await roomAnnounce(
    env,
    row.chat_id,
    row.public ? `Событие в ${ROOM_GEN} отменено: ${roomSpan(env, row)}${roomWhy(row)}${by}.` : `Бронь ${ROOM_GEN} отменена: ${roomSpan(env, row)}${by}.`
  );
  for (const j of joiners) {
    await roomDm(env, j, `Событие в ${ROOM_GEN}, на которое ты идёшь, отменено: ${roomSpan(env, row)}${roomWhy(row)}${by}.`, []);
  }
  return true;
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

function ownerArg(me, body) {
  return body.owner === "unknown" ? { owner: UNKNOWN, reporter: me } : { owner: me, reporter: null };
}

function occupiedText(mtype, num, kind) {
  return LEFTOVER.has(kind)
    ? `В ${MACHINES[mtype].prep} ${num} ещё лежат чужие вещи. Их нужно забрать или переложить.`
    : `${mname(mtype, num)} уже занята.`;
}

function clearOwnerHolds(env, chatId, mtype, num, owner) {
  return env.DB.batch([
    env.DB.prepare("DELETE FROM bookings WHERE chat_id = ? AND mtype = ? AND num = ? AND user_id = ?").bind(chatId, mtype, num, owner.id),
    env.DB.prepare("DELETE FROM queue WHERE chat_id = ? AND mtype = ? AND user_id = ?").bind(chatId, mtype, owner.id),
  ]);
}

const ACTIONS = {
  async take(env, chatId, me, admin, body, trail) {
    const [mtype, num] = machineArg(body);
    const minutes = parseMinutes(body.time ?? "");
    if (minutes === null) return `Не понял время. Введи минуты (45), часы с минутами (1:05) или полтора часа как 1,5 — от 1 до ${MAX_MINUTES} минут.`;
    const { owner, reporter } = ownerArg(me, body);
    const row = await getMachine(env, chatId, mtype, num);
    if (row && !(REPLACEABLE.has(row.kind) && ((owner.id && row.user_id === owner.id) || row.reporter_id === me.id))) {
      return occupiedText(mtype, num, row.kind);
    }
    const t = now();
    const booked = await upcomingBooking(env, chatId, mtype, num, owner.id);
    if (booked && t + minutes * 60 > booked.at) {
      return `${mname(mtype, num)} забронирована на ${clock(env, booked.at)}, а программа закончится позже. Выбери другую машину.`;
    }
    const replaces = row ? row.started_at : null;
    Object.assign(trail, { mtype, num, owner: owner.id ? owner : null, details: { minutes, replaced: row ? machineTrail(row).details : null } });
    if (!(await occupy(env, chatId, mtype, num, owner, t, t + minutes * 60, "run", reporter, replaces))) return `${mname(mtype, num)} уже занята.`;
    await clearOwnerHolds(env, chatId, mtype, num, owner);
    return null;
  },

  async load(env, chatId, me, admin, body, trail) {
    const [mtype, num] = machineArg(body);
    Object.assign(trail, { mtype, num });
    const row = await getMachine(env, chatId, mtype, num);
    if (row) return row.kind === "loaded" ? `${mname(mtype, num)} уже отмечена как занятая вещами.` : occupiedText(mtype, num, row.kind);
    const t = now();
    if (!(await occupy(env, chatId, mtype, num, UNKNOWN, t, t + CLOTHES_HOURS * 3600, "loaded", me))) {
      return `${mname(mtype, num)} уже занята.`;
    }
    return null;
  },

  async claim(env, chatId, me, admin, body, trail) {
    const [mtype, num] = machineArg(body);
    const row = await getMachine(env, chatId, mtype, num);
    if (!row || row.kind === "hold" || row.user_id) return "У этой машины уже есть хозяин.";
    Object.assign(trail, machineTrail(row), { owner: me });
    const ok = await changed(
      env,
      "UPDATE machines SET user_id = ?, user_name = ?, username = ? WHERE chat_id = ? AND mtype = ? AND num = ? AND user_id = 0",
      me.id, me.name, me.username, chatId, mtype, num
    );
    if (!ok) return "У этой машины уже есть хозяин.";
    if (row.reporter_id && row.reporter_id !== me.id) {
      await nudge(env, chatId, me, person(row, "reporter"), `в ${MACHINES[mtype].prep} ${num}, которую ты отметил, нашёлся хозяин вещей. Кто: ${await label(env, chatId, me)}.`);
    }
    return null;
  },

  async free(env, chatId, me, admin, body, trail) {
    const [mtype, num] = machineArg(body);
    const row = await getMachine(env, chatId, mtype, num);
    if (!row) return `${mname(mtype, num)} уже свободна.`;
    Object.assign(trail, machineTrail(row));
    const marked = row.kind === "run" && row.reporter_id != null;
    if (!admin && (marked ? row.reporter_id !== me.id : row.user_id !== me.id && row.reporter_id !== me.id)) {
      return marked
        ? "Пока программа идёт, освободить может только тот, кто отметил машину, или админ чата."
        : "Освободить может хозяин вещей, тот, кто отметил машину, или админ чата.";
    }
    if (!(await changed(env, "DELETE FROM machines WHERE chat_id = ? AND mtype = ? AND num = ? AND started_at = ?", chatId, mtype, num, row.started_at))) {
      return `${mname(mtype, num)} уже свободна.`;
    }
    if (row.kind === "parked") {
      await env.DB.prepare("DELETE FROM moved WHERE chat_id = ? AND to_mtype = ? AND to_num = ? AND owner_id = ?").bind(chatId, mtype, num, row.user_id).run();
    } else {
      const text = `${MACHINES[mtype].acc} ${num} освободили. Кто: ${await label(env, chatId, me)}.`;
      if (row.user_id && row.user_id !== me.id) await nudge(env, chatId, me, person(row), text);
      if (row.reporter_id && row.reporter_id !== me.id && row.reporter_id !== row.user_id) await nudge(env, chatId, me, person(row, "reporter"), text);
    }
    await handoff(env, chatId, mtype, num);
    return null;
  },

  async queue(env, chatId, me, admin, body) {
    const mtype = typeArg(body);
    const cfg = MACHINES[mtype];
    const [already, takenRows, soonRows, counted] = await batch(
      env,
      q(env, "SELECT 1 AS ok FROM queue WHERE chat_id = ? AND mtype = ? AND user_id = ?", chatId, mtype, me.id),
      q(env, takenSql, chatId, mtype),
      q(env, soonSql, chatId, mtype, soonAt()),
      q(env, "SELECT COUNT(*) AS n FROM queue WHERE chat_id = ? AND mtype = ?", chatId, mtype)
    );
    if (already.length) return `Ты уже в очереди на ${cfg.acc}.`;
    const taken = new Set(takenRows.map((r) => r.num));
    const soon = new Set(soonRows.map((r) => r.num));
    const anyFree = NUMBERS.some((n) => !taken.has(n) && !soon.has(n));
    if (anyFree && !counted[0].n) return `Есть свободная ${cfg.name.toLowerCase()} — просто займи её.`;
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

  async move(env, chatId, me, admin, body, trail) {
    const src = machineArg(body, "f");
    const dest = body.to === "machine" ? machineArg(body, "t") : null;
    const row = await getMachine(env, chatId, ...src);
    if (!row || !LEFTOVER.has(row.kind)) return "В этой машине нет оставленных вещей.";
    if (dest) {
      if (key(...dest) === key(...src)) return "Выбери другую машину.";
      if (await getMachine(env, chatId, ...dest)) return `${mname(...dest)} занята.`;
    }
    const ownerP = person(row);
    const since = row.kind === "done" ? row.finished_at : row.started_at;
    Object.assign(trail, machineTrail(row));
    trail.details.to = dest ? mname(...dest) : "гладильная доска";
    trail.details.waited_min = since ? Math.round((now() - since) / 60) : null;
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
    const where = dest ? `в ${capitalize(MACHINES[dest[0]].acc)} ${dest[1]}` : "на гладильную доску";
    if (!ownerP.id) {
      await say(env, chatId, `Вещи из ${MACHINES[src[0]].gen} ${src[1]} переложили ${where}. Хозяин вещей не отмечен — если это твои вещи, забери их там.`);
    } else if (ownerP.id !== me.id) {
      await nudge(
        env,
        chatId,
        me,
        ownerP,
        `твои вещи из ${MACHINES[src[0]].gen} ${src[1]} переложили ${where}. Когда заберёшь, отметь это в приложении.`
      );
    }
    await handoff(env, chatId, ...src);
    return null;
  },

  async picked(env, chatId, me, admin, body, trail) {
    const item = await first(env, "SELECT * FROM moved WHERE id = ? AND chat_id = ?", Number(body.id), chatId);
    if (!item) return null;
    Object.assign(trail, {
      mtype: item.from_mtype, num: item.from_num, owner: item.owner_id ? person(item, "owner") : null,
      details: { mover: person(item, "mover"), moved_at: item.at, to: item.to_mtype ? mname(item.to_mtype, item.to_num) : "гладильная доска" },
    });
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

  async dm(env, chatId, me) {
    const res = await tg(env, "sendMessage", { chat_id: me.id, text: playroom(env) ? ROOM_HELP : HELP });
    await setDm(env, me.id, res.ok);
    return res.ok ? null : "Не получилось написать тебе в личку — открой бота и нажми «Старт».";
  },

  async privacy(env, chatId, me, admin, body) {
    const hidden = body.hidden ? 1 : 0;
    await env.DB.prepare("UPDATE people SET hidden = ? WHERE chat_id = ? AND user_id = ?").bind(hidden, chatId, me.id).run();
    me.hidden = !!hidden;
    return null;
  },

  async room_book(env, chatId, me, admin, body) {
    const input = roomInput(env, body);
    if (typeof input === "string") return input;
    const { starts, ends, reason, open, capacity } = input;
    const t = now();
    const res = await env.DB.prepare(
      "INSERT INTO room_bookings (chat_id, user_id, user_name, username, starts, ends, reason, created_at, public, capacity) " +
        "SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM room_bookings WHERE chat_id = ? AND starts < ? AND ends > ?) " +
        "AND (? OR (SELECT COUNT(*) FROM room_bookings WHERE chat_id = ? AND user_id = ? AND ends > ?) < ?)"
    ).bind(
      chatId, me.id, me.name, me.username ?? null, starts, ends, reason, t, open ? 1 : 0, capacity, chatId, ends, starts,
      admin ? 1 : 0, chatId, me.id, t, ROOM_USER_BOOKINGS
    ).run();
    if (!res.meta.changes) {
      const clash = await roomClash(env, chatId, starts, ends, 0);
      if (clash) return clash;
      return `Броней ${ROOM_GEN} у тебя уже максимум — ${ROOM_USER_BOOKINGS}. Отмени одну, чтобы забронировать новую.`;
    }
    const who = await plainName(env, chatId, me);
    const span = `${dayLabel(env, starts)}, ${clock(env, starts)}–${clock(env, ends)} — ${who}${reason ? ", " + escape(reason) : ""}`;
    await roomAnnounce(env, chatId, open ? `Открытое событие в ${ROOM_GEN}: ${span}. ${roomSeats(capacity)}` : `${ROOM_NAME} забронирована: ${span}.`);
    return null;
  },

  async room_edit(env, chatId, me, admin, body) {
    const row = await first(env, "SELECT * FROM room_bookings WHERE id = ? AND chat_id = ?", Number(body.id), chatId);
    if (!row) return "Эта бронь уже отменена.";
    if (row.user_id !== me.id) return "Изменить бронь может только тот, кто бронировал.";
    if (row.ends <= now()) return "Эта бронь уже закончилась.";
    const input = roomInput(env, body, row.starts);
    if (typeof input === "string") return input;
    const { starts, ends, reason, open, capacity } = input;
    const retimed = starts !== row.starts;
    const moved = retimed || ends !== row.ends;
    const t = now();
    const res = await env.DB.prepare(
      "UPDATE room_bookings SET starts = ?, ends = ?, reason = ?, public = ?, capacity = ?, " +
        "created_at = CASE WHEN ? THEN ? ELSE created_at END, asked = CASE WHEN ? THEN 0 ELSE asked END, warned = CASE WHEN ? THEN 0 ELSE warned END " +
        "WHERE id = ? AND user_id = ? AND starts = ? AND ends = ? " +
        "AND NOT EXISTS (SELECT 1 FROM room_bookings WHERE chat_id = ? AND id != ? AND starts < ? AND ends > ?) " +
        "AND (? IS NULL OR (SELECT COUNT(*) FROM room_joins WHERE booking_id = ?) <= ?)"
    ).bind(
      starts, ends, reason, open ? 1 : 0, capacity, retimed ? 1 : 0, t, retimed ? 1 : 0, retimed ? 1 : 0,
      row.id, me.id, row.starts, row.ends, chatId, row.id, ends, starts, capacity, row.id, capacity
    ).run();
    if (!res.meta.changes) {
      const clash = await roomClash(env, chatId, starts, ends, row.id);
      if (clash) return clash;
      const going = await first(env, "SELECT COUNT(*) AS n FROM room_joins WHERE booking_id = ?", row.id);
      if (capacity !== null && going.n > capacity) return `На событие уже записались ${going.n} чел. — меньше мест поставить нельзя.`;
      return "Бронь только что изменилась — открой её заново.";
    }
    const after = { ...row, starts, ends, reason, public: open ? 1 : 0, capacity };
    const changes = [];
    if (moved) changes.push(`время: было ${roomSpan(env, row)}, стало ${roomSpan(env, after)}`);
    if (open && !row.public) changes.push("теперь это открытое событие");
    if (!open && row.public) changes.push("теперь это закрытая бронь, записи на неё сняты");
    if (open && row.public && capacity !== (row.capacity ?? null)) changes.push(capacity ? `мест: ${capacity}` : "число людей больше не ограничено");
    if (reason !== (row.reason ?? null)) changes.push(reason ? `повод: ${escape(reason)}` : "повод убран");
    if (!changes.length) return null;
    if (!open && row.public) {
      const joiners = await all(env, "DELETE FROM room_joins WHERE booking_id = ? RETURNING user_id", row.id);
      for (const j of joiners) {
        await roomDm(env, j, `Событие в ${ROOM_GEN}, на которое ты записался, стало закрытой бронью — запись снята: ${roomSpan(env, row)}${roomWhy(row)}.`, []);
      }
    } else if (open && row.public && moved) {
      const joiners = await all(env, "UPDATE room_joins SET warned = CASE WHEN ? THEN 0 ELSE warned END WHERE booking_id = ? RETURNING user_id", retimed ? 1 : 0, row.id);
      for (const j of joiners) {
        await roomDm(env, j, `Событие в ${ROOM_GEN}, на которое ты идёшь, перенесено: было ${roomSpan(env, row)}, стало ${roomSpan(env, after)}${roomWhy(after)}.`, [
          { text: "Не приду", callback_data: `rl:${row.id}` },
        ]);
      }
    }
    const who = await plainName(env, chatId, me);
    const head = row.public ? `Событие в ${ROOM_GEN} изменено` : `Бронь ${ROOM_GEN} изменена`;
    const invite = open && !row.public ? ` ${roomSeats(capacity)}` : "";
    await roomAnnounce(env, chatId, `${head} — ${who}: ${changes.join("; ")}.${invite}`);
    return null;
  },

  async room_join(env, chatId, me, admin, body) {
    const row = await first(env, "SELECT * FROM room_bookings WHERE id = ? AND chat_id = ?", Number(body.id), chatId);
    if (!row) return "Это событие уже отменено.";
    if (row.user_id === me.id) return "Это твоё событие — ты и так в нём.";
    if (!row.public) return "Это закрытая бронь — на неё не записываются.";
    if (row.ends <= now()) return "Это событие уже закончилось.";
    const res = await env.DB.prepare(
      "INSERT OR IGNORE INTO room_joins (booking_id, chat_id, user_id, user_name, username, created_at) " +
        "SELECT id, chat_id, ?, ?, ?, ? FROM room_bookings r WHERE id = ? AND r.public = 1 " +
        "AND (r.capacity IS NULL OR (SELECT COUNT(*) FROM room_joins j WHERE j.booking_id = r.id) < r.capacity)"
    ).bind(me.id, me.name, me.username ?? null, now(), row.id).run();
    if (res.meta.changes || (await first(env, "SELECT 1 AS ok FROM room_joins WHERE booking_id = ? AND user_id = ?", row.id, me.id))) return null;
    const latest = await first(env, "SELECT public, capacity FROM room_bookings WHERE id = ?", row.id);
    if (!latest) return "Это событие уже отменено.";
    if (!latest.public) return "Это закрытая бронь — на неё не записываются.";
    return `Мест больше нет — на событие уже записались ${latest.capacity} чел.`;
  },

  async room_leave(env, chatId, me, admin, body) {
    await env.DB.prepare("DELETE FROM room_joins WHERE booking_id = ? AND chat_id = ? AND user_id = ?").bind(Number(body.id), chatId, me.id).run();
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
    const t = now();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM room_joins WHERE booking_id IN (SELECT id FROM room_bookings WHERE chat_id = ? AND ends > ?)").bind(chatId, t),
      env.DB.prepare("DELETE FROM room_bookings WHERE chat_id = ? AND ends > ?").bind(chatId, t),
    ]);
    await roomAnnounce(env, chatId, "Админ отменил все брони игровой.");
    return null;
  },

  async room_cancel(env, chatId, me, admin, body) {
    const row = await first(env, "SELECT * FROM room_bookings WHERE id = ? AND chat_id = ?", Number(body.id), chatId);
    if (!row) return "Эта бронь уже отменена.";
    if (row.user_id !== me.id && !admin) return "Отменить может только тот, кто бронировал, или админ чата.";
    if (!(await dropRoomBooking(env, row, row.user_id === me.id))) return "Эта бронь уже отменена.";
    return null;
  },
};

async function apiState(request, env) {
  const { chatId, me, admin, section } = await authorize(request, env, "state");
  await tick(env, chatId);
  return json(await state(env, chatId, me, admin, section));
}

async function apiAction(request, env) {
  const { chatId, me, admin, section } = await authorize(request, env, "action");
  const body = await readObject(request, API_BODY_MAX);
  const action = typeof body.action === "string" && Object.hasOwn(ACTIONS, body.action) ? ACTIONS[body.action] : null;
  if (!action || (PLAYROOM_ONLY.has(body.action) && !playroom(env))) throw new ApiError("Некорректный запрос.");
  const announces = ANNOUNCING.has(body.action) && !admin;
  if (announces) {
    const retry = full(env, "room", me.id);
    if (retry) throw new ApiError(`Слишком часто бронируешь и отменяешь — попробуй через ${Math.ceil(retry / 60)} мин.`, 429, retry);
  }
  await tick(env, chatId);
  const actor = { id: me.id, name: me.name, username: me.username };
  const trail = {};
  const error = await action(env, chatId, actor, admin, body, trail);
  if (error) throw new ApiError(error);
  const { action: _, ...fields } = body;
  await audit(env, chatId, body.action, actor, { ...trail, details: { ...fields, ...trail.details, admin } });
  if (announces) spend(env, "room", me.id);
  if (body.action === "privacy") me.hidden = !!body.hidden;
  if (ROOM_ACTIONS.has(body.action)) await updateRoomBoard(env, chatId);
  else if (body.action !== "dm") await updatePinned(env, chatId);
  return json(await state(env, chatId, me, admin, section));
}

