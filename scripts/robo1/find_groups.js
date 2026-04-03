const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function findGroups() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    const res = await fetch(`${ID_CONTROL_URL}/api/group/`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (res.ok) {
        const result = await res.json();
        const groups = result.data || result || [];
        const targets = ["Haganá", "Segurança"];

        console.log("Searching for:", targets);
        groups.forEach(g => {
            if (targets.some(t => g.name.toLowerCase().includes(t.toLowerCase()))) {
                console.log(`- FOUND: ID: ${g.id}, Name: ${g.name}`);
            }
        });
    } else {
        console.log(`Failed: ${res.status}`);
    }
}

findGroups();
