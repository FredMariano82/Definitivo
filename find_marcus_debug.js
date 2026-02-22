// const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("Logging in...");
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken } = await loginRes.json();
    console.log("Token obtained.");

    console.log("Fetching ALL users...");
    const listRes = await fetch(`${ID_CONTROL_URL}/api/user/list`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({}) // EMPTY BODY
    });

    const data = await listRes.json();
    const list = Array.isArray(data) ? data : (data.content || []);
    console.log(`Total users in list: ${list.length}`);

    const marcus = list.find(u => {
        const uRg = String(u.rg || "").replace(/[^0-9]/g, "");
        return uRg === "123456";
    });

    if (marcus) {
        console.log("FOUND MARCUS:");
        console.log(JSON.stringify(marcus, null, 2));
    } else {
        console.log("Marcus NOT FOUND in the list.");
        console.log("First 3 users for inspection:");
        console.log(JSON.stringify(list.slice(0, 3), null, 2));
    }
}

run();
