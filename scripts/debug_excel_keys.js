const xlsx = require('xlsx');
const path = require('path');

const sourceDir = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar';
const sourceFile = path.join(sourceDir, 'TODOS.xlsx');
const targetFile = path.join(sourceDir, 'afetados_FINAL_REVISADO.xlsx');

const wbTodos = xlsx.readFile(sourceFile);
const dataTodos = xlsx.utils.sheet_to_json(wbTodos.Sheets[wbTodos.SheetNames[0]]);
console.log('TODOS Keys:', Object.keys(dataTodos[0] || {}));

const wbAfetados = xlsx.readFile(targetFile);
const dataAfetados = xlsx.utils.sheet_to_json(wbAfetados.Sheets[wbAfetados.SheetNames[0]]);
console.log('Afetados Keys:', Object.keys(dataAfetados[0] || {}));

console.log('Sample TODOS NOME:', dataTodos[0]['NOME'] || dataTodos[0]['Nome'] || 'NOT FOUND');
console.log('Sample Afetados NOME:', dataAfetados[0]['NOME'] || dataAfetados[0]['Nome'] || 'NOT FOUND');
