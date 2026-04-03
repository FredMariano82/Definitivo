const net = require('net');

async function scanPort(ip, port, timeout = 200) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, ip);
    });
}

async function runScan() {
    const baseIP = '192.168.100.';
    console.log(`🔎 Iniciando Scanner na rede ${baseIP}0/24...`);
    console.log(`Portas mapeadas: 80 (HTTP), 443 (HTTPS), 30443 (Portal)\n`);

    const activeHosts = [];
    
    // Scaneando os IPs mais prováveis (1 a 100) primeiro para ser rápido
    for (let i = 1; i <= 254; i++) {
        const ip = baseIP + i;
        process.stdout.write(`\rEscaneando: ${ip}... `);
        
        const is80 = await scanPort(ip, 80);
        const is443 = await scanPort(ip, 443);
        const is30443 = await scanPort(ip, 30443);
        
        if (is80 || is443 || is30443) {
            const host = { ip, ports: [] };
            if (is80) host.ports.push(80);
            if (is443) host.ports.push(443);
            if (is30443) host.ports.push(30443);
            activeHosts.push(host);
            console.log(`\n✅ ENCONTRADO: ${ip} [Portas: ${host.ports.join(', ')}]`);
        }
    }

    console.log("\n\n==================================================");
    console.log("🏁 RELATÓRIO DO SCANNER:");
    if (activeHosts.length === 0) {
        console.log("❌ Nenhum host ativo encontrado na faixa 192.168.100.x.");
    } else {
        activeHosts.forEach(h => {
            const label = h.ip === '192.168.100.20' ? ' (Portal Conhecido)' : '';
            console.log(`- ${h.ip}${label} [Portas: ${h.ports.join(', ')}]`);
        });
    }
    console.log("==================================================");
}

runScan();
