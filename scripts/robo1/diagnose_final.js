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
                    resolve({ status: res.status, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.status, raw: data });
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
    console.log("📡 Step 1: Login...");
    const login = await request({
        hostname: '192.168.100.20',
        port: 30443,
        path: '/api/login/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        rejectUnauthorized: false
    }, { username: ID_CONTROL_USER, password: ID_CONTROL_PASS });

    const token = login.data?.accessToken || login.data?.token;
    if (!token) throw new Error("No token found");
    const cleanToken = token.replace(/[\r\n]/g, '').trim();

    console.log("📡 Step 2: Testing size=1000...");
    const test1 = await request({
        hostname: '192.168.100.20',
        port: 30443,
        path: '/api/users?page=0&size=1000',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${cleanToken}` },
        rejectUnauthorized: false
    });
    const list1 = Array.isArray(test1.data) ? test1.data : (test1.data?.content || []);
    console.log(`   Fetched ${list1.length} users in page 0 (size 1000)`);

    console.log("📡 Step 3: Scanning Marcus in all pages...");
    let found = false;
    for (let i = 0; i < 100; i++) {
        const page = await request({
            hostname: '192.168.100.20',
            port: 30443,
            path: `/api/users?page=${i}&size=200`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cleanToken}` },
            rejectUnauthorized: false
        });
        const list = Array.isArray(page.data) ? page.data : (page.data?.content || []);
        if (list.length === 0) { console.log("   No more users found at page " + i); break; }

        const m = list.find(u => String(u.rg).includes("123456"));
        if (m) {
            console.log(`\n✅ MARCUS FOUND!`);
            console.log(`   Name: ${m.name}`);
            console.log(`   ID: ${m.id}`);
            console.log(`   RG: ${m.rg}`);
            console.log(`   Page: ${i}`);
            found = true;
            break;
        }
        if (i % 5 === 0) process.stdout.write(i + "...");
    }
    if (!found) {
        console.log("\n📡 Step 4: Scanning for DELETED Marcus...");
        const delRes = await request({
            hostname: '192.168.100.20',
            port: 30443,
            path: `/api/users?page=0&size=500&deleted=true`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cleanToken}` },
            rejectUnauthorized: false
        });
        const listDel = Array.isArray(delRes.data) ? delRes.data : (delRes.data?.content || []);
        const m = listDel.find(u => String(u.rg).includes("123456"));
        if (m) {
            console.log(`✅ FOUND IN DELETED! ID: ${m.id}`);
            found = true;
        }
    }

    if (!found) {
        console.log("\n📡 Step 5: Scanning for INACTIVE Marcus...");
        const inres = await request({
            hostname: '192.168.100.20',
            port: 30443,
            path: `/api/users?page=0&size=500&inactive=true`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cleanToken}` },
            rejectUnauthorized: false
        });
        const listIn = Array.isArray(inres.data) ? inres.data : (inres.data?.content || []);
        const m = listIn.find(u => String(u.rg).includes("123456"));
        if (m) {
            console.log(`✅ FOUND IN INACTIVE! ID: ${m.id}`);
            found = true;
        }
    }

    if (!found) console.log("\n❌ Marcus NOT found even in deleted or inactive.");
}

run().catch(console.error);
