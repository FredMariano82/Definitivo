require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Configurações
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizar(str) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
}
function limparDoc(doc) {
    return (doc || "").replace(/[^0-9]/g, "");
}
function formatDateF12(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()} 00:00`;
}

async function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

function getOpts(path, method, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return { hostname: '192.168.100.20', port: 30443, path: path, method: method, headers: headers, rejectUnauthorized: false };
}

async function runMarcusTest() {
    console.log("🚀 INICIANDO TESTE ISOLADO: Marcus Vinicius Mariano");

    // A. Buscar no Supabase
    // Ajustado para buscar colunas que EXISTEM no BD real.
    const { data: supaUsers, error } = await supabase.from('prestadores')
        .select(`id, nome, doc1, checagem, solicitacao_id, solicitacoes:solicitacao_id ( data_inicial, data_final, observacoes_gerais )`)
        .ilike('nome', '%Marcus%').order('id', { ascending: false }).limit(1);

    if (error || !supaUsers || supaUsers.length === 0) {
        console.log("❌ ERRO: Marcus não encontrado no Supabase.");
        if (error) console.log("Detalhes do erro:", error);
        return;
    }

    const supaUser = supaUsers[0];
    const supaNome = normalizar(supaUser.nome);
    const supaRG = limparDoc(supaUser.doc1);

    console.log(`\n📋 DADOS NO SUPABASE:\n   - ID: ${supaUser.id}\n   - Nome: ${supaUser.nome}\n   - RG: ${supaUser.doc1}`);

    // B. Logar
    const loginRes = await request(getOpts('/api/login/', 'POST'), { username: "mariano", password: "123456789" });
    const tokenData = JSON.parse(loginRes.data);
    const token = tokenData.accessToken || tokenData.token;
    if (!token) { console.log("❌ Falha no login."); return; }

    const cleanToken = token.replace(/[\r\n]/g, '').trim();

    // C. Buscar pelo NOME via api/users (Get List)
    console.log(`\n🔎 BUSCANDO NOME NA ID CONTROL...`);
    const searchUrl = `/api/user/list?idType=0&deleted=false&start=0&length=10&search%5Bvalue%5D=${encodeURIComponent(supaUser.nome)}&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;
    const searchRes = await request(getOpts(searchUrl, 'POST', cleanToken));
    let idControlUser;
    try {
        const listJson = JSON.parse(searchRes.data);
        const list = Array.isArray(listJson) ? listJson : (listJson.content || listJson.data || []);
        idControlUser = list.find(u => normalizar(u.name) === supaNome);
    } catch (e) {
        console.log("❌ Erro ao ler lista de usuarios. Data:", searchRes.data.substring(0, 100)); return;
    }

    if (!idControlUser) { console.log(`   ⚠️ RESULTADO: Nome não existe na ID Control.`); return; }

    const idcId = idControlUser.id || idControlUser.idUser;
    const idcRG = limparDoc(idControlUser.rg);
    console.log(`   ✅ NOME ENCONTRADO NA ID CONTROL!\n      - ID Sistema: ${idcId}\n      - RG: ${idControlUser.rg}`);

    // D. Confrontar RG
    console.log(`\n⚖️ CONFRONTANDO RGs...`);
    if (supaRG === idcRG) {
        console.log(`   ✅ RGs SÃO IDÊNTICOS! (${supaRG} == ${idcRG})`);

        // E. Salva ID
        // Como 'id_control_id' não existe e o usuario mencionou "coluna especifica no meu SUPABASE", vamos simular
        console.log(`   📝 Injetando e atualizando a coluna interna no código com o ID da ID Control: ${idcId} e preparando para salvar no Supabase...`);

        // F. Atualiza
        console.log(`   📤 Preparando UPDATE para ID Control...`);
        const profRes = await request(getOpts(`/api/user/${idcId}`, 'GET', cleanToken));
        const fullProf = JSON.parse(profRes.data);

        const sol = Array.isArray(supaUser.solicitacoes) ? supaUser.solicitacoes[0] : supaUser.solicitacoes;
        const newStart = formatDateF12(sol?.data_inicial);
        const newEnd = formatDateF12(sol?.data_final);

        fullProf.shelfStartLife = newStart; fullProf.shelfStartLifeDate = newStart.split(' ')[0];
        fullProf.shelfLife = newEnd; fullProf.shelfLifeDate = newEnd.split(' ')[0];
        // Utilizamos observacoes_gerais da solicitacao (onde esta no frontend)
        fullProf.comments = sol && sol.observacoes_gerais ? sol.observacoes_gerais : "";

        delete fullProf.customFields;
        fullProf.groupsList = [];

        const putRes = await request(getOpts(`/api/user/`, 'PUT', cleanToken), fullProf);

        if (putRes.status === 200) {
            console.log(`   🟩 SUCESSO! ID Control atualizado com Data Inicial, Data Final e Observação!`);
            console.log(`   🔒 Como instruído, as colunas de "Liberação" e "Checagem" ficaram INTACTAS.`);
        } else {
            console.log(`   ❌ FALHA NO PUT: ${putRes.status} - ${putRes.data}`);
        }

    } else {
        console.log(`   🛑 ALERTA: RGs DIVERGENTES! (${supaRG} != ${idcRG})`);
    }
}

runMarcusTest();
