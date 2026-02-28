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

    // The most basic GET request to fetch users by name
    const nameToSearch = "Igor Rodrigo de Oliveira";
    const url = `/api/users?name=${encodeURIComponent(nameToSearch)}`;

    const res = await request({
        hostname: '192.168.100.20', port: 30443, path: url, method: 'GET',
        headers: { 'Authorization': `Bearer ${cleanToken}` },
        rejectUnauthorized: false
    }, null); 

    if (res.status === 200 && res.data) {
        let users = Array.isArray(res.data) ? res.data : (res.data.content || (res.data.id ? [res.data] : []));
        if (users.length > 0) {
            const igor = users[0];
            console.log(`\nLocalizado: ${igor.name}`);
            console.log(`- Data Inicial (shelfStartLife): ${igor.shelfStartLife || 'Não preenchida'}`);
            console.log(`- Data Final (shelfLife): ${igor.shelfLife || 'Não preenchida'}`);
            
            // Get detailed observations
            const uRes = await request({
                hostname: '192.168.100.20', port: 30443, path: `/api/user/${igor.id}`, method: 'GET',
                headers: { 'Authorization': `Bearer ${cleanToken}` }, rejectUnauthorized: false
            });
            if (uRes.status === 200 && uRes.data) {
                console.log(`- Observações (comments): ${uRes.data.comments || 'Vazio'}`);
            } else {
                console.log(`- Não foi possivel carregar as observacoes. Status: ${uRes.status}`);
            }
        } else {
             console.log("Igor não encontrado. A API retornou lista vazia.");
        }
    } else {
        console.log("Falha na busca:", res.status);
    }
}

run().catch(console.error);
