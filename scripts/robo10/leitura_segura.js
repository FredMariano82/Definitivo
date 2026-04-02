const https = require('https');

// ============================================================================
// CONFIGURAÇÕES (Preencha aqui os dados do seu equipamento)
// ============================================================================
const EQUIPAMENTO_IP = '192.168.100.x'; // <--- INSIRA O IP DO APARELHO AQUI
const LOGIN = 'admin';
const SENHA = 'admin';
// ============================================================================

/**
 * Função utilitária para fazer requisições HTTPS POST nativas
 */
function request(path, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: EQUIPAMENTO_IP,
            port: 443,
            path: path,
            method: 'POST',
            rejectUnauthorized: false, // Ignorar certificado conforme manual
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
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

async function robo10Leitura() {
    console.log("==================================================");
    console.log("🤖 ROBÔ 10: ESCANEAMENTO SEGURO (NATIVO)");
    console.log("==================================================");

    if (EQUIPAMENTO_IP === '192.168.100.x') {
        console.error("❌ ERRO: Você precisa definir o IP do equipamento no script.");
        console.log("DICA: Abra o arquivo 'scripts/robo10/leitura_segura.js' e mude o IP.");
        return;
    }

    try {
        // 1. LOGIN
        console.log(`📡 Conectando em https://${EQUIPAMENTO_IP}...`);
        const loginRes = await request('/login.fcgi', { login: LOGIN, password: SENHA });

        if (!loginRes.session) {
            console.error("❌ FALHA NO LOGIN. Verifique Usuário/Senha.");
            console.log("Resposta do aparelho:", loginRes);
            return;
        }

        const session = loginRes.session;
        console.log("🟩 Sessão Iniciada:", session);

        // 2. LEITURA DE USUÁRIOS
        console.log("\n🔍 Analisando estrutura do banco de dados do aparelho...");
        const loadRes = await request(`/load_users.fcgi?session=${session}`, { limit: 1, offset: 0 });

        if (loadRes.users && loadRes.users.length > 0) {
            const user = loadRes.users[0];
            console.log("--------------------------------------------------");
            console.log("✅ DADOS LIDOS COM SUCESSO:");
            console.log(JSON.stringify(user, null, 2));
            console.log("--------------------------------------------------");

            console.log("\n📊 RELATÓRIO DE INTEGRIDADE:");
            console.log(`- Nome: ${user.name || '---'}`);
            console.log(`- Biometria Digital: ${user.templates && user.templates.length > 0 ? 'SIM ✅' : 'NÃO ❌'}`);
            console.log(`- Foto Facial: ${user.image ? 'SIM ✅' : 'NÃO ❌'}`);
            
            // Tentar encontrar campos de datas
            const temDatas = user.shelfLife || user.shelfStartLife || user.begin_time || user.end_time;
            console.log(`- Datas de Vigência detectadas? ${temDatas ? 'SIM ✅' : 'NÃO (Campos ocultos ou vazios) 🟡'}`);
            
        } else {
            console.log("🟡 O aparelho está vazio ou não retornou usuários.");
        }

        // 3. LOGOUT
        await request(`/logout.fcgi?session=${session}`, {});
        console.log("\n🚪 Conexão encerrada com segurança.");

    } catch (error) {
        console.error("\n💥 ERRO DE CONEXÃO:");
        console.error(error.message);
        console.log("\nDICA: Verifique se o computador está na mesma rede que o relógio de ponto.");
    }
}

robo10Leitura();
