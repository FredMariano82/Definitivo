const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar\\TODOS.xlsx';

function limparPuntuacao(val) {
  if (val === null || val === undefined) return val;
  return String(val).replace(/[^a-zA-Z0-9]/g, '');
}

function processarRG() {
  console.log("🚀 Iniciando processamento da coluna RG em TODOS.xlsx...");

  if (!fs.existsSync(filePath)) {
    console.error("❌ Arquivo TODOS.xlsx não encontrado em scratch/recuperar");
    return;
  }

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Planilha carregada: ${data.length} registros.`);

  let alterados = 0;
  const dataLimpa = data.map(row => {
    // Tenta encontrar a coluna RG (independente de maiúscula/minúscula)
    const rgKey = Object.keys(row).find(k => k.toUpperCase() === 'RG');
    
    if (rgKey && row[rgKey]) {
      const original = row[rgKey];
      const limpo = limparPuntuacao(original);
      if (original !== limpo) {
        row[rgKey] = limpo;
        alterados++;
      }
    }
    return row;
  });

  console.log(`✅ Processamento concluído: ${alterados} registros de RG limpos.`);

  const newWs = XLSX.utils.json_to_sheet(dataLimpa);
  wb.Sheets[sheetName] = newWs;
  XLSX.writeFile(wb, filePath);

  console.log(`💾 Arquivo salvo com sucesso em: ${filePath}`);
}

processarRG();
