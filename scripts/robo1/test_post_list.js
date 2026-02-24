const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function testList() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // 1. Login
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    // 2. POST /api/user/list
    const response = await fetch(`${ID_CONTROL_URL}/api/user/list`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    });

    if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.content || []);
        console.log("Success! Users found:", list.length);
        if (list.length > 0) {
            const target = list.find(u => u.rg === "123456" || u.registration === "123456");
            if (target) {
                console.log("FOUND Target User:", JSON.stringify(target, null, 2));
            } else {
                console.log("Target user 123456 not in list. Examples from list:");
                console.log(list.slice(0, 3).map(u => ({ id: u.id, name: u.name, rg: u.rg, reg: u.registration })));
            }
        }
    } else {
        console.log("Failed POST /api/user/list:", response.status);
    }
}

testList();
