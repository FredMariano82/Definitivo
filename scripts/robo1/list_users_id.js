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

    const queryParams = new URLSearchParams({
        idType: "0",
        deleted: "false",
        start: "0",
        length: "5",
        "search[value]": "",
        "search[regex]": "false",
        inactive: "0",
        blacklist: "0"
    });

    const url = `${ID_CONTROL_URL}/api/user/list?${queryParams.toString()}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json;charset=utf-8"
        },
        body: null
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
