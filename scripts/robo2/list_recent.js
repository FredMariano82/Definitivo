
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function listSimple() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 Listando primeiros 50 usuários para conferência...");

    try {
        const lr = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        const ld = await lr.json();
        const token = ld.accessToken || ld.token;

        const res = await fetch(`${ID_CONTROL_URL}/api/users?page=0&size=50`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const text = await res.text();

        if (!res.ok) {
            console.log("❌ Resposta do Servidor:", text);
            return;
        }

        const data = JSON.parse(text);
        const list = data.data || data.content || data || [];

        console.log("\nLISTA DE USUÁRIOS ENCONTRADOS:");
        list.forEach(u => {
            if (String(u.name).toUpperCase().includes("MARCUS")) {
                console.log(`>> ID: ${u.id || u.idUser} | Nome: ${u.name} | RG: ${u.rg}`);
            }
        });

    } catch (e) {
        console.error("❌ Erro técnico:", e.message);
    }
}

listSimple();
