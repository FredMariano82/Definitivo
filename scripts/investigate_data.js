const xlsx = require('xlsx');
const path = require('path');

const sourceDir = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar';
const sourceFile = path.join(sourceDir, 'TODOS.xlsx');
const targetFile = path.join(sourceDir, 'afetados_FINAL_REVISADO.xlsx');

const wbTodos = xlsx.readFile(sourceFile);
const dataTodos = xlsx.utils.sheet_to_json(wbTodos.Sheets[wbTodos.SheetNames[0]]);
console.log('--- TODOS (First 5) ---');
console.log(JSON.stringify(dataTodos.slice(0, 5).map(r => ({ NOME: r.NOME || r.Nome, EMPRESA: r.EMPRESA || r.Empresa })), null, 2));

const wbAfetados = xlsx.readFile(targetFile);
const dataAfetados = xlsx.utils.sheet_to_json(wbAfetados.Sheets[wbAfetados.SheetNames[0]]);
console.log('\n--- AFETADOS (First 5) ---');
console.log(JSON.stringify(dataAfetados.slice(0, 5).map(r => ({ NOME: r.NOME || r.Nome, EMPRESA: r.EMPRESA || r.Empresa })), null, 2));
