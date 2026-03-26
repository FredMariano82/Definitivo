const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const baseDir = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar';
const afetadosPath = path.join(baseDir, 'Afetados pelo Robo4.xlsx');
const backupPath = path.join(baseDir, 'Planilha Pessoas BACKUP 21_03.xlsx');
const outputPath = path.join(baseDir, 'Afetados_com_Datas_Restauradas.xlsx');

function normalizar(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

async function cruzar() {
  console.log("🚀 Iniciando cruzamento de planilhas...");

  if (!fs.existsSync(afetadosPath) || !fs.existsSync(backupPath)) {
    console.error("❌ Arquivos não encontrados na pasta scratch/recuperar");
    return;
  }

  // LER BACKUP
  console.log("📖 Lendo backup...");
  const wbBackup = XLSX.readFile(backupPath);
  const sheetBackup = wbBackup.Sheets[wbBackup.SheetNames[0]];
  const dataBackup = XLSX.utils.sheet_to_json(sheetBackup);
  
  console.log(`📊 Backup carregado: ${dataBackup.length} registros.`);

  // Criar Mapa de Backup por Nome
  const mapaBackup = new Map();
  dataBackup.forEach((row, i) => {
    let nome = "";
    let dataIni = "";
    let dataFin = "";

    Object.keys(row).forEach(key => {
      const kn = normalizar(key);
      if (kn === 'nome' || kn === 'usuario' || kn === 'usurio') nome = row[key];
      if (kn === 'data inicial' || kn === 'data_inicial') dataIni = row[key];
      if (kn === 'data final' || kn === 'data_final') dataFin = row[key];
    });

    if (nome) {
      mapaBackup.set(normalizar(nome), { dataIni, dataFin, originalName: nome });
    }
  });

  console.log(`✅ Mapa de backup criado com ${mapaBackup.size} nomes únicos.`);

  // LER AFETADOS
  console.log("📖 Lendo lista de afetados...");
  const wbAfetados = XLSX.readFile(afetadosPath);
  const sheetAfetados = wbAfetados.Sheets[wbAfetados.SheetNames[0]];
  const dataAfetados = XLSX.utils.sheet_to_json(sheetAfetados);
  
  console.log(`📊 Lista de afetados carregada: ${dataAfetados.length} registros.`);

  // PROCESSAR MATCHES
  let matches = 0;
  const resultado = dataAfetados.map(row => {
    let nomeAfetado = "";
    Object.keys(row).forEach(key => {
      const kn = normalizar(key);
      if (kn === 'nome' || kn === 'usuario' || kn === 'usurio') nomeAfetado = row[key];
    });

    if (nomeAfetado) {
      const match = mapaBackup.get(normalizar(nomeAfetado));
      if (match) {
        row["DATA INICIAL"] = match.dataIni || "";
        row["DATA FINAL"] = match.dataFin || "";
        matches++;
      } else {
        row["DATA INICIAL"] = "NÃO ENCONTRADO";
        row["DATA FINAL"] = "NÃO ENCONTRADO";
      }
    }
    return row;
  });

  console.log(`🎯 Cruzamento concluído: ${matches} matches encontrados de ${dataAfetados.length} nomes.`);

  // SALVAR RESULTADO
  const newWs = XLSX.utils.json_to_sheet(resultado);
  const newWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWb, newWs, "Resultado");
  XLSX.writeFile(newWb, outputPath);

  console.log(`💾 Resultado salvo em: ${outputPath}`);
}

cruzar().catch(err => console.error("💥 Erro fatal:", err));
