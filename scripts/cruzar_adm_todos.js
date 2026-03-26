const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const baseDir = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar';
const admPath = path.join(baseDir, 'Dados ADM.xlsx');
const todosPath = path.join(baseDir, 'TODOS_LIMPO.xlsx');
const outPath = path.join(baseDir, 'TODOS_FINAL_SINCRONIZADO.xlsx');

function normalizar(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function processarCruzamento() {
  console.log("🚀 Iniciando cruzamento Dados ADM vs TODOS_LIMPO...");

  if (!fs.existsSync(admPath) || !fs.existsSync(todosPath)) {
    console.error("❌ Arquivos de entrada não encontrados.");
    return;
  }

  // 1. LER DADOS ADM (MAPEAR NOME -> CHECAGEM)
  const wbADM = XLSX.readFile(admPath);
  const sheetADM = wbADM.Sheets['dados ADM'];
  const dataADM = XLSX.utils.sheet_to_json(sheetADM, { header: 1 });
  
  const mapaADM = new Map();
  dataADM.forEach(row => {
    const nome = row[0];
    const checagem = row[2]; // Ajustado para Coluna C (índice 2) conforme amostragem

    if (nome && typeof nome === 'string' && nome.length > 3) {
      if (checagem) {
        mapaADM.set(normalizar(nome), checagem);
      }
    }
  });
  console.log(`📊 Mapa ADM criado com ${mapaADM.size} registros únicos.`);

  // 2. LER TODOS_LIMPO E ATUALIZAR
  const wbTodos = XLSX.readFile(todosPath);
  const sheetTodos = wbTodos.Sheets[wbTodos.SheetNames[0]];
  const dataTodos = XLSX.utils.sheet_to_json(sheetTodos);

  let matches = 0;
  const dataFinal = dataTodos.map(row => {
    const nomeKey = Object.keys(row).find(k => k.toUpperCase() === 'NOME');
    const checagemKey = Object.keys(row).find(k => k.toUpperCase() === 'CHECAGEM') || 'CHECAGEM';

    if (nomeKey && row[nomeKey]) {
      const match = mapaADM.get(normalizar(row[nomeKey]));
      if (match) {
        row[checagemKey] = match;
        matches++;
      }
    }
    return row;
  });

  console.log(`🎯 Cruzamento concluído: ${matches} matches aplicados de ${dataTodos.length} registros.`);

  // 3. SALVAR
  const newWs = XLSX.utils.json_to_sheet(dataFinal);
  const newWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWb, newWs, 'Sincronizado');
  XLSX.writeFile(newWb, outPath);

  console.log(`💾 Resultado salvo em: ${outPath}`);
}

processarCruzamento();
