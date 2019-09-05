const request = require('request');
const url = require('url');

module.exports = class Cleverbot {
  
  constructor(key, tweak1 = 50, tweak2 = 50, tweak3 = 50) {
    this.state = null;
    this.key = key;
    this.tweak1 = tweak1; // 0-100, sensible to wacky
    this.tweak2 = tweak2; // 0-100, shy to talkative
    this.tweak3 = tweak3; // 0-100, self-centred to attentive
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
      console.log(body); // DEBUG
      const { output, cs } = JSON.parse(body);
      
      // Store conversation state
      this.state = cs;
      
      const pennyOutput = output
        .replace(/cleverbot/gi, 'Penny')
        .replace(/hello[.!]/gi, 'Salutations!');
      callback(pennyOutput);
    });
  }
};
