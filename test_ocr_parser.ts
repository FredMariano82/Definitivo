import { extrairPrestadoresDeTexto } from './utils/text-parser.ts';

const testCases = [
    "JOAO DA SILVA / 12.345.678-9 / EMPRESA ABC",
    "MARIA OLIVEIRA / 111.222.333-44 / GOOGLE",
    "PEDRO SANTOS / RG 99.888.777-X / MICROSOFT",
    "ANTONIO FERREIRA / 1234567 / ",
    "JOSE SOUZA / CPF 000.111.222-33 / AMAZON",
    "CARLOS ALBERTO - 55.444.333-2 - FACEBOOK"
];

console.log("--- OCR PARSER TEST START ---");
testCases.forEach((text, index) => {
    const result = extrairPrestadoresDeTexto(text);
    if (result.sucesso && result.prestadores.length > 0) {
        const p = result.prestadores[0];
        console.log(`[PASS] Case ${index + 1}: Name="${p.nome}" Doc="${p.doc1}" Emp="${p.empresa}"`);
    } else {
        console.log(`[FAIL] Case ${index + 1}: ${result.erro}`);
    }
});
console.log("--- OCR PARSER TEST END ---");
