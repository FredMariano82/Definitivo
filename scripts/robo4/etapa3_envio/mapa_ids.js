const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

async function detalharIds() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const ID_CONTROL_URL = "https://192.168.100.20:30443";

    console.log("Autenticando...");
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "mariano", password: "123456789" })
    });
    const tokenData = await loginRes.json();
    const token = tokenData.accessToken || tokenData.token;

    console.log("Buscando 'Jonas Silva'...");
    const searchUrl = `${ID_CONTROL_URL}/api/user/list?idType=0&deleted=false&draw=1&length=10&search%5Bvalue%5D=Jonas%20Silva&filterCol=name`;

    const searchRes = await fetch(searchUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: null
    });

    const body = await searchRes.json();
    const user = body.data[0];

    console.log("\n--- MAPA TÉCNICO DE IDS ---");
    console.log("Nome:", user.name);
    console.log("Internal ID (id):", user.id);
    console.log("User/Device ID (idDevice):", user.idDevice);
    console.log("Registration (registration):", user.registration);
    console.log("PIS/ID Ponto:", user.pis);
    console.log("----------------------------");
    console.log("\nJSON COMPLETO PARA ANALISE:");
    console.log(JSON.stringify(user, null, 2));
}
detalharIds();
