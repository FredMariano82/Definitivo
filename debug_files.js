const fs = require('fs');
console.log("Arquivos na raiz:");
fs.readdirSync('.').forEach(file => {
  console.log(file);
});
