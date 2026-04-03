const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\central_seguranca\\Downloads\\Pessoas_202631_2025.csv';

function tryEncoding(encoding) {
    try {
        console.log(`\n--- TESTANDO ENCODING: ${encoding} ---`);
        const buffer = fs.readFileSync(filePath);
        const text = buffer.toString(encoding);
        const lines = text.split('\n').slice(0, 50);
        
        lines.forEach((line, i) => {
            if (line.includes('Jos') || line.includes('Andr') || line.includes('Concei')) {
                console.log(`L${i}: ${line.trim()}`);
            }
        });
    } catch (e) {
        console.log(`Erro com ${encoding}: ${e.message}`);
    }
}

tryEncoding('utf8');
tryEncoding('latin1'); // ISO-8859-1
