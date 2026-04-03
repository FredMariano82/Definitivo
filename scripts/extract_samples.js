const fs = require('fs');

const filePath = 'C:\\Users\\central_seguranca\\Downloads\\Pessoas_202631_2025.csv';

function extract(encoding) {
    try {
        const buffer = fs.readFileSync(filePath);
        const text = buffer.toString(encoding);
        const lines = text.split('\n').slice(0, 200);
        fs.writeFileSync(`c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Definitivo\\check_${encoding}.json`, JSON.stringify(lines, null, 2));
        console.log(`Salvo check_${encoding}.json`);
    } catch (e) {
        console.log(`Erro ${encoding}: ${e.message}`);
    }
}

extract('latin1');
extract('utf8');
