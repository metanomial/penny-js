const Discord = require('discord.js');
const JSON5 = require('json5');
const fs = require('fs');
const request = require('request');
const url = require('url');

/* Configuration File */

const configPath = './config.json5';

function getConfig() {
  return JSON5.parse(
    fs.readFileSync(configPath, 'utf8')
  );
}

let config = {};

try {
  config = getConfig();
} catch(exception) {
  console.log('Cannot load configuration: ' + exception.message);
}

/* Cleverbot */

class Cleverbot {
  
  constructor(key, tweak1 = 50, tweak2 = 50, tweak3 = 50) {
    this.state = null;
    this.key = key;
    this.tweak1 = tweak1; // 0-100, sensible to wacky
    this.tweak2 = tweak2; // 0-100, shy to talkative
    this.tweak3 = tweak3; // 0-100, self-centred to attentive
  }
  
  disable() {
    this.mute = true;
  }
  
  enable() {
    this.mute = false;
  }
  
  chat(input, callback) {
    
    const cleverbotInput = input
      .replace(/penny/gi, 'Cleverbot');
    
    // Request endpoint
    const endpoint = new URL('/getreply', 'https://www.cleverbot.com/');
    endpoint.searchParams.set('key', this.key);
    endpoint.searchParams.set('input', cleverbotInput);
    endpoint.searchParams.set('cb_settings_tweak1', this.tweak1);
    endpoint.searchParams.set('cb_settings_tweak2', this.tweak2);
    endpoint.searchParams.set('cb_settings_tweak3', this.tweak3);
    
    // Add existing conversation state to parameters
    if(this.state) {
      endpoint.searchParams.set('cs', this.state);
    }
    
    // Make request
    request(endpoint.toString(), (error, response, body) => {
      
      // On error
      if(error) {
        return void console.error(error);
      }
      
      // Parse response body
      const { output, cs } = JSON.parse(body);
      
      // Store conversation state
      this.state = cs;
      
      const pennyOutput = output
        .replace(/cleverbot/gi, 'Penny')
        .replace(/hello[.!]/gi, 'Salutations!');
      callback(pennyOutput);
    });
  }
}

/* Discord client */

const discordClient = new Discord.Client;
const threads = new Map;
let prefix = '';

discordClient.on('ready', () => {
    console.log(`Salutations! I'm logged in as ${discordClient.user.tag}`);
    prefix = `<@${discordClient.user.id}>`;
});

discordClient.on('message', message => {
  
  // Ignore self
  if(message.author.id === discordClient.user.id) {
    return;
  }
  
  if(
    message.channel.type === 'text' &&
    message.content.startsWith(prefix) ||
    message.channel.type === 'dm'
  ) {
    
    const dialog = (message.channel.type === 'text')
      ? message.cleanContent.slice(discordClient.user.username.length + 1).trim
      : message.cleanContent;
    
    // Start a new thread
    if(!threads.has(message.author.id)) {
      threads.set(message.author.id, new Cleverbot(config.cleverbotToken, 25, 50, 75));
    }
    
    // Log dialog
    console.log(`<${message.author.tag}>: ${dialog}`);
    
    // Chat with penny
    threads
      .get(message.author.id)
      .chat(dialog, reply => {
        message.channel.send(reply);
        console.log(`<Penny> ${reply}`);
      });
  }
});

// Login to discord
discordClient.login(config.discordToken);
