const request = require('request')
const url = require('url')

module.exports = class Cleverbot {
    constructor(key, tweak1 = 50, tweak2 = 50, tweak3 = 50) {
        this.key = key
        this.tweak1 = tweak1
        this.tweak2 = tweak2
        this.tweak3 = tweak3
    }
    
    getReply(input, callback) {
        const endpoint = new URL('/getreply', 'https://www.cleverbot.com/')
        endpoint.searchParams.set('key', this.key)
        endpoint.searchParams.set('input', input)
        if(this.state) endpoint.searchParams.set('cs', this.state)
        endpoint.searchParams.set('cb_settings_tweak1', this.tweak1)
        endpoint.searchParams.set('cb_settings_tweak2', this.tweak2)
        endpoint.searchParams.set('cb_settings_tweak3', this.tweak3)
        request(endpoint.toString(), (error, response, body) => {
            if(error) return console.error(error)
            const {output, cs} = JSON.parse(body)
            this.state = cs
            callback(output)
        })
    }
}