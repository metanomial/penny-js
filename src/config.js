const JSON5 = require('json5');
const fs = require('fs').promises;

module.exports = class Config {
  
  constructor(path, data = {}) {
    this.data = data;
    this.path = path;
  }
  
  // Get config property
  get(name) {
    return (this.data[name] !== undefined)
      ? this.data[name]
      : null;
  }
  
  // Set config property
  set(name, value) {
    this.data[name] = value;
  }
  
  // Load config from file
  async load() {
    
    // Read
    let contents;
    try {
      contents = await fs.readFile(this.path, 'utf8');
    } catch(readError) {
      throw 'Unable to read config: ' + readError.message;
    }
    
    // Parse
    try {
      Object.assign(this.data, JSON5.parse(contents));
    } catch(parseError) {
      throw 'Unable to parse config: ' + parseError.message;
    }
    
    return this;
  }
  
  // Write config to file
  async write() {
    
    // Stringify
    const contents = JSON5.stringify(this.data);
    
    // Write
    try {
      await fs.writeFile(this.path, contents);
    } catch(writeError) {
      throw 'Unable to write config: ' + writeError.message;
    }
  }
}