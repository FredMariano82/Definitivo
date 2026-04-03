// const fetch = require('node-fetch'); // Using global fetch (Node 18+)
require('dotenv').config({ path: '.env.local' });

const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function diagnoseSearch() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 Logging in...");
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const { accessToken: token } = await loginRes.json();

    console.log("📡 Fetching with size=10000...");
    const res = await fetch(`${ID_CONTROL_URL}/api/users?page=0&size=10000`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.content || []);

    console.log(`📊 Statistics:`);
    console.log(`- Total returned: ${list.length}`);

    // Check if Marcus is in this list
    const marcus = list.find(u => String(u.rg) === "123456");
    console.log(`- Marcus (123456) in list? ${!!marcus}`);

    if (list.length > 0) {
        console.log(`- First user: ${list[0].name}`);
        console.log(`- Last user in list: ${list[list.length - 1].name}`);
    }

    // Attempt to search specifically for deleted/inactive
    console.log("\n📡 Fetching with deleted=true...");
    const resDeleted = await fetch(`${ID_CONTROL_URL}/api/users?deleted=true`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const dataDeleted = await resDeleted.json();
    const listDeleted = Array.isArray(dataDeleted) ? dataDeleted : (dataDeleted.content || []);
    console.log(`- Total deleted: ${listDeleted.length}`);
}

diagnoseSearch();
