# Ideas

Ideas we want but haven't built yet. Each one says why it's worth doing and how we'd build it, so whoever picks it up doesn't start from zero.

---

## QR codes on the machines (physical onboarding)

**Status:** idea, not started
**Depends on:** nothing. Everything it needs already exists (Mini App deep links, the in-app guide, `requestWriteAccess`).

### Why

1. **Closed DMs are the biggest gap in the reminders.** Every reminder (finish, +1/3/5 h, queue, booking) goes to DMs. If someone never pressed "Старт" with the bot, Telegram won't let the bot write to them. The bot's only fallback is to tag them in the group chat: «Стиралка 3 закончила. @username, у тебя закрыты личные сообщения — забери, пожалуйста, вещи». That works, but it's public and noisy. The real fix is for DMs to be open from the very first use.
2. **People are standing at the machine when they need the app.** Right now the only way in is the pinned message in the group chat. Nobody scrolls to the laundry topic with a wet basket in their hands. A QR code on the machine opens the right place in one scan.
3. **More runs get logged.** Every run started without the bot leaves a hole in the board. If the sticker opens that exact machine with «Занять» ready, logging takes about five seconds. Marking a machine someone else forgot to log is just as quick, and that also counts toward the «Герой прачечной» badge.

### Goals / non-goals

- **Goal:** a first-time user scans, takes a machine, and has DMs open, in under 30 seconds.
- **Goal:** a returning user scans and lands on that machine's sheet, with no tutorial.
- **Non-goal:** letting people outside the dorm chat in. A QR code is not an access token. Chat membership is still checked on every request.
- **Non-goal:** forcing DMs open. Telegram always lets the user decline `requestWriteAccess`. We make "allow" the obvious main button and ask again later, and that's as far as it goes.

### User flow

1. The user scans the sticker on «Стиралка 3» with their phone camera. Telegram opens the Mini App.
2. **First time on this device** (no `guide-qr` in `localStorage`): a 2-step overlay over the sheet for Стиралка 3.
   - **Step 1 of 2:** how to take the machine.
   - **Step 2 of 2:** "allow the bot to message you", which calls `requestWriteAccess`.
3. **Every later time:** straight to Стиралка 3's sheet. The state of the machine (free, running, done) decides which buttons show, exactly as when the tile is tapped today.
4. **The door QR** opens the laundry overview instead of a single machine.

### How to build it

**1. Deep link.** `appLink()` already builds `https://t.me/<bot>/<APP_SHORT_NAME>?startapp=<chatId>_<section>`. A QR link adds a machine:

```
https://t.me/<bot>/techfloor?startapp=-1003698238682_qw3    machine
https://t.me/<bot>/techfloor?startapp=-1003698238682_q      door
```

Telegram allows only `A-Z a-z 0-9 _ -` in `startapp`, up to 64 characters, and this fits (17 characters).

**2. Server: accept the new parameter.** `identify()` currently matches `^(-?\d{1,15})(?:_([a-z]))?$`, so it only accepts a single-letter section like `_p`. Extend it to accept `_q` with an optional `[wd]\d{1,2}`. Check the machine against `MACHINES` and `NUMBERS`, and treat anything else as the plain laundry view rather than an error, because an old or damaged sticker must still open the app. Then return `qr: { t, n }` in the state. The app asks for state about every 15–45 seconds with the same `initData`, so the client must act on `qr` only once per launch.

**3. Client: open the machine and show the overlay.**
- On the first `setState` with `S.qr`, call `openMachine()` for that machine and switch the `w`/`d` tab to match.
- If `guide-qr` isn't set, show the two-step overlay first, using the same `guideStep` / `guideBubble` helpers as the existing guide. Set `guide-qr` when the user finishes or skips.
- Step 2 calls the existing `allowDm()`. With Bot API 6.9+ that's `tg.requestWriteAccess`. On older clients it falls back to opening the bot with `?start=app`. If the user declines, the existing `dmCard()` at the top of the app keeps asking. Nothing new is needed for the retry.

**4. People outside the chat.** `authorize()` already rejects them with «Приложение доступно только участникам чата.» For a `qr` launch, show friendlier text instead (see the copy below). This is the same check with different words.

**5. Measuring it.** Log one `qr` event per launch through `audit()`, with `mtype`/`num`, using a tiny client-called action (not from `authorize`, which runs on every poll). That gives us:
- scans per machine (which stickers get used, and which went missing);
- the share of active people who can receive DMs: `dm.ok = 1` among `people` seen in the last 14 days, before and after the stickers go up;
- closed-DM tags in the group chat per week. This should trend towards zero, and it's the number that matters most.

**6. Stickers.**
- One per machine, plus one on the door.
- QR at least 3×3 cm, with the machine number large next to it, so a sticker moved to the wrong machine is obvious.
- Laminated, at eye level on the door or the top, not on the side that gets splashed or vibrates.
- A small `t.me/<bot>` underneath for anyone whose camera won't scan.
- Generate them with a short script (for example `qrcode` in Python) that prints a sheet for the 11 washers, 11 dryers and the door, so reprinting a lost one is one command.

### Copy

**Sticker**
> **СТИРАЛКА 3**
> Наведи камеру — узнаешь, когда освободится, и займёшь в один тап
> *Напомню в личку, когда бельё готово*

**Step 1 of 2**
> **Это стиралка 3.**
> Запусти программу и нажми «Занять» — введи время с дисплея. Все увидят, что машина занята и до скольки.
> **[Дальше]**

**Step 2 of 2**
> **Я напомню, когда забрать.**
> Разреши боту писать тебе — пришлю сообщение, когда стирка закончится. Без спама.
> **[Разрешить и начать]** · [Пропустить]

**Not a member of the chat**
> Прачечная только для жителей корпуса. Вступи в чат общаги — и QR заработает.

### Rollout

1. Build steps 1–5, and test with a printed QR on one machine and a few phones (iOS camera, Android camera, Telegram's own scanner).
2. Print and put up all stickers on one evening. Post once in the laundry topic explaining what they are.
3. Compare the closed-DM numbers after 2 weeks.

### Risks and open questions

- **Opening t.me links without a VPN.** Phone cameras usually hand `t.me` links straight to the Telegram app. Some open a browser first, where `t.me` may be slow or blocked. We need to test on real phones. A `tg://resolve?domain=<bot>&appname=techfloor&startapp=…` link avoids the browser, but many camera apps won't open `tg://` at all, so it can't be the only option. The page inside the app already loads without a VPN through the `/start` loader.
- **Moved or swapped stickers.** The sheet shows the machine number large, so the user can see they're on the wrong machine. Reprinting is cheap.
- **The chat id is visible inside the QR.** That's fine: it isn't a secret, and every request still checks chat membership and `/block`.
- **People who decline DMs anyway.** The group-chat tag stays as the fallback for them. QR onboarding makes that case rare; it can't make it disappear.
