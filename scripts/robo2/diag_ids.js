
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function diag() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 DIAGNÓSTICO DE RECUPERAÇÃO DE IDs");

    try {
        const lr = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        const ld = await lr.json();
        const token = ld.accessToken || ld.token;

        // Tentar busca direta por nome que costuma retornar JSON
        const nome = "Marcus Vinícius Mariano";
        console.log(`📡 Buscando [${nome}]...`);
        const res = await fetch(`${ID_CONTROL_URL}/api/users?name=${encodeURIComponent(nome)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const text = await res.text();
        console.log("--- RESPOSTA BRUTA ---");
        console.log(text);
        console.log("----------------------");

        if (res.ok) {
            const data = JSON.parse(text);
            const list = data.data || data.content || (Array.isArray(data) ? data : []);
            list.forEach(u => {
                console.log(`>> ID: ${u.id || u.idUser} | Nome: ${u.name} | RG: ${u.rg}`);
            });
        }

    } catch (e) { console.error("Erro:", e.message); }
}

diag();
