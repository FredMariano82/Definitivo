require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizar(str) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
}
function limparDoc(doc) {
    return (doc || "").replace(/[^0-9]/g, "");
}
function formatDateF12(dateStr, isEnd) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const time = isEnd ? "23:59" : "00:00";
    return `${day}/${month}/${year} ${time}`;
}
function formatDateOnly(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
}
function formatEpochCsharp(dateStr, isEnd) {
    if (!dateStr) return null;
    // Expected dateStr: "YYYY-MM-DD". We append Brazil timezone so it parses exactly to local midnight
    let isoStr = dateStr + "T00:00:00-03:00";
    if (isEnd) {
        isoStr = dateStr + "T23:59:59-03:00";
    }
    const ms = new Date(isoStr).getTime();
    return `/Date(${ms}-0300)/`;
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
    const headers = { 'Content-Type': 'application/json;charset=UTF-8' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return { hostname: '192.168.100.20', port: 30443, path: path, method: method, headers: headers, rejectUnauthorized: false };
}

async function runMarcusTest() {
    console.log("🚀 INICIANDO TESTE ISOLADO COM PAYLOAD OFICIAL MESTRE: Marcus Vinicius Mariano");

    const { data: supaUsers, error } = await supabase.from('prestadores')
        .select(`id, nome, doc1, checagem, solicitacao_id, solicitacoes:solicitacao_id ( data_inicial, data_final )`)
        .ilike('nome', '%Marcus%').order('id', { ascending: false }).limit(1);

    if (error || !supaUsers || supaUsers.length === 0) return;
    const supaUser = supaUsers[0];
    const supaNome = normalizar(supaUser.nome);
    const supaRG = limparDoc(supaUser.doc1);

    const loginRes = await request(getOpts('/api/login/', 'POST'), { username: "mariano", password: "123456789" });
    const tokenData = JSON.parse(loginRes.data);
    const token = tokenData.accessToken || tokenData.token;
    if (!token) return;
    const cleanToken = token.replace(/[\r\n]/g, '').trim();

    const searchUrl = `/api/user/list?idType=0&deleted=false&start=0&length=10&search%5Bvalue%5D=${encodeURIComponent(supaUser.nome)}&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;
    const searchRes = await request(getOpts(searchUrl, 'POST', cleanToken));
    let idControlUser;
    try {
        const listJson = JSON.parse(searchRes.data);
        const list = Array.isArray(listJson) ? listJson : (listJson.content || listJson.data || []);
        idControlUser = list.find(u => normalizar(u.name) === supaNome);
    } catch (e) { return; }

    if (!idControlUser) return;
    const idcId = idControlUser.id || idControlUser.idUser;

    console.log(`\n📤 Preparando UPDATE com estrutura espelhada no frontend (O SEGREDO!)...`);

    // 1. Baixar o perfil idêntico
    const profRes = await request(getOpts(`/api/user/${idcId}`, 'GET', cleanToken));
    let fullProf;
    try {
        fullProf = JSON.parse(profRes.data);
    } catch (e) { console.log("Erro parsing profRes"); return; }

    const sol = Array.isArray(supaUser.solicitacoes) ? supaUser.solicitacoes[0] : supaUser.solicitacoes;
    const dataBrasil = sol?.data_final ? sol.data_final.split('-').reverse().join('/') : '';

    const startTimeTime = formatDateF12(sol?.data_inicial, false); // DD/MM/YYYY 00:00
    const startDate = formatDateOnly(sol?.data_inicial);           // DD/MM/YYYY
    const endTimeTime = formatDateF12(sol?.data_final, true);      // DD/MM/YYYY 23:59
    const endDate = formatDateOnly(sol?.data_final);               // DD/MM/YYYY

    // 2. Modificar ASMESMAS propriedades que o usuário enviou
    fullProf.Ativacao = startTimeTime;
    fullProf.Validade = endTimeTime;

    fullProf.shelfStartLife = startTimeTime;
    fullProf.shelfStartLifeDate = startDate;

    fullProf.shelfLife = endTimeTime;
    fullProf.shelfLifeDate = endDate;

    // A C# Backend API expects dateLimit and dateStartLimit strings to be in /Date(123456)/ format
    fullProf.dateStartLimit = formatEpochCsharp(sol?.data_inicial, false);
    fullProf.dateLimit = formatEpochCsharp(sol?.data_final, true);

    if (fullProf.timeOfRegistration && !fullProf.timeOfRegistration.includes('/Date')) {
        fullProf.timeOfRegistration = formatEpochCsharp(sol?.data_inicial, false); // safety to prevent crash on reading
    }

    fullProf.comments = `Checagem válida até ${dataBrasil}`;

    // 3. SEGREDOS DO C#: Garantir que arrays/lists chatos existam e password_confirmation exista. NÃO DELETAMOS NADA.
    fullProf.password_confirmation = "";
    if (fullProf.customFields === null || typeof fullProf.customFields !== 'object') {
        fullProf.customFields = {};
    }

    // Arrays que vem null no GET mas o frontend manda como [], 
    // previne o "Object reference not set to an instance of an object".
    if (fullProf.templatesImages === null) fullProf.templatesImages = [];
    if (fullProf.templatesPanicImages === null) fullProf.templatesPanicImages = [];
    if (fullProf.credits === null) fullProf.credits = [];

    // Outros nulls estranhos do GET que Frontend manda nulo sem aspas ou converte vazio
    if (fullProf.dtNascimento === null) fullProf.dtNascimento = "";
    if (fullProf.dtAdmissao === null) fullProf.dtAdmissao = "";

    // O Frontend sempre formata esses caras, o GET devolve null e o backend crasha
    if (fullProf.admissionDate === null) fullProf.admissionDate = fullProf.dtAdmissao || "";
    if (fullProf.bornDate === null) fullProf.bornDate = fullProf.dtNascimento || "";
    if (fullProf.foto === null) fullProf.foto = "";
    if (fullProf.fotoDoc === null) fullProf.fotoDoc = "";

    const putRes = await request(getOpts(`/api/user/`, 'PUT', cleanToken), fullProf);

    if (putRes.status === 200) {
        console.log(`   🟩 MATCH PERFEITO! A API engoliu nosso payload idêntico ao frontend e atualizou com sucesso!`);
    } else {
        console.log(`   ❌ FALHA NO PUT: ${putRes.status} - ${putRes.data}`);
        require('fs').writeFileSync('payload_dump_failed.json', JSON.stringify(fullProf, null, 2));
    }
}

runMarcusTest();
