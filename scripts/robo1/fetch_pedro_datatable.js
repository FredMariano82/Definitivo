require('dotenv').config({ path: '.env.local' });
const https = require('https');

const ID_CONTROL_URL = "https://192.168.100.20:30443";
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

    const cleanToken = (login.data?.accessToken || login.data?.token).replace(/[\r\n]/g, '').trim();

    // The Supabase user was "Pedro ..."
    console.log("📡 Searching specifically for Pedro via /api/user/list...");
    const url = `/api/user/list?idType=0&deleted=false&start=0&length=10&search%5Bvalue%5D=Pedro&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;

    const res = await request({
        hostname: '192.168.100.20', port: 30443, path: url, method: 'POST',
        headers: { 'Authorization': `Bearer ${cleanToken}`, 'Content-Type': 'application/json' },
        rejectUnauthorized: false
    }, {}); // empty body

    if (res.status === 200 && res.data && res.data.content) {
        const users = res.data.content;
        console.log(`Found ${users.length} users matching 'Pedro'`);
        if (users.length > 0) {
            const userId = users[0].id;
            console.log(`Fetching full details for ID ${userId}...`);
            const uRes = await request({
                hostname: '192.168.100.20', port: 30443, path: `/api/user/${userId}`, method: 'GET',
                headers: { 'Authorization': `Bearer ${cleanToken}` }, rejectUnauthorized: false
            });
            console.log(JSON.stringify(uRes.data, null, 2));
        }
    } else {
        console.log("Status:", res.status);
        console.log("Raw:", res.raw || res.data);
    }
}

run().catch(console.error);
