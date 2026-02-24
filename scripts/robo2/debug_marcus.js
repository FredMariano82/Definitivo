
const fs = require('fs');
const Papa = require('papaparse');

const csvPath = "c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Pessoas_2026224_0302.csv";
const searchName = "Marcus Vinícius Mariano";

const fileContent = fs.readFileSync(csvPath, 'latin1');

Papa.parse(fileContent, {
    header: true,
    complete: function (results) {
        const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";
        const target = normalize(searchName);

        const found = results.data.find(row => {
            return Object.values(row).some(val => normalize(String(val)).includes(target));
        });

        if (found) {
            fs.writeFileSync('marcus_record.json', JSON.stringify(found, null, 2));
            console.log("✅ Gravado em marcus_record.json");
        } else {
            console.log("❌ Não encontrado.");
        }
    }
});
