
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "123456789";

async function testLogin() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log(`📡 Testando login para: ${ID_CONTROL_USER}...`);
    try {
        const response = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });

        console.log(`📊 Status Code: ${response.status}`);
        const text = await response.text();
        console.log(`📄 Resposta:`, text);

        if (response.ok) {
            console.log("✅ LOGIN SUCESSO!");
        } else {
            console.log("❌ LOGIN FALHOU!");
        }
    } catch (e) {
        console.error("💥 ERRO FATAL:", e.message);
    }
}

testLogin();
