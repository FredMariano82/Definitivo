const fs = require('fs');

const filePath = 'C:\\Users\\central_seguranca\\Downloads\\Pessoas_2026315_1839.csv';

function tryEncoding(encoding) {
    try {
        console.log(`\n--- TESTANDO ENCODING: ${encoding} ---`);
        const buffer = fs.readFileSync(filePath);
        const text = buffer.toString(encoding);
        const lines = text.split('\n');
        
        // Procurar por nomes que geralmente tem acento
        let found = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('osé') || line.includes('ndré') || line.includes('ê') || line.includes('ç')) {
                console.log(`L${i}: ${line.trim()}`);
                found++;
            }
            if (found >= 10) break;
        }
    } catch (e) {
        console.log(`Erro com ${encoding}: ${e.message}`);
    }
}

tryEncoding('latin1');
tryEncoding('utf8');
