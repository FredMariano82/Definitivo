require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function testCarla() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    console.log("Fazendo login como Carla.Janaina...");
    const loginReq = await new Promise((resolve) => {
        const req = https.request({
            hostname: '192.168.100.20', port: 30443, path: '/api/login/', method: 'POST',
            headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
        }, res => {
            let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
        });
        req.write(JSON.stringify({ username: "Carla.Janaina", password: "hebraica" }));
        req.end();
    });

    if (!loginReq.accessToken && !loginReq.token) {
        console.log("Falha no login da Carla. Resposta do servidor:", loginReq);
        return;
    }

    const token = loginReq.accessToken || loginReq.token;
    console.log("Login OK. Buscando perfil do Acilônio...");

    const idAcilonio = 10023947;
    const perfilRes = await fetch(`https://192.168.100.20:30443/api/user/${idAcilonio}`, {
        headers: { "authorization": `Bearer ${token}` }
    });
    const perfil = await perfilRes.json();

    if (!perfil || !perfil.groups) {
        console.log("Erro ao buscar a ficha. Resultado:", perfil);
        return;
    }

    console.log(`Grupos antigos lidos com Carla: ${JSON.stringify(perfil.groups)}`);

    // Injetando Segurança(1104) e Hagana(2039)
    perfil.groups = [1104, 2039];
    perfil.userGroupsList = [
        { idGroup: 1104, idUser: idAcilonio, isVisitor: 0 },
        { idGroup: 2039, idUser: idAcilonio, isVisitor: 0 }
    ];
    perfil.groupsList = []; // Array empty as required

    console.log("Tentando Salvar via PUT com as credenciais da Carla...");

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
        console.log("✔ SUCESSO! A ficha mudou, a culpa era do usuário mariano!");
    } else {
        console.log(`Erro persistente. A ID Control também rejeitou a Carla. Detalhes: ${putResponse}`);
    }
}

testCarla();
