import { createBot, Intents, Message, sendMessage, startBot } from "discordeno";

import config from "./config.ts";

Deno.permissions.request({
  name: "net",
  host: "discord.com",
});
Deno.permissions.request({
  name: "net",
  host: "gateway.discord.gg",
});

/** Penny Discord bot */
const bot = createBot({
  token: config.discord.token,
  intents: Intents.Guilds | Intents.GuildMessages,
});

// Login event handler
bot.events.ready = (_bot, { user }) => {
  console.log(
    `Salutations! I'm logged in as ${user.username}#${user.discriminator}`,
  );
};

interface Conversation {
  context?: string;
  lastMessage: Date;
}

const convos = new Map<bigint, Conversation>();

// Message event handler
bot.events.messageCreate = async (bot, message) => {
  if (message.isFromBot) return;
  if (message.mentionedUserIds.includes(bot.id)) {
    await makeReply(message).catch((error) => {
      sendMessage(bot, config.discord.logChannel, {
        content: `\`\`\`${error.message}\`\`\``,
      });
    });
  }
};

async function makeReply(message: Message): Promise<void> {
  // Start conversation thread if needed
  if (!convos.has(message.authorId)) {
    convos.set(message.authorId, {
      lastMessage: new Date(),
    });
  }

  // Replace instances of "Penny" with "Cleverbot"
  const cleverText = message
    .content
    .replaceAll("penny", "cleverbot")
    .replaceAll("Penny", "Cleverbot")
    .replace("/<@!?\d+>/", "");

  // Discard old conversation state if last message is older than 5 minutes
  const conversation = convos.get(message.authorId) as Conversation;
  const state = conversation.lastMessage.getTime() > Date.now() - 5 * 60 * 1000
    ? conversation.context
    : undefined;

  // Request URL
  const url = new URL("/getreply", "https://www.cleverbot.com/");
  url.search = new URLSearchParams({
    key: config.cleverbot.token,
    input: cleverText,
    cs: state ?? "",
    cb_settings_tweak1: "25",
    cb_settings_tweak2: "50",
    cb_settings_tweak3: "75",
  }).toString();

  const response = await fetch(url);
  const data = await response.json();
  const { cs: newState, output: replyText } = data;

  // Store conversation state
  convos.set(message.authorId, {
    context: newState,
    lastMessage: new Date(),
  });

  // Replace instance of "Cleverbot" and greetings with "Penny" and Pennyisms
  const pennyText = replyText
    .replaceAll("Cleverbot", "Penny")
    .replaceAll("cleverbot", "penny")
    .replace(/^Hello/, "Salutations")
    .replace(/^hello/, "salutations");

  await sendMessage(bot, message.channelId, {
    content: pennyText,
    messageReference: {
      messageId: message.id,
      failIfNotExists: false,
    },
  });
}

await startBot(bot);
