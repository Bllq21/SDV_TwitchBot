# Stardew Valley Twitch Bot

**English** · [Español](README.es.md)

A Twitch chat bot built for a Stardew Valley community. It looks up NPC gift
preferences, manages the channels it joins, and gives moderators a one-command
lockdown for disruptive chats.

The bot uses [tmi.js](https://github.com/tmijs/tmi.js) for Twitch chat and can
run as a normal Node.js process or as a Firebase Cloud Function.

## Commands

| Command | Who | Description |
| --- | --- | --- |
| `!sdv <NPC>` | Everyone | Posts gift preferences for a Stardew Valley NPC. |
| `!sdv Universal` | Everyone | Posts universal gift preferences. |
| `!invite` | Viewers in the bot channel | Adds the caller's channel to the bot. |
| `!leave` | Viewers in the bot channel | Removes the caller's channel from the bot. |
| `!lockdown` | Moderators / broadcaster | Enables followers-only, slow mode, and unique-chat mode. |
| `!lockdown_undo` | Moderators / broadcaster | Reverts the lockdown settings. |

NPC responses come from `src/npc.json`. The joined channels persist in
`src/channels.json`.

## Setup

Requirements: Node.js 20+, a Twitch bot account, and an OAuth token for that
account.

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```env
TWITCH_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_token_here
BOT_CHANNEL=your_channel
PORT=8044
```

- `TWITCH_USERNAME` is the bot account name.
- `TWITCH_OAUTH_TOKEN` is the chat OAuth token for the bot account. Keep the
  `oauth:` prefix.
- `BOT_CHANNEL` is the channel where `!invite` and `!leave` are accepted. The
  example config uses `sdvmouse`; change it to your channel.
- `src/channels.json` starts with that same example channel. Add or remove
  entries manually, or let viewers use `!invite` / `!leave`.

Run locally:

```bash
npm start
```

The bot connects to Twitch and a health endpoint listens on
`http://localhost:8044`. For auto-restart during development:

```bash
npm run dev
```

## Firebase deployment

The Express app is exported as the `app` Cloud Function:

```bash
npm install -g firebase-tools
firebase login
firebase init functions
npm run deploy
```

Set `TWITCH_USERNAME`, `TWITCH_OAUTH_TOKEN`, and `BOT_CHANNEL` in the Firebase
environment before deploying. The bot connects when the function module loads.

## Project structure

```text
.
├── inicio.js          # Bot logic, commands, and Firebase export
├── src/
│   ├── channels.json  # Channels the bot has joined
│   └── npc.json       # NPC gift data used by !sdv
├── .env.example
└── package.json
```

## Notes

- Tokens are read from the environment; no credentials are stored in the repo.
- The original project used a Replit keepalive process. That has been removed;
  the Firebase/Express health endpoint replaces it.
- Lockdown uses Twitch chat settings through tmi.js and requires the bot to be a
  moderator in the target channel.

## License

MIT — see [LICENSE](LICENSE).
