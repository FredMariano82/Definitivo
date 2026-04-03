const https = require('https');
const http = require('http');

const IPs = ['192.168.100.20', '192.168.100.56', '192.168.100.113', '192.168.100.177', '192.168.100.235'];
const LOGINS = [
    { u: 'admin', p: 'admin' },
    { u: 'mariano', p: '123456789' }
];

async function request(ip, port, path, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: ip,
            port: port,
            path: path,
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const protocol = port === 443 ? https : http;

        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}

async function startDiag() {
    console.log("🚀 INICIANDO AUTO-DIAGNÓSTICO ROBÔ 10 (v2)...");
    console.log("--------------------------------------------------");

    for (const ip of IPs) {
        for (const port of [80, 443]) {
            console.log(`📡 Testando IP: ${ip} | Porta: ${port}...`);
            for (const cred of LOGINS) {
                try {
                    process.stdout.write(`   🔑 Tentando Login: [${cred.u}]... `);
                    const res = await request(ip, port, '/login.fcgi', { login: cred.u, password: cred.p });
                    
                    if (res && res.session) {
                        console.log("✅ SUCESSO!");
                        console.log(`\n🎉 ENCONTRADO!`);
                        console.log(`📍 IP: ${ip}`);
                        console.log(`📍 PORTA: ${port}`);
                        console.log(`👤 LOGIN: ${cred.u}`);
                        
                        // Testar leitura de usuário 1
                        const load = await request(ip, port, `/load_users.fcgi?session=${res.session}`, { limit: 1 });
                        if (load && load.users) {
                            console.log("✅ LEITURA VALIDADA: Hardware operando perfeitamente.");
                            console.log("Dados do primeiro usuário:", JSON.stringify(load.users[0], null, 2));
                        }
                        return;
                    } else {
                        console.log("❌ Falhou.");
                    }
                } catch (e) {
                    console.log(`⚠️ Erro: ${e.message}`);
                }
            }
        }
    }
    console.log("\n❌ Não foi possível encontrar o iDClass nos IPs ou logins testados.");
}

startDiag();
