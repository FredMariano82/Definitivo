const SUPABASE_URL = "https://fghskpxtqdfqomozfckk.supabase.co";

async function testConnection() {
    try {
        console.log("Tentando acessar " + SUPABASE_URL);
        const res = await fetch(SUPABASE_URL + "/rest/v1/", {
            method: 'GET',
            headers: { 'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaHNrcHh0cWRmcW9tb3pmY2trIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODAxNzM4NywiZXhwIjoyMDUzNTkzMzg3fQ.Zue8NlG78l2k6N-kQo7h2E83A8V7_W9yM_e-vL_r0_A" }
        });
        console.log("Status: " + res.status);
        const data = await res.json();
        console.log("Resposta: OK");
    } catch (e) {
        console.error("Erro de Conexão: " + e.message);
        if (e.cause) console.error("Causa: " + e.cause.message);
    }
}

testConnection();
