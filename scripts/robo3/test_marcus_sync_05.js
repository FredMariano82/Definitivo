require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

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
    console.log("🚀 INICIANDO TESTE COM O PAYLOAD EXATO DO USUÁRIO");

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

    // 1. O EXATO PAYLOAD INFORMADO PELO USUÁRIO (copiado do print da aba Rede)
    const rawUserPayloadInfo = `{"Ativacao":"22/02/2026 00:00","Validade":"30/06/2026 23:59","admin":false,"admissao":"/Date(1728529200000-0300)/","admissionDate":"10/10/2024","allowParkingSpotCompany":null,"availableCompanies":null,"availableGroupsVisitorsList":null,"availableResponsibles":null,"bairro":"","barras":"","blackList":false,"bornDate":"","canUseFacial":true,"cards":[],"cargo":"Op. Monitoramento","cep":"","cidade":"","comments":"Haganá: 56996","contingency":true,"cpf":"","dataLastLog":"/Date(1771880203000-0300)/","dateLimit":"/Date(1782874799000-0300)/","dateStartLimit":"/Date(1771729200000-0300)/","deleted":false,"document":"RG: 56996","dtAdmissao":"10/10/2024","dtNascimento":"","email":"","emailAcesso":"","endereco":"","estadoCivil":"","expireOnDateLimit":false,"foto":null,"fotoDoc":null,"groups":[2039,1104],"groupsList":[{"contingency":false,"controlVisitors":false,"disableADE":false,"id":2039,"id2":0,"idType":2,"maxTimeInside":0,"maxVisitors":0,"nPeople":0,"nUsers":0,"nVisitors":0,"name":"Haganá","qtyTotalSpots":0,"users":null,"usersList":null},{"contingency":false,"controlVisitors":false,"disableADE":false,"id":1104,"id2":null,"idType":0,"maxTimeInside":null,"maxVisitors":0,"nPeople":0,"nUsers":0,"nVisitors":0,"name":"Segurança","qtyTotalSpots":0,"users":null,"usersList":null}],"id":10023953,"idArea":1,"idDevice":10023166,"idResponsavel":null,"idType":0,"inativo":false,"mae":"","nacionalidade":"","name":"Marcus Vinicius Mariano","nascimento":null,"naturalidade":"","objectGuid":null,"pai":"","password":"","phone":"","photoDeleted":false,"photoIdFaceState":0,"photoTimestamp":1772048531,"pis":0,"pisAnterior":0,"ramal":"","registration":"20184397","responsavelNome":null,"rg":"56996","selectedGroupsVisitorsList":null,"selectedIdGroupsVisitorsList":null,"selectedIdResponsible":null,"selectedIdVisitedCompany":null,"selectedNameResponsible":null,"selectedResponsible":null,"selectedVisitedCompany":null,"senha":0,"sexo":"Masculino","shelfLife":"29/06/2026 00:00","shelfStartLife":"22/02/2026 00:00","telefone":"","templates":[],"templatesImages":[],"templatesList":[],"templatesPanic":[],"templatesPanicImages":[],"templatesPanicList":[],"timeOfRegistration":"/Date(1772091717000-0300)/","userGroupsList":[{"id":169900,"idGroup":2039,"idUser":10023953,"isVisitor":0},{"id":169901,"idGroup":1104,"idUser":10023953,"isVisitor":0}],"veiculo_cor":null,"veiculo_marca":null,"veiculo_modelo":null,"veiculo_placa":null,"visitorCompany":null,"credits":[],"rulesList":[],"password_confirmation":"","shelfLifeDate":"29/06/2026","shelfStartLifeDate":"22/02/2026","customFields":{}}`;

    const fullProf = JSON.parse(rawUserPayloadInfo);

    const sol = Array.isArray(supaUser.solicitacoes) ? supaUser.solicitacoes[0] : supaUser.solicitacoes;
    const dataBrasil = sol?.data_final ? sol.data_final.split('-').reverse().join('/') : '';

    const startTimeTime = formatDateF12(sol?.data_inicial, false);
    const startDate = formatDateOnly(sol?.data_inicial);
    const endTimeTime = formatDateF12(sol?.data_final, true);
    const endDate = formatDateOnly(sol?.data_final);

    // 2. Modificar APENAS as datas que interessam
    fullProf.Ativacao = startTimeTime;
    fullProf.Validade = endTimeTime;

    fullProf.shelfStartLife = startTimeTime;
    fullProf.shelfStartLifeDate = startDate;

    fullProf.shelfLife = endTimeTime;
    fullProf.shelfLifeDate = endDate;

    fullProf.comments = `Checagem válida até ${dataBrasil}`;

    // Vamos buscar o ID exato dele na ID Control pra não subscrever em cima de outro ID aleatório
    const searchUrl = `/api/user/list?idType=0&deleted=false&start=0&length=10&search%5Bvalue%5D=${encodeURIComponent(supaUser.nome)}&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;
    const searchRes = await request(getOpts(searchUrl, 'POST', cleanToken));

    try {
        const listJson = JSON.parse(searchRes.data);
        const list = Array.isArray(listJson) ? listJson : (listJson.content || listJson.data || []);
        const idControlUser = list.find(u => normalizar(u.name) === supaNome);
        if (idControlUser) {
            fullProf.id = idControlUser.id || idControlUser.idUser;
        }
    } catch (e) { }

    console.log(`📤 Enviando o RAW JSON do usuário modificado (ID: ${fullProf.id})...`);

    const putRes = await request(getOpts(`/api/user/`, 'PUT', cleanToken), fullProf);

    if (putRes.status === 200) {
        console.log(`   🟩 MATCH PERFEITO! A API engoliu nosso payload injetado com sucesso absoluto!`);
        console.log(`   O Erro 500 do C# sumiu porque copiamos o array exato do Angular!`);
    } else {
        console.log(`   ❌ FALHA NO PUT: ${putRes.status} - ${putRes.data}`);
    }
}

runMarcusTest();
