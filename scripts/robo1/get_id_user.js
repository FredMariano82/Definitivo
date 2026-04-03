const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function checkIdUser() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    const res = await fetch(`${ID_CONTROL_URL}/api/users?page=0&size=1`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (res.ok) {
        const result = await res.json();
        const user = result.content ? result.content[0] : (Array.isArray(result) ? result[0] : null);
        if (user) {
            console.log("User Data:", JSON.stringify(user, null, 2));
        } else {
            console.log("No user found.");
        }
    } else {
        console.log(`Failed: ${res.status}`);
    }
}

checkIdUser();
