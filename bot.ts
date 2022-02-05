import config from "./config.json" assert { type: "json" };
import { Bot, createBot, DiscordenoMessage, sendMessage } from "./deps.ts";

const convos = new Map();

export const bot = createBot({
  token: config.discord.token,
  botId: BigInt(config.discord.botId),
  intents: ["Guilds", "GuildMessages"],
  events: { ready, messageCreate },
});

async function ready(bot: Bot): Promise<void> {
  await log(`Salutations! I'm logged in as application ${bot.applicationId}`);
}

async function messageCreate(
  bot: Bot,
  message: DiscordenoMessage,
): Promise<void> {
  if (message.isBot) return;
  if (message.mentionedUserIds.includes(bot.id)) {
    // Start conversation thread if needed
    if (!convos.has(message.authorId)) {
      convos.set(message.authorId, null);
    }

    // Replace instances of "Penny" with "Cleverbot"
    const cleverText = message
      .content
      .replace(/^penny\s*[,:]?\s*/i, "")
      .replace(/penny/gi, "Cleverbot");

    // Request URL
    const url = new URL("/getreply", "https://www.cleverbot.com/");
    url.search = new URLSearchParams({
      key: config.cleverbot.token,
      input: cleverText,
      cb_settings_tweak1: "25",
      cb_settings_tweak2: "50",
      cv_settings_tweak3: "75",
    }).toString();

    let replyText: string;
    let state: string;

    // Fetch chat bot reply
    try {
      const response = await fetch(url);
      const data = await response.json();
      replyText = data.output;
      state = data.cs;
    } // Log failure to fetch chat bot reply
    catch (err) {
      return void log(`Failed to fetch Cleverbot reply. \`\`\`${err}\`\`\``);
    }

    // Store conversation state
    convos.set(message.authorId, state);

    // Replace instance of "Cleverbot" and greetings with "Penny" and Pennyisms
    const pennyText = replyText
      .replaceAll("Cleverbot", "Penny")
      .replaceAll("cleverbot", "penny")
      .replace(/^Hello/, "Salutations")
      .replace(/^hello/, "salutations");

    // Send a reply message on Discord
    sendMessage(bot, message.channelId, {
      content: pennyText,
    });
  }
}

async function log(content: string): Promise<void> {
  await sendMessage(bot, BigInt(config.discord.logChannel), { content });
}
