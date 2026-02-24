
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function check() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 Verificando estrutura de dados...");

    try {
        const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.token;

        const res = await fetch(`${ID_CONTROL_URL}/api/users?page=0&size=5`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const users = await res.json();
        const list = users.data || users.content || users || [];

        if (list.length > 0) {
            console.log("✅ Dados recebidos. Primeiro objeto:");
            console.log(JSON.stringify(list[0], null, 2));
            require('fs').writeFileSync('api_sample.json', JSON.stringify(list[0], null, 2));
        } else {
            console.log("❌ Nenco usuário retornado.");
        }

    } catch (e) {
        console.error("❌ Erro:", e.message);
    }
}

check();
