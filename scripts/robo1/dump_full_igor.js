const https = require('https');

const ID_CONTROL_URL = "192.168.100.20";
const ID_CONTROL_PORT = 30443;
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "123456789";

async function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

async function dumpUser() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // 1. Login
    console.log("Logging in...");
    const login = await request({
        hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: '/api/login/', method: 'POST',
        headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
    }, { username: ID_CONTROL_USER, password: ID_CONTROL_PASS });

    const token = (login.data?.accessToken || login.data?.token || "").replace(/[\r\n]/g, '').trim();
    if (!token) {
        console.log("Login failed:", login);
        return;
    }

    // 2. Search for Igor
    console.log("Searching for Igor...");
    const searchUrl = `/api/user/list?idType=0&deleted=false&start=0&length=10&search%5Bvalue%5D=Igor&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;
    const searchRes = await request({
        hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: searchUrl, method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        rejectUnauthorized: false
    });

    const list = searchRes.data?.data || searchRes.data?.content || searchRes.data || [];
    const igor = list[0];

    if (igor && igor.id) {
        console.log(`Fetching full details for Igor (ID: ${igor.id})...`);
        const userRes = await request({
            hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: `/api/user/${igor.id}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            rejectUnauthorized: false
        });

        const fs = require('fs');
        const dumpPath = 'c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Definitivo\\igor_dump_full.json';
        fs.writeFileSync(dumpPath, JSON.stringify(userRes.data, null, 2));
        console.log(`\n--- FULL USER DUMPED TO: ${dumpPath} ---`);
    } else {
        console.log("Igor not found in search results.");
    }
}

dumpUser().catch(console.error);
