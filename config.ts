import "std/dotenv/load.ts";

function require(name: string): string {
  const value = Deno.env.get(name);
  if (value === undefined) {
    console.error(`Missing required environment variable: ${name}`);
    Deno.exit(1);
  }
  return value;
}

export default {
  discord: {
    token: require("DISCORD_TOKEN"),
    logChannel: require("LOG_CHANNEL"),
  },
  cleverbot: {
    token: require("CLEVERBOT_TOKEN"),
  },
};
