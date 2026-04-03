const https = require('https');
require('dotenv').config({ path: '.env.local' });

const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "123456789";

async function request(options, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const headers = options.headers || {};
        if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

        const req = https.request({ ...options, headers }, res => {
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
        if (payload) req.write(payload);
        req.end();
    });
}

async function start() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 Conectando ao Portal ID CONTROL para buscar IP do iDClass...");

    // 1. LOGIN
    const login = await request({
        hostname: '192.168.100.20', port: 30443, path: '/api/login/', method: 'POST',
        headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
    }, { username: ID_CONTROL_USER, password: ID_CONTROL_PASS });

    const token = (login.data?.accessToken || login.data?.token || "").replace(/[\r\n]/g, '').trim();
    if (!token) {
        console.error("❌ Erro ao logar no portal.");
        return;
    }

    // 2. TENTAR LISTAR EQUIPAMENTOS (Testando rota /api/terminal/)
    console.log("🔍 Consultando lista de terminais/aparelhos...");
    const res = await request({
        hostname: '192.168.100.20', port: 30443, path: '/api/terminal/', method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }, rejectUnauthorized: false
    });

    if (res.status === 200 && res.data) {
        const devices = res.data.data || res.data.content || (Array.isArray(res.data) ? res.data : []);
        console.log("\n==================================================");
        console.log(`✅ ${devices.length} APARELHOS ENCONTRADOS:`);
        devices.forEach(d => {
            console.log(`- NOME: ${d.name} | IP: ${d.ip} | ID: ${d.id}`);
        });
        console.log("==================================================");
    } else {
        console.log(`❌ Erro ao buscar lista: ${res.status}`);
        console.log("Raw:", res.raw || JSON.stringify(res.data));
    }
}

start().catch(console.error);
