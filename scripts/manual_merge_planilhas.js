const XLSX = require('xlsx');
const path = require('path');

const downloadDir = 'C:\\Users\\fredm\\Downloads';
const admPath = path.join(downloadDir, 'CRUZAR ADM.xlsx');
const idPath = path.join(downloadDir, 'CRUZAR ID CONTROL.xlsx'); // Também pode ser .csv se ajustado
const outputPath = path.join(downloadDir, 'RESULTADO CRUZAMENTO.xlsx');

function normalizar(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function somar6Meses(dataOrigem) {
  if (!dataOrigem) return "";
  try {
    let dataObj;
    if (dataOrigem instanceof Date) {
      dataObj = dataOrigem;
    } else if (typeof dataOrigem === 'string') {
      const partes = dataOrigem.split(/[\/\-]/);
      if (partes.length === 3) {
          if (partes[0].length === 4) dataObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
          else dataObj = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
      } else dataObj = new Date(dataOrigem);
    } else return dataOrigem;

    if (isNaN(dataObj.getTime())) return dataOrigem;
    
    const novaData = new Date(dataObj);
    novaData.setMonth(novaData.getMonth() + 6);
    
    const dia = String(novaData.getDate()).padStart(2, '0');
    const mes = String(novaData.getMonth() + 1).padStart(2, '0');
    const ano = novaData.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (e) { return dataOrigem; }
}

try {
    console.log("Processando Cruzamento + Vencimentos...");
    const wbADM = XLSX.readFile(admPath, { cellDates: true });
    const wbID = XLSX.readFile(idPath, { cellDates: true });

    let dataID = [];
    for (const name of wbID.SheetNames) {
        const sheetData = XLSX.utils.sheet_to_json(wbID.Sheets[name]);
        const keys = sheetData.length > 0 ? Object.keys(sheetData[0]).map(k => normalizar(k)) : [];
        if (keys.some(k => k.includes("nome") || k.includes("usuario") || k.includes("prest"))) {
            dataID = sheetData;
            break;
        }
    }

    const mapaID = new Map();
    dataID.forEach(row => {
      let nome = "", dIni = "", dFin = "";
      Object.keys(row).forEach(key => {
        const kn = normalizar(key);
        if ((kn.includes("nome") || kn.includes("usuario") || kn.includes("prest")) && !nome) nome = row[key];
        if (kn.includes("data") && kn.includes("ini")) dIni = row[key];
        if (kn.includes("data") && kn.includes("fin")) dFin = row[key];
      });
      if (nome) mapaID.set(normalizar(nome), { dIni, dFin });
    });

    let targetSheetName = "";
    let dataADM = [];
    for (const name of wbADM.SheetNames) {
        if (normalizar(name).includes("resumo")) continue;
        const sheetData = XLSX.utils.sheet_to_json(wbADM.Sheets[name]);
        const keys = sheetData.length > 0 ? Object.keys(sheetData[0]).map(k => normalizar(k)) : [];
        if (keys.some(k => k.includes("nome") || k.includes("prest") || k.includes("checagem"))) {
            dataADM = sheetData;
            targetSheetName = name;
            break;
        }
    }

    const resultado = dataADM.map(row => {
      let nomeADM = "";
      Object.keys(row).forEach(key => {
          if (typeof row[key] === 'string') row[key] = row[key].trim();
          const kn = normalizar(key);
          if ((kn.includes("nome") || kn.includes("prest") || kn.includes("usuario")) && !nomeADM) nomeADM = row[key];
          
          // SOMA 6 MESES NA COLUNA CHECAGEM
          if (kn === "checagem") {
              row[key] = somar6Meses(row[key]);
          }
      });

      if (nomeADM) {
        const match = mapaID.get(normalizar(nomeADM));
        if (match) {
          if (match.dIni) row["DATA INICIAL"] = match.dIni;
          if (match.dFin) row["DATA FINAL"] = match.dFin;
        }
      }
      return row;
    });

    const newWs = XLSX.utils.json_to_sheet(resultado);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, "Final_Sincronizado");
    XLSX.writeFile(newWb, outputPath);
    console.log(`Sucesso Total! Arquivo salvo em: ${outputPath}`);

} catch (error) {
    console.error("Erro:", error.message);
}
