const fs = require('fs');
let code = fs.readFileSync('scripts/robo3/payload_941.json', 'utf8');
code = code.replace(/"customFields": \{\}/, '"customFields": []');
fs.writeFileSync('scripts/robo3/payload_941_array.json', code);
