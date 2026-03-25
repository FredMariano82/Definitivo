const fs = require('fs');
const files = fs.readdirSync('.');
files.forEach(f => {
  const stat = fs.statSync(f);
  if (f.includes('log') || f.includes('sync') || f.includes('output')) {
    console.log(`${f.padEnd(25)} | ${Math.round(stat.size / 1024)} KB`);
  }
});
