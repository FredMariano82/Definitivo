require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function testCreateUser() {
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

    const dummyUser = {
        "name": "Usuário Teste Robô",
        "rg": "999888777",
        "cpf": "",
        "idType": 0, // 0 = Visitante/Prestador padrão
        "groups": [],
        "userGroupsList": [],
        "groupsList": [],
        "dateStartLimit": `/Date(${new Date().getTime()}-0300)/`,
        "dateLimit": `/Date(${new Date().getTime() + 86400000}-0300)/`,
        "inativo": false,
        "blackList": false,
        "comments": "Criado pelo robô de sincronização",
        "customFields": {}
    };

    console.log("Tentando CRIAR o usuário: Usuário Teste Robô (RG: 999888777)");

    const postRes = await fetch("https://192.168.100.20:30443/api/user/", {
        method: 'POST', // POST para criar novo registro
        headers: {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${token}`,
            "content-type": "application/json;charset=UTF-8"
        },
        body: JSON.stringify(dummyUser)
    });

    const postStatus = postRes.status;
    const postResponse = await postRes.text();

    console.log(`Status de Criação: ${postStatus}`);
    console.log(`Resposta: ${postResponse}`);

    if (postStatus === 200) {
        console.log("SUCESSO: Usuário criado!");
    }
}

testCreateUser();
