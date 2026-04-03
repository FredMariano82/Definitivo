const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function testSearch(rg) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // 1. Login
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();
    console.log("Token:", accessToken ? "OK" : "FAILED");

    // 2. Search
    const docLimpo = rg.replace(/[^0-9]/g, "");
    const urls = [
        `${ID_CONTROL_URL}/api/users?rg=${docLimpo}`,
        `${ID_CONTROL_URL}/api/users?document=${docLimpo}`,
        `${ID_CONTROL_URL}/api/users?search=${docLimpo}`
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

testSearch("123456");
