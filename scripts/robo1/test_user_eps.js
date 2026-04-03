const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function testEndpoints(id) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    const endpoints = [
        `/api/users/${id}`,
        `/api/user/${id}`,
        `/api/person/${id}`,
        `/api/users/detail/${id}`,
        `/api/user/detail/${id}`
    ];

    for (const ep of endpoints) {
        console.log(`Testing: ${ep}`);
        const res = await fetch(`${ID_CONTROL_URL}${ep}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            console.log(`SUCCESS (${ep}):`, JSON.stringify(data, null, 2));
        } else {
            console.log(`FAILED (${ep}): ${res.status}`);
        }
    }
}

// Try a likely ID if we had one, but let's try 1 again with plural
testEndpoints(1);
