require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

async function directRead() {
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

    // Ler o Acilônio
    const perfilRes = await fetch('https://192.168.100.20:30443/api/user/10023947', {
        headers: { 'authorization': 'Bearer ' + token }
    });
    const perfilStr = await perfilRes.text();
    const perfil = JSON.parse(perfilStr);

    console.log("=== DADOS REAIS DO ACILONIO APOS O SEU F5 ===");
    console.log("IDs na array 'groups':", perfil.groups);
    console.log("Lista completa de Grupos ('groupsList'):", JSON.stringify(perfil.groupsList.map(g => ({ id: g.id, name: g.name }))));
    console.log("Lista de vínculos ('userGroupsList'):", JSON.stringify(perfil.userGroupsList.map(g => ({ idGroup: g.idGroup }))));
}

directRead();
