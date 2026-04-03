
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

    console.log("📡 Fetching a list of users to compare 'id' vs 'idUser'...");
    const url = `/api/users?page=0&size=10`;

    const res = await request({
        hostname: '192.168.100.20', port: 30443, path: url, method: 'GET',
        headers: { 'Authorization': `Bearer ${cleanToken}` },
        rejectUnauthorized: false
    });

    if (res.status === 200 && res.data) {
        const users = Array.isArray(res.data) ? res.data : (res.data.content || []);
        console.log(`Analyzing ${users.length} users:`);
        users.forEach(u => {
            console.log(`- Nome: ${u.name}`);
            console.log(`  > ID (Principal): ${u.id}`);
            console.log(`  > idUser: ${u.idUser}`);
            console.log(`  > registration (Matrícula): ${u.registration}`);
            console.log('---');
        });
    } else {
        console.log("Failed to fetch users.");
    }
}

run().catch(console.error);
