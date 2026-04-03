const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

async function verificarExistencia() {
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

    console.log("Buscando 'Ligia Rosa'...");
    const searchUrl = `${ID_CONTROL_URL}/api/user/list?idType=0&deleted=false&draw=1&columns%5B2%5D%5Bdata%5D=name&columns%5B2%5D%5Bsearchable%5D=true&search%5Bvalue%5D=Ligia%20Rosa&length=10&filterCol=name`;

    const searchRes = await fetch(searchUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: null
    });

    const data = await searchRes.json();
    console.log("Resultado da Busca:", JSON.stringify(data, null, 2));
}
verificarExistencia();
