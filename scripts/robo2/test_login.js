
require('dotenv').config({ path: '.env.local' });
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function test() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 Testando LOGIN + 1 USUARIO...");
    try {
        const response = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        const data = await response.json();
        const token = data.accessToken || data.token;
        console.log("Token:", !!token);

        console.log("📡 Tentando pegar 1 usuario...");
        const resList = await fetch(`${ID_CONTROL_URL}/api/users?page=0&size=1`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Status Lista:", resList.status);
        const list = await resList.json();
        console.log("Dados recebidos:", Array.isArray(list) ? list.length : "Objeto");
    } catch (e) {
        console.error("ERRO:", e);
    }
}
test();
