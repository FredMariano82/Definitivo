const fs = require('fs');
const path = require('path');

function findAndCopyEnv() {
    const searchPaths = [
        '.env.local',
        '.env',
        'scripts/.env.local',
        'scripts/.env',
        '../.env.local'
    ];

    for (const p of searchPaths) {
        if (fs.existsSync(p)) {
            console.log(`✅ Achei em: ${p}`);
            fs.copyFileSync(p, '.env.local');
            console.log(`🚀 Copiado para a raiz.`);
            return true;
        }
    }
    console.log("❌ Arquivo .env.local não encontrado em nenhum lugar.");
    return false;
}

findAndCopyEnv();
