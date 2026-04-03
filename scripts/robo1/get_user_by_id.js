const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function getUserById(id) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    const res = await fetch(`${ID_CONTROL_URL}/api/user/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });

    if (res.ok) {
        const user = await res.json();
        console.log(`User ${id} details:`, JSON.stringify(user, null, 2));
    } else {
        console.log(`Failed to get user ${id}: ${res.status}`);
    }
}

getUserById(1);
getUserById(104); // Some higher ID
