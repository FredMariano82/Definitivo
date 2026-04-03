const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !f.startsWith('.') && f !== 'node_modules') {
        walkDir(dirPath, callback);
    } else {
        callback(path.join(dir, f));
    }
  });
}

console.log("🔍 Iniciando busca profunda por arquivos .env...");
let found = false;

walkDir('.', (filePath) => {
    if (path.basename(filePath).startsWith('.env') && !filePath.includes('node_modules')) {
        console.log(`✅ Achei arquivo em: ${filePath}`);
        if (filePath !== '.env.local') {
            fs.copyFileSync(filePath, '.env.local');
            console.log(`🚀 Copiado ${filePath} para .env.local na raiz.`);
        }
        found = true;
    }
});

if (!found) {
    console.log("❌ Nenhum arquivo de ambiente encontrado.");
}
