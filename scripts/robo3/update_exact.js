require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

async function updateGroups() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const loginReq = await new Promise((resolve) => {
        const req = https.request({
            hostname: '192.168.100.20', port: 30443, path: '/api/login/', method: 'POST',
            headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
        }, res => {
            let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
        });
        req.write(JSON.stringify({ username: "mariano", password: "123456789" }));
        req.end();
    });
    const token = loginReq.accessToken || loginReq.token;

    // Le o payload exato capturado da tela (Haganá 2039, Segurança 1104, id 10023947)
    const exactPayloadStr = fs.readFileSync('scripts/robo3/payload_941_array.json', 'utf8');

    console.log("Enviando o Payload EXATO capturado do F12...");

    const putRes = await fetch("https://192.168.100.20:30443/api/user/", {
        method: 'PUT',
        headers: {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${token}`,
            "content-type": "application/json;charset=UTF-8"
        },
        body: exactPayloadStr
    });

    const putStatus = putRes.status;
    const putResponse = await putRes.text();

    console.log(`Status de Atualização: ${putStatus}`);

    if (putStatus === 200) {
        console.log("✔ SUCCESSO! O servidor aceitou o Payload da UI!");
    } else {
        console.log(`Erro. Detalhes: ${putResponse}`);
    }
}

updateGroups();
