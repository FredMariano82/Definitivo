const { extrairPrestadoresDeTexto } = require('./utils/text-parser');

const testCases = [
    "JOAO DA SILVA / 12.345.678-9 / EMPRESA ABC",
    "MARIA OLIVEIRA / 111.222.333-44 / GOOGLE",
    "PEDRO SANTOS / RG 99.888.777-X / MICROSOFT",
    "ANTONIO FERREIRA / 1234567 / ",
    "JOSE SOUZA / CPF 000.111.222-33 / AMAZON",
    "CARLOS ALBERTO - 55.444.333-2 - FACEBOOK"
];

testCases.forEach((text, index) => {
    console.log(`Test Case ${index + 1}: "${text}"`);
    const result = extrairPrestadoresDeTexto(text);
    console.log(JSON.stringify(result, null, 2));
    console.log('-------------------');
});
