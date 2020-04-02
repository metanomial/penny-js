const Discord = require('discord.js');
const fetch = require('node-fetch');

// Check environment variables
if(!process.env.CLEVERBOT_KEY) throw new Error('CLEVERBOT_KEY environment variable must be set.');
if(!process.env.PENNY_LOG) throw new Error('PENNY_LOG environement variable must be set.');
if(!process.env.PENNY_TOKEN) throw new Error('PENNY_TOKEN environement variable must be set.');

/**
 * Discord.js client instance
 * @type {Discord.Client}
 * @see https://discord.js.org/#/docs/main/12.1.1/class/Client
 */
const discordClient = new Discord.Client;

// Register Discord.js event listeners
discordClient.on('ready', readyHandler);
discordClient.on('message', messageHandler);
discordClient.login(process.env.PENNY_TOKEN);

/**
 * Log channel
 * @type {Discord.TextChannel?}
 */
let logChannel;

/**
 * Send message to both predefined Discord log channel and console log
 * @param {Discord.StringResolvable|Discord.APIMessage} content
 * @param {Discord.MessageOptions|Discord.MessageAdditions} options
 * @see https://discord.js.org/#/docs/main/12.1.1/class/TextChannel?scrollTo=send
 */
function pennyLog(content, options) {
	console.log(content.toString());
	if(logChannel) logChannel.send(content, options);
}

/**
 * Discord.js ready event handler
 * @throws {Error} on failure to resolve log text channel
 */
async function readyHandler() {

	// Resolve log channel
	const channel = await discordClient.channels.fetch(process.env.PENNY_LOG);
	if(!(channel instanceof Discord.TextChannel)) throw new Error('Log channel must be a text channel.');
	logChannel = channel;
	
	// Login salutations
	pennyLog(`Salutations! I'm logged in as ${ discordClient.user.tag }`);
}

/**
 * Conversation threads
 * @type {Map}
 */
const threads = new Map;

/**
 * Discord.js message event handler
 * @param {Discord.Message} message
 * @see https://discord.js.org/#/docs/main/12.1.1/class/Message
 */
async function messageHandler(message) {

	// Ignore bots
	if(message.author.bot) return;

	// Handle direct messages or mentions
	if(message.channel.type == 'dm' || message.mentions.has(discordClient.user)) {
		
		// Start conversation thread if needed
		if(!threads.has(message.author.id))
			threads.set(message.author.id, null);

		// Replace instances of "Penny" with "Cleverbot"
		const cleverText = message
			.cleanContent
			.replace(/Penny/g, 'Cleverbot');
		
		// Request URL
		const url = new URL('/getreply', 'https://www.cleverbot.com/');
		url.search = new URLSearchParams({
			'key': process.env.CLEVERBOT_KEY,
			'input': cleverText,
			'cs': threads.get(message.author.id),
			'cb_settings_tweak1': 25,
			'cb_settings_tweak2': 50,
			'cb_settings_tweak3': 75
		});
		
		let replyText;
		let state;

		// Fetch chat bot reply
		try {
			const response = await fetch(url);
			const data = await response.json();
			replyText = data.output;
			state = data.cs;
		}

		// Log failure to fetch chat bot reply
		catch(err) {
			return void pennyLog('Failed to fetch cleverbot reply. ```' + err + '```');
		}

		// Store conversation state
		threads.set(message.author.id, state);
		
		// Replace instance of "Cleverbot" and greetings with "Penny" and Pennyisms
		const pennyText = replyText
			.replace(/Cleverbot/g, 'Penny')
			.replace(/cleverbot/g, 'penny')
			.replace(/^Hello/, 'Salutations')
			.replace(/^hello/, 'salutations');

		// Send a reply message on Discord 
		message.channel.send(pennyText);
	}
}
