const Discord = require('discord.js');
const Config = require('./src/config');
const Cleverbot = require('./src/cleverbot');

const config = new Config('./config.json5');
const discord = new Discord.Client;
const threads = new Map;

discord.on('ready', () => {
  const tag = discord.user.tag;
  console.log(`Salutations! I'm logged in as ${ tag }`);
});

discord.on('message', message => {
  
  // Ignore self
  if(message.author.id === discord.user.id) {
    return;
  }

  // Direct mention in a text channel
  if(message.channel.type === 'text' && message.content.startsWith(`<@${ discord.user.id }>`)) {
    const cleanContent = message.cleanContent
      .slice(discord.user.username.length + 1)
      .trim();
    converse(cleanContent, message.author, message.channel);
  }

  // Direct message channel
  if(message.channel.type === 'dm') {
    const cleanContent = message.cleanContent.trim();
    converse(cleanContent, message.author, message.channel);
  }
});

function converse(message, author, channel) {
  
  // Start a new thread
  if(!threads.has(author.id)) {
    threads.set(author.id, new Cleverbot(config.get('cleverbotKey'), 25, 50, 75));
  }
  
  // Log dialog
  console.log(`<${ author.tag }>: ${ message }`);
  
  // Chat with penny
  threads
    .get(author.id)
    .chat(message, reply => {
      channel.send(reply);
      console.log(`<Penny> ${reply}`);
    });
}

// Login
config.load()
  .then(config => {
    const token = config.get('discordToken');
    discord.login(token)
      .catch(console.error);
  })
  .catch(console.error);
