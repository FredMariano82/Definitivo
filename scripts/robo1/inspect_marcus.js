const fetch = require('node-fetch');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function inspect() {
    console.log("🔍 Inspecionando Duplicidades de Marcus...");
    const login = await fetch('https://192.168.100.20:30443/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'mariano', password: '123456789' })
    }).then(r => r.json());
    
    const token = login.accessToken;
    
    // Busca por RG
    const res = await fetch('https://192.168.100.20:30443/api/user/FindUserByRG?rg=56996', {
        headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => r.json());
    
    const users = Array.isArray(res) ? res : [res];
    
    console.log(`\nEncontrados ${users.length} registros:`);
    users.forEach((u, i) => {
        console.log(`[${i+1}] ID: ${u.id} | Nome: ${u.name} | RG: ${u.rg} | Foto: ${u.foto ? 'SIM' : 'NÃO'} | Matrícula: ${u.registration}`);
    });
}

inspect();
