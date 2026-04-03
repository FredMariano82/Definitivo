require('dotenv').config({ path: '.env.local' });
const https = require('https');

const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "123456789";

async function request(options, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        if (payload && options.headers) {
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

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
        if (payload) req.write(payload);
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

    // 2. Busca pelo Nome usando o método oficial (POST /api/user/list)
    const nameToSearch = "Igor Rodrigo de Oliveira";
    const searchPayload = {
        search: { value: nameToSearch, regex: false },
        filterCol: "name",
        length: 10,
        start: 0
    };

    console.log(`🔍 Buscando por: "${nameToSearch}"...`);
    const res = await request({
        hostname: '192.168.100.20', port: 30443, path: '/api/user/list', method: 'POST',
        headers: { 
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
        },
        rejectUnauthorized: false
    }, searchPayload); 

    if (res.status === 200 && res.data) {
        let users = res.data.data || res.data.content || (Array.isArray(res.data) ? res.data : []);
        if (users.length > 0) {
            const igor = users[0];
            console.log(`\n✅ Localizado: ${igor.name} (ID: ${igor.id || igor.idUser})`);
            console.log(`   - Data Inicial: ${igor.shelfStartLife || '---'}`);
            console.log(`   - Data Final: ${igor.shelfLife || '---'}`);
            console.log(`   - Empresa: ${igor.companyName || '---'}`);
            console.log(`   - Observações: ${igor.comments || 'Vazio'}`);
        } else {
             console.log("❌ Igor não encontrado no portal ID CONTROL.");
        }
    } else {
        console.log("❌ Falha na busca. Status:", res.status);
    }
}

run().catch(console.error);
