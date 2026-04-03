const xlsx = require('xlsx');
const workbook = xlsx.readFile('C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar\\afetados_FINAL_REVISADO_ATUALIZADO.xlsx');
const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
const count = data.filter(r => r.EMPRESA || r.DEPARTAMENTO).length;
console.log('COUNT:' + count + ' TOTAL:' + data.length);
