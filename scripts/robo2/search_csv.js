
const fs = require('fs');
const Papa = require('papaparse');

const csvPath = "c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Pessoas_2026224_0302.csv";
const searchName = "Marcus Vinícius Mariano";

const fileContent = fs.readFileSync(csvPath, 'latin1'); // latin1 to handle accents correctly

Papa.parse(fileContent, {
    header: true,
    complete: function (results) {
        // Normalizar strings para comparação (remover acentos e colocar em maiúsculo)
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

        const target = normalize(searchName);

        const found = results.data.filter(row => {
            return Object.values(row).some(val => normalize(String(val)).includes(target));
        });

        if (found.length > 0) {
            console.log("✅ Usuário Encontrado!");
            console.log(JSON.stringify(found, null, 2));
        } else {
            console.log("❌ Nome '" + searchName + "' não encontrado.");
            // Busca mais ampla se falhar
            const targetShort = normalize("Marcus");
            const partial = results.data.filter(row => normalize(String(row["Usuário"] || "")).includes(targetShort));
            if (partial.length > 0) {
                console.log("\n⚠️ Sugestões encontradas com 'Marcus':");
                partial.forEach(p => console.log(`- ${p["Usuário"]} (ID: ${p["ID"]})`));
            }
        }
    }
});
