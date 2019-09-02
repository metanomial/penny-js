const Discord = require('discord.js')
const Cleverbot = require('./cleverbot')
const fs = require('fs')
const config = require('./config.json')

const Penny = {
    discord: new Discord.Client,
    states: new Map
}

Penny.discord.on('ready', () => {
    console.log(`Salutations! I'm logged in as ${Penny.discord.user.tag}`)
    Penny.prefix = `<@${Penny.discord.user.id}>`
})

Penny.discord.on('message', message => {
    if(message.author.bot) return
    if(message.content.startsWith(Penny.prefix) || message.channel.type === 'dm') {
        const dialog = (message.content.startsWith(Penny.prefix))
            ? message.cleanContent.slice(Penny.discord.user.username.length + 1).trim()
            : message.cleanContent
        if(!Penny.states.has(message.author.id)) {
            Penny.states.set(message.author.id, new Cleverbot(config.cleverbot, 25, 50, 75))
        }
        console.log(`+ ${message.author.tag}: ${dialog}`)
        Penny.states
            .get(message.author.id)
            .getReply(dialog, reply => {
                message.channel.send(reply)
                console.log(`    -> ${reply}`)
            })
    }
})

Penny.discord.login(config.discord)
