
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function solve() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    try {
        const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.token;

        // Tentar várias rotas possíveis para listar
        const routes = [
            "/api/users?page=0&size=100&sort=id,desc",
            "/api/user/",
            "/api/users/"
        ];

        for (const route of routes) {
            console.log(`📡 Testando rota: ${route}`);
            const res = await fetch(`${ID_CONTROL_URL}${route}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const text = await res.text();

            if (res.ok) {
                try {
                    const data = JSON.parse(text);
                    const list = data.data || data.content || (Array.isArray(data) ? data : []);
                    const matches = list.filter(u => String(u.name || "").toUpperCase().includes("MARCUS"));
                    if (matches.length > 0) {
                        console.log(`✅ Sucesso na rota ${route}!`);
                        matches.forEach(m => console.log(` - ID: ${m.id || m.idUser} | Nome: ${m.name} | RG: ${m.rg}`));
                    }
                } catch (e) {
                    // console.log("   Nao eh JSON");
                }
            } else {
                console.log(`   Falhou ${res.status}`);
            }
        }

    } catch (e) { console.error("Erro:", e.message); }
}

solve();
