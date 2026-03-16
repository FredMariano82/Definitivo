const https = require('https');
const fs = require('fs');
const path = require('path');

const ID_CONTROL_URL = "192.168.100.20";
const ID_CONTROL_PORT = 30443;
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "123456789";

const OUTPUT_DIR = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "Relacao_ID_CONTROL_Completa.csv");

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

function escapeCSV(val) {
    if (val === null || val === undefined) return "";
    let s = String(val);
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
        s = "\"" + s.replace(/"/g, "\"\"") + "\"";
    }
    return s;
}

async function exportAllUsers() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    console.log("🚀 Iniciando Extração Total do ID CONTROL...");

    // 1. Login
    const login = await request({
        hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: '/api/login/', method: 'POST',
        headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
    }, { username: ID_CONTROL_USER, password: ID_CONTROL_PASS });

    const token = (login.data?.accessToken || login.data?.token || "").replace(/[\r\n]/g, '').trim();
    if (!token) {
        console.error("❌ Falha no login.");
        return;
    }
    console.log("✅ Login realizado com sucesso.");

    // 2. Preparar arquivo
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    const header = "Nome,RG/Documento,CPF,Matricula,Status\n";
    fs.writeFileSync(OUTPUT_FILE, header, 'utf8');

    // 3. Loop de Paginação
    let start = 0;
    const length = 500;
    let totalProcessado = 0;
    let keepGoing = true;

    while (keepGoing) {
        console.log(`📡 Buscando registros ${start} a ${start + length}...`);
        
        const url = `/api/user/list?idType=0&deleted=false&start=${start}&length=${length}&search%5Bvalue%5D=&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;
        const res = await request({
            hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: url, method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            rejectUnauthorized: false
        });

        if (res.status !== 200) {
            console.error(`❌ Erro na API: ${res.status}`);
            break;
        }

        const items = res.data?.data || res.data?.content || [];
        if (items.length === 0) {
            keepGoing = false;
            break;
        }

        let csvChunk = "";
        for (const user of items) {
            const linha = [
                escapeCSV(user.name),
                escapeCSV(user.rg || user.document),
                escapeCSV(user.cpf),
                escapeCSV(user.registration),
                user.inativo ? "Inativo" : "Ativo"
            ].join(",") + "\n";
            csvChunk += linha;
        }

        fs.appendFileSync(OUTPUT_FILE, csvChunk, 'utf8');
        totalProcessado += items.length;
        console.log(`   🔸 +${items.length} usuários processados (Total: ${totalProcessado})`);

        if (items.length < length) {
            keepGoing = false;
        } else {
            start += length;
        }
    }

    console.log(`\n✨ EXTRAÇÃO CONCLUÍDA! ✨`);
    console.log(`📊 Total de registros: ${totalProcessado}`);
    console.log(`📂 Arquivo salvo em: ${OUTPUT_FILE}`);
}

exportAllUsers().catch(e => console.error("❌ Erro fatal:", e));
