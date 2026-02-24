const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function listUsers() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    const res = await fetch(`${ID_CONTROL_URL}/api/user/list`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ length: 10, start: 0 })
    });

    if (res.ok) {
        const result = await res.json();
        const list = Array.isArray(result) ? result : (result.content || []);
        console.log(`Found ${list.length} users.`);
        if (list.length > 0) {
            console.log("First user details:", JSON.stringify(list[0], null, 2));
        }
    } else {
        console.log(`Failed: ${res.status}`);
    }
}

listUsers();
