const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function testSingular() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // 1. Login
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    // 2. Search via singular /user
    const urls = [
        `${ID_CONTROL_URL}/api/user?rg=123456`,
        `${ID_CONTROL_URL}/api/user?search=123456`,
        `${ID_CONTROL_URL}/api/user` // Just list
    ];

    for (const url of urls) {
        console.log(`\nTesting URL: ${url}`);
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            console.log(`Result (${url}):`, JSON.stringify(data).substring(0, 200));
        } else {
            console.log(`Failed (${url}):`, res.status);
        }
    }
}

testSingular();
