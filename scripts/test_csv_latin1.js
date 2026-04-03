const fs = require('fs');

const filePath = 'C:\\Users\\central_seguranca\\Downloads\\Pessoas_202631_2025.csv';

try {
    const buffer = fs.readFileSync(filePath);
    // Tenta interpretar como ISO-8859-1 (Latin1)
    const text = buffer.toString('latin1');
    const lines = text.split('\n');
    
    console.log('--- BUSCANDO ACENTOS NO CSV (LATIN1) ---');
    let found = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Procurar por padrões comuns de acento em português
        if (line.includes('é') || line.includes('ê') || line.includes('ã') || line.includes('ç') || line.includes('í')) {
            console.log(`L${i}: ${line.trim()}`);
            found++;
        }
        if (found >= 20) break;
    }
} catch (e) {
    console.log(`Erro: ${e.message}`);
}
