require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const fetch = require("node-fetch");
const functions = require("firebase-functions");
const tmi = require("tmi.js");

const app = express();
const NPC_PATH = path.join(__dirname, "src", "npc.json");
const CHANNELS_PATH = path.join(__dirname, "src", "channels.json");

const BOT_USERNAME = process.env.TWITCH_USERNAME || "sdvmouse";
const OAUTH_TOKEN = process.env.TWITCH_OAUTH_TOKEN || "";
const BOT_CHANNEL = (process.env.BOT_CHANNEL || BOT_USERNAME).replace(/^#/, "");

let channelsFile = readChannels();
let client;
let block = false;
let npcList = [];

app.get("/", (request, response) => {
  response.send("Bot is running");
});

function readChannels() {
  try {
    return JSON.parse(fs.readFileSync(CHANNELS_PATH, "utf8"));
  } catch (error) {
    console.error("Could not read channels.json:", error.message);
    return [];
  }
}

function writeChannels() {
  fs.writeFileSync(CHANNELS_PATH, JSON.stringify(channelsFile, null, 2) + "\n");
}

function loadNpcs() {
  const data = JSON.parse(fs.readFileSync(NPC_PATH, "utf8"));
  npcList = Array.isArray(data) ? data : Object.values(data);
}

function firstLetter(value) {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function easternTime() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function addPerson(channelName) {
  if (channelsFile.some((item) => item.channels === `#${channelName}`)) {
    return;
  }
  channelsFile.push({ channels: `#${channelName}` });
  writeChannels();
  console.log(`Channel added: #${channelName}`);
}

function removePerson(index) {
  if (index === -1) {
    return;
  }
  channelsFile.splice(index, 1);
  writeChannels();
  console.log("Channel removed");
}

async function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  }

  const badges = context.badges || {};
  const isModUp = Boolean(badges.moderator || badges.broadcaster);
  const channel = target.replace(/^#/, "");
  const text = msg.trim();

  if (text === "!lockdown" && isModUp) {
    let uptime = "unknown";
    try {
      const response = await fetch(`https://decapi.me/twitch/uptime/${channel}`);
      uptime = await response.text();
    } catch (error) {
      console.error("Could not fetch uptime:", error.message);
    }

    console.log("Activating lockdown");
    client.followersonly(target, 1440).catch(console.error);
    client.slow(target, 10).catch(console.error);
    client.r9kbeta(target).catch(console.error);
    client.clear(target).catch(console.error);
    client
      .action(
        target,
        `Right now ${channel} is dealing with a situation. Please do not acknowledge it. ` +
          `Mods are working on it, keep enjoying the stream. ` +
          `Time: ${easternTime()} US/Eastern. Uptime: ${uptime}`
      )
      .catch(console.error);
  } else if (text === "!lockdown_undo" && isModUp) {
    console.log("Disabling lockdown");
    client.followersonlyoff(target).catch(console.error);
    client.slowoff(target).catch(console.error);
    client.r9kbetaoff(target).catch(console.error);
  } else if (text === "!sdv" || text.startsWith("!sdv ")) {
    if (block) {
      return;
    }

    const requested = firstLetter(text.replace(/^!sdv\s*/, ""));
    const npc = npcList.find((item) => item.Name === requested);

    if (npc) {
      const response = JSON.stringify(npc)
        .replace(/[ '"]+/g, " ")
        .replace("{", " ")
        .replace("}", " ");
      client.say(target, response).catch(console.error);
    } else {
      client
        .say(target, "/me Usage: !sdv <NPC> or !sdv Universal")
        .catch(console.error);
    }

    block = true;
    setTimeout(() => {
      block = false;
    }, 3000);
  } else if (text === "!invite" && target === `#${BOT_CHANNEL}`) {
    const index = channelsFile.findIndex(
      (item) => item.channels === `#${context.username}`
    );

    if (index === -1) {
      addPerson(context.username);
      client.say(target, "/me Bot joined your channel.").catch(console.error);
      startConnection();
    }
  } else if (text === "!leave" && target === `#${BOT_CHANNEL}`) {
    const index = channelsFile.findIndex(
      (item) => item.channels === `#${context.username}`
    );

    if (index !== -1) {
      removePerson(index);
      client.say(target, "/me Bot left your channel.").catch(console.error);
      startConnection();
    }
  }
}

function onConnectedHandler(address, port) {
  console.log(`Connected to ${address}:${port}`);
}

function onDisconnectedHandler(reason) {
  console.log(`Disconnected: ${reason}`);
}

function startConnection() {
  if (!OAUTH_TOKEN) {
    console.warn(
      "TWITCH_OAUTH_TOKEN is not set. Add it to .env or the environment before connecting."
    );
    return;
  }

  channelsFile = readChannels();
  const channels = channelsFile.map((item) => item.channels);
  const botChannel = `#${BOT_CHANNEL}`;

  if (!channels.includes(botChannel)) {
    channels.push(botChannel);
  }

  if (client) {
    client.disconnect().catch(() => {});
  }

  client = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true, secure: true },
    identity: {
      username: BOT_USERNAME,
      password: OAUTH_TOKEN,
    },
    channels,
  });

  client.on("message", onMessageHandler);
  client.on("connected", onConnectedHandler);
  client.on("disconnected", onDisconnectedHandler);
  client.connect().catch(console.error);
}

loadNpcs();
startConnection();

exports.app = functions.https.onRequest(app);

if (require.main === module) {
  const port = process.env.PORT || 8044;
  app.listen(port, () => {
    console.log(`Health endpoint listening on http://localhost:${port}`);
  });
}
