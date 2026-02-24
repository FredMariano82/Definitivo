const https = require('https');
require('dotenv').config({ path: '.env.local' });

const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

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
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const login = await request({
        hostname: '192.168.100.20', port: 30443, path: '/api/login/', method: 'POST',
        headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
    }, { username: ID_CONTROL_USER, password: ID_CONTROL_PASS });

    const token = login.data?.accessToken || login.data?.token;
    const cleanToken = token.replace(/[\r\n]/g, '').trim();

    console.log("📡 Searching specifically for 123456 via /api/user/list...");
    const url = `/api/user/list?idType=0&deleted=false&start=0&length=10&search%5Bvalue%5D=123456&search%5Bregex%5D=false&filterCol=rg&inactive=0&blacklist=0`;

    const res = await request({
        hostname: '192.168.100.20', port: 30443, path: url, method: 'POST',
        headers: { 'Authorization': `Bearer ${cleanToken}`, 'Content-Type': 'application/json' },
        rejectUnauthorized: false
    }, null); // browser sends null body or empty body for this POST usually

    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(res.data, null, 2));
}

run().catch(console.error);
