const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

async function capturarErro500() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const ID_CONTROL_URL = "https://192.168.100.20:30443";

    // 1. Login
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "mariano", password: "123456789" })
    });
    const t = await loginRes.json();
    const token = (t.accessToken || t.token).trim();

    // 2. Payload V5 - Com idArea e idDevice (Boilerplate obrigatorio?)
    const payload = {
        name: "PEDRO DEBUG V5",
        rg: "778895",
        document: "RG: 778895",

        // Datas formato F12
        shelfStartLife: "28/02/2026 00:00",
        shelfLife: "31/12/2026 23:59",
        shelfStartLifeDate: "28/02/2026",
        shelfLifeDate: "31/12/2026",
        Ativacao: "28/02/2026 00:00",
        Validade: "31/12/2026 23:59",

        idType: 0,
        idArea: 1,      // Area padrao
        idDevice: 10023166, // Device padrao do seu F12
        inativo: false,
        canUseFacial: true,
        contingency: true,

        // Tentando com grupos conforme seu F12 original
        groups: [2039, 1104],
        userGroupsList: [
            { idGroup: 2039, idUser: 0, isVisitor: 0 },
            { idGroup: 1104, idUser: 0, isVisitor: 0 }
        ]
    };

    console.log("Tentando disparar POST para criar usuario e capturar erro...");
    const postRes = await fetch(`${ID_CONTROL_URL}/api/user/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    console.log("Status Code:", postRes.status);
    const html = await postRes.text();

    const filePath = path.join(__dirname, 'erro_500_dump.html');
    fs.writeFileSync(filePath, html);

    console.log(`\nHTML de erro salvo em: ${filePath}`);
    console.log("Primeiros 500 caracteres do erro:");
    console.log("---------------------------------");
    console.log(html.substring(0, 500));
    console.log("---------------------------------");
}

capturarErro500();
