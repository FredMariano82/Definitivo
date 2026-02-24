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

    const url = `${ID_CONTROL_URL}/api/users?page=0&size=5`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });

    if (res.ok) {
        const result = await res.json();
        const list = Array.isArray(result) ? result : (result.content || []);
        console.log("Users:", JSON.stringify(list, null, 2));
    } else {
        console.log(`Failed: ${res.status}`);
    }
}

listUsers();
