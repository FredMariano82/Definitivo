const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

async function listarGrupos() {
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

    console.log("Buscando lista de grupos...");
    const res = await fetch(`${ID_CONTROL_URL}/api/group/`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const grupos = await res.json();
    console.log("\n--- LISTA DE GRUPOS ENCONTRADOS ---");

    // Filtrar por nomes que o usuário mencionou
    const alvos = ["4 Irmãos", "Segurança"];

    grupos.forEach(g => {
        if (alvos.some(nome => g.name.includes(nome))) {
            console.log(`ID: ${g.id} | Nome: ${g.name}`);
        }
    });

    console.log("-----------------------------------");
    console.log("DICA: Se os alvos acima não aparecerem, segue os primeiros 10 grupos para análise:");
    console.log(JSON.stringify(grupos.slice(0, 10), null, 2));
}

listarGrupos().catch(console.error);
