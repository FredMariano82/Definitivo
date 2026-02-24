
const fs = require('fs');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const path = require('path');

const csvPath = "c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Pessoas_2026224_0302.csv";
const excelPath = "c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\CONFERENCIA_ID_CONTROL.xlsx";

async function converter() {
    console.log("-----------------------------------------");
    console.log("📑 CONVERSOR CSV -> EXCEL");
    console.log("-----------------------------------------");

    try {
        console.log("📡 Lendo arquivo CSV...");
        // Tentamos ler com codificação latin1/win1252 para evitar erro nos acentos do ID Control
        const fileContent = fs.readFileSync(csvPath, 'latin1');

        console.log("📝 Processando dados...");
        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                if (results.data && results.data.length > 0) {
                    console.log(`📊 Sucesso! ${results.data.length} linhas processadas.`);

                    const worksheet = XLSX.utils.json_to_sheet(results.data);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados ID Control");

                    console.log("💾 Gravando arquivo Excel...");
                    XLSX.writeFile(workbook, excelPath);

                    console.log("-----------------------------------------");
                    console.log("✅ CONCLUÍDO COM SUCESSO!");
                    console.log(`📍 Arquivo: ${excelPath}`);
                    console.log("-----------------------------------------");
                } else {
                    console.error("⚠️ O arquivo CSV parece estar vazio.");
                }
            }
        });
    } catch (e) {
        console.error("❌ ERRO NA CONVERSÃO:", e.message);
    }
}

converter();
