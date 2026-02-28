require('dotenv').config({ path: '.env.local' });
const https = require('https');

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

    // 1. Puxar o perfil atual do Acilônio
    const idAcilonio = 10023947; // O ID que vimos no seu F12
    const perfilRes = await fetch(`https://192.168.100.20:30443/api/user/${idAcilonio}`, {
        headers: { "authorization": `Bearer ${token}` }
    });
    const perfil = await perfilRes.json();

    console.log(`Buscado perfil de: ${perfil.name}`);
    console.log(`Grupos antigos: ${JSON.stringify(perfil.groups)}`);

    // 2. Definir as novas varíaveis de Seguranca(1104) e Hagana(2039)
    const newGroups = [1104, 2039];

    // Precisamos de enviar tbem essas arrays secundárias com a "isVisitor" setada
    const newUserGroupsList = [
        { idGroup: 1104, idUser: idAcilonio, isVisitor: 0 },
        { idGroup: 2039, idUser: idAcilonio, isVisitor: 0 }
    ];

    // O request de PUT apaga e reescreve a ficha usando essa estrutura. 
    // Só substituo os arrays de groups e re-envio. As listas cheias ID Control recalcula sozinha

    perfil.groups = newGroups;
    perfil.userGroupsList = newUserGroupsList;
    perfil.customFields = perfil.customFields || {};


    // Ele exige grupos vazios e nao null para salvar certas listas
    perfil.groupsList = [];

    console.log("Aplicando novos grupos: SEGURANÇA (1104) e HAGANA (2039)...");

    const putRes = await fetch("https://192.168.100.20:30443/api/user/", {
        method: 'PUT',
        headers: {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${token}`,
            "content-type": "application/json;charset=UTF-8"
        },
        body: JSON.stringify(perfil)
    });

    const putStatus = putRes.status;
    const putResponse = await putRes.text();

    console.log(`Status de Atualização: ${putStatus}`);

    if (putStatus === 200) {
        console.log("✔ SUCCESSO absoluto! Ficha alterada via API!");
    } else {
        console.log(`Erro. Detalhes: ${putResponse}`);
    }
}

updateGroups();
