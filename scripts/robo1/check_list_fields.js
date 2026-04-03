const https = require('https');
const fs = require('fs');

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

async function checkListFields() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    console.log("Fazendo login...");
    const login = await request({
        hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: '/api/login/', method: 'POST',
        headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
    }, { username: ID_CONTROL_USER, password: ID_CONTROL_PASS });

    const token = (login.data?.accessToken || login.data?.token || "").replace(/[\r\n]/g, '').trim();
    if (!token) return console.log("Erro no login.");

    console.log("Listando primeiros 5 usuários para checar campos...");
    const url = `/api/user/list?idType=0&deleted=false&start=0&length=5&search%5Bvalue%5D=&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;
    const res = await request({
        hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: url, method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        rejectUnauthorized: false
    });

    const data = res.data?.data || res.data?.content || res.data || [];
    console.log("\nCampos disponíveis na listagem:");
    if (data.length > 0) {
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log("Nenhum usuário encontrado.");
    }
}

checkListFields().catch(console.error);
