const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function probeList() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // 1. Login
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();

    const filters = [
        {},
        { search: "123456" },
        { rg: "123456" },
        { registration: "123456" },
        { active: true },
        { active: false },
        { deleted: true },
        { deleted: false }
    ];

    for (const f of filters) {
        console.log(`\nTesting filter: ${JSON.stringify(f)}`);
        const res = await fetch(`${ID_CONTROL_URL}/api/user/list`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(f)
        });
        if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.content || []);
            console.log(`Result count: ${list.length}`);
            if (list.length > 0) {
                console.log("Sample ID:", list[0].id, "Name:", list[0].name);
            }
        } else {
            console.log(`Failed: ${res.status}`);
        }
    }
}

probeList();
