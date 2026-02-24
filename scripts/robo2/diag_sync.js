
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function diag() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 DIAGNÓSTICO RG: 424946968");

    try {
        const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.token;

        const rg = "424946968";
        // Busca 1: Direta
        console.log(`📡 Buscando RG ${rg} direto...`);
        const res1 = await fetch(`${ID_CONTROL_URL}/api/users?rg=${rg}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data1 = await res1.json();
        console.log("   Resultado Direto:", JSON.stringify(data1, null, 2));

        // Busca 2: Pelo Nome do Supabase Literal
        const nome = "Marcus Vinícius Mariano";
        console.log(`📡 Buscando Nome [${nome}] direto...`);
        const res2 = await fetch(`${ID_CONTROL_URL}/api/users?name=${encodeURIComponent(nome)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data2 = await res2.json();
        console.log("   Resultado Nome:", JSON.stringify(data2, null, 2));

    } catch (e) {
        console.error("❌ Erro:", e.message);
    }
}

diag();
