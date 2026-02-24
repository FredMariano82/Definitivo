
const fetch = require('node-fetch'); // Using node-fetch for stability in this script
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function hunt() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 Caçando RG Conflitante...");

    try {
        const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.token;

        console.log("📡 Baixando 6000 usuários para varredura...");
        const res = await fetch(`${ID_CONTROL_URL}/api/users?page=0&size=6000`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const users = await res.json();
        const list = users.data || users.content || users || [];

        const targetRg = "424946968";
        console.log(`🔎 Procurando RG ${targetRg} em ${list.length} registros...`);

        const match = list.find(u => {
            const uRg = String(u.rg || "").replace(/[^0-9]/g, "");
            return uRg === targetRg;
        });

        if (match) {
            console.log("✅ ENCONTRADO!");
            console.log(JSON.stringify(match, null, 2));
        } else {
            console.log("❌ RG não encontrado nem no cache de 6000.");
            console.log("Isso significa que o usuário está DELETADO ou em uma lista oculta.");
            console.log("Tentando busca direta por ID se suspeitarmos de algum...");
        }

    } catch (e) {
        console.error("❌ Erro:", e.message);
    }
}

hunt();
