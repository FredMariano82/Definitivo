const fetch = require('node-fetch');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function inspect() {
    console.log("🚀 INICIANDO VARREDURA TOTAL DE USUÁRIOS...");
    const login = await fetch('https://192.168.100.20:30443/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'mariano', password: '123456789' })
    }).then(r => r.json());
    
    const token = login.accessToken;
    
    // Tentar listar usuários de forma paginada para achar o Marcus
    const res = await fetch('https://192.168.100.20:30443/api/user/', {
        headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => r.json());
    
    const users = Array.isArray(res) ? res : (res.users || []);
    
    const matches = users.filter(u => u.name && u.name.includes("Marcus Vinicius Mariano"));
    
    console.log(`\nFiltro 'Marcus Vinicius Mariano' - Encontrados ${matches.length} registros no topo da lista:`);
    matches.forEach((u, i) => {
        console.log(`ID: ${u.id} | RG: ${u.rg} | Foto: ${u.foto ? 'SIM' : 'NÃO'} | Ativo: ${!u.inativo}`);
    });
}

inspect();
