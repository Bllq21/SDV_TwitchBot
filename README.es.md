# Bot de Twitch para Stardew Valley

[English](README.md) · **Español**

Bot de chat de Twitch creado para una comunidad de Stardew Valley. Consulta las
preferencias de regalos de los NPCs, gestiona los canales a los que se une y da a
los moderadores un comando único para bloquear el chat ante una situación
problemática.

Usa [tmi.js](https://github.com/tmijs/tmi.js) para el chat de Twitch y puede
correr como un proceso Node normal o como Cloud Function de Firebase.

## Comandos

| Comando | Quién | Descripción |
| --- | --- | --- |
| `!sdv <NPC>` | Todos | Publica las preferencias de regalos de un NPC de Stardew Valley. |
| `!sdv Universal` | Todos | Publica las preferencias de regalos universales. |
| `!invite` | Espectadores en el canal del bot | Agrega el canal de quien lo usa al bot. |
| `!leave` | Espectadores en el canal del bot | Quita el canal de quien lo usa del bot. |
| `!lockdown` | Moderadores / broadcaster | Activa followers-only, slow mode y unique-chat mode. |
| `!lockdown_undo` | Moderadores / broadcaster | Revierte la configuración del lockdown. |

Las respuestas de los NPCs salen de `src/npc.json`. Los canales unidos se
persisten en `src/channels.json`.

## Instalación

Requisitos: Node.js 20+, una cuenta de bot de Twitch y un token OAuth para esa
cuenta.

```bash
npm install
cp .env.example .env
```

Completá `.env`:

```env
TWITCH_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_token_here
BOT_CHANNEL=your_channel
PORT=8044
```

- `TWITCH_USERNAME` es el nombre de la cuenta del bot.
- `TWITCH_OAUTH_TOKEN` es el token de chat de la cuenta del bot. Mantené el
  prefijo `oauth:`.
- `BOT_CHANNEL` es el canal donde se aceptan `!invite` y `!leave`. La
  configuración de ejemplo usa `sdvmouse`; cambialo por tu canal.
- `src/channels.json` arranca con ese mismo canal de ejemplo. Agregá o quitá
  entradas manualmente, o dejá que los espectadores usen `!invite` / `!leave`.

Ejecución local:

```bash
npm start
```

El bot se conecta a Twitch y un endpoint de health escucha en
`http://localhost:8044`. Para reinicio automático durante el desarrollo:

```bash
npm run dev
```

## Deploy en Firebase

La app Express se exporta como la Cloud Function `app`:

```bash
npm install -g firebase-tools
firebase login
firebase init functions
npm run deploy
```

Configurá `TWITCH_USERNAME`, `TWITCH_OAUTH_TOKEN` y `BOT_CHANNEL` en el entorno
de Firebase antes del deploy. El bot se conecta cuando se carga el módulo de la
función.

## Estructura del proyecto

```text
.
├── inicio.js          # Lógica del bot, comandos y export de Firebase
├── src/
│   ├── channels.json  # Canales a los que se unió el bot
│   └── npc.json       # Datos de regalos usados por !sdv
├── .env.example
└── package.json
```

## Notas

- Los tokens se leen del entorno; no hay credenciales guardadas en el repo.
- El proyecto original usaba un keepalive de Replit. Ese proceso se eliminó; el
  endpoint de health de Firebase/Express lo reemplaza.
- El lockdown usa la configuración de chat de Twitch a través de tmi.js y
  requiere que el bot sea moderador en el canal objetivo.

## Licencia

MIT — ver [LICENSE](LICENSE).
