const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function listGroups() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // 1. Login
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    // 2. Fetch Groups
    const res = await fetch(`${ID_CONTROL_URL}/api/group/`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });

    if (res.ok) {
        const result = await res.json();
        const groups = result.data || result || [];
        console.log(`Found ${groups.length} groups:`);
        groups.forEach(g => {
            console.log(`- ID: ${g.id}, Name: ${g.name}`);
        });
    } else {
        console.log(`Failed: ${res.status}`);
    }
}

listGroups();
