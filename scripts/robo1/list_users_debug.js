const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function listUsers() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // 1. Login
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    // 2. List
    const response = await fetch(`${ID_CONTROL_URL}/api/users/`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });
    if (response.ok) {
        const data = await response.json();
        console.log("Total users:", Array.isArray(data) ? data.length : "Not an array");
        if (Array.isArray(data) && data.length > 0) {
            console.log("First user:", JSON.stringify(data[0], null, 2));
        }
    } else {
        console.log("Failed to list users:", response.status);
    }
}

listUsers();
