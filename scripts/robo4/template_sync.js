const https = require('https');

// ============================================================================
// TEMPLATE ROBO 4 - ENVIO PARA ID CONTROL
// ============================================================================
// Este script isola EXCLUSIVAMENTE o payload e a lógica de envio para o ID Control
// que mapeamos com sucesso ontem. Ele não faz NENHUMA busca no banco de dados,
// para garantir que não haverá confusão com a origem dos dados.
// Use este arquivo como base para o seu "robo4".
// ============================================================================

// 1. Funções Auxiliares (Exatamente as mesmas de ontem)
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

// 2. Auxiliar de Requisição HTTP
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

// ============================================================================
// FUNÇÃO PRINCIPAL DE SINCRONIZAÇÃO (Requer apenas os dados do usuário)
// ============================================================================
async function enviarParaIdControl(prestadorParaEnviar) {
    console.log(`🚀 INICIANDO ENVIO PARA ID CONTROL: ${prestadorParaEnviar.nome}`);

    // 1. Login no ID Control (Substitua as credenciais se necessário)
    const loginRes = await request(getOpts('/api/login/', 'POST'), { username: "mariano", password: "123456789" });
    const tokenData = JSON.parse(loginRes.data);
    const token = tokenData.accessToken || tokenData.token;
    if (!token) throw new Error("Falha ao obter token do ID Control.");
    const cleanToken = token.replace(/[\r\n]/g, '').trim();

    // 2. O EXATO PAYLOAD MAPEADO COM SUCESSO ONTEM (Não perca este mapeamento!)
    // Este é o JSON "cru" que a API do ID Control aceita sem dar erro 500.
    const rawUserPayloadInfo = `{"Ativacao":"22/02/2026 00:00","Validade":"30/06/2026 23:59","admin":false,"admissao":"/Date(1728529200000-0300)/","admissionDate":"10/10/2024","allowParkingSpotCompany":null,"availableCompanies":null,"availableGroupsVisitorsList":null,"availableResponsibles":null,"bairro":"","barras":"","blackList":false,"bornDate":"","canUseFacial":true,"cards":[],"cargo":"Op. Monitoramento","cep":"","cidade":"","comments":"Haganá: 56996","contingency":true,"cpf":"","dataLastLog":"/Date(1771880203000-0300)/","dateLimit":"/Date(1782874799000-0300)/","dateStartLimit":"/Date(1771729200000-0300)/","deleted":false,"document":"RG: 56996","dtAdmissao":"10/10/2024","dtNascimento":"","email":"","emailAcesso":"","endereco":"","estadoCivil":"","expireOnDateLimit":false,"foto":null,"fotoDoc":null,"groups":[2039,1104],"groupsList":[{"contingency":false,"controlVisitors":false,"disableADE":false,"id":2039,"id2":0,"idType":2,"maxTimeInside":0,"maxVisitors":0,"nPeople":0,"nUsers":0,"nVisitors":0,"name":"Haganá","qtyTotalSpots":0,"users":null,"usersList":null},{"contingency":false,"controlVisitors":false,"disableADE":false,"id":1104,"id2":null,"idType":0,"maxTimeInside":null,"maxVisitors":0,"nPeople":0,"nUsers":0,"nVisitors":0,"name":"Segurança","qtyTotalSpots":0,"users":null,"usersList":null}],"id":10023953,"idArea":1,"idDevice":10023166,"idResponsavel":null,"idType":0,"inativo":false,"mae":"","nacionalidade":"","name":"Marcus Vinicius Mariano","nascimento":null,"naturalidade":"","objectGuid":null,"pai":"","password":"","phone":"","photoDeleted":false,"photoIdFaceState":0,"photoTimestamp":1772048531,"pis":0,"pisAnterior":0,"ramal":"","registration":"20184397","responsavelNome":null,"rg":"56996","selectedGroupsVisitorsList":null,"selectedIdGroupsVisitorsList":null,"selectedIdResponsible":null,"selectedIdVisitedCompany":null,"selectedNameResponsible":null,"selectedResponsible":null,"selectedVisitedCompany":null,"senha":0,"sexo":"Masculino","shelfLife":"29/06/2026 00:00","shelfStartLife":"22/02/2026 00:00","telefone":"","templates":[],"templatesImages":[],"templatesList":[],"templatesPanic":[],"templatesPanicImages":[],"templatesPanicList":[],"timeOfRegistration":"/Date(1772091717000-0300)/","userGroupsList":[{"id":169900,"idGroup":2039,"idUser":10023953,"isVisitor":0},{"id":169901,"idGroup":1104,"idUser":10023953,"isVisitor":0}],"veiculo_cor":null,"veiculo_marca":null,"veiculo_modelo":null,"veiculo_placa":null,"visitorCompany":null,"credits":[],"rulesList":[],"password_confirmation":"","shelfLifeDate":"29/06/2026","shelfStartLifeDate":"22/02/2026","customFields":{}}`;

    // Converte de volta para objeto para injetar os dados dinâmicos
    const fullProf = JSON.parse(rawUserPayloadInfo);

    // 3. Prepara as datas usando o prestador recebido
    const dataBrasil = prestadorParaEnviar.data_final ? prestadorParaEnviar.data_final.split('-').reverse().join('/') : '';
    const startTimeTime = formatDateF12(prestadorParaEnviar.data_inicial, false);
    const startDate = formatDateOnly(prestadorParaEnviar.data_inicial);
    const endTimeTime = formatDateF12(prestadorParaEnviar.data_final, true);
    const endDate = formatDateOnly(prestadorParaEnviar.data_final);

    // 4. Injeta os dados da solicitação atual no payload mapeado
    fullProf.name = prestadorParaEnviar.nome;
    fullProf.document = `RG: ${prestadorParaEnviar.doc1}`;
    fullProf.rg = prestadorParaEnviar.doc1;
    fullProf.Ativacao = startTimeTime;
    fullProf.Validade = endTimeTime;
    fullProf.shelfStartLife = startTimeTime;
    fullProf.shelfStartLifeDate = startDate;
    fullProf.shelfLife = endTimeTime;
    fullProf.shelfLifeDate = endDate;
    fullProf.comments = `Checagem válida até ${dataBrasil}`;

    // Observação: Se o prestador tiver Id de Grupo de Empresa/Departamento, injetar em fullProf.groups

    // 5. Busca o ID correto que o usuário já tem no ID Control (Evita sobrescrever IDs errados)
    const supaNomeNormalizado = normalizar(prestadorParaEnviar.nome);
    const searchUrl = `/api/user/list?idType=0&deleted=false&start=0&length=10&search%5Bvalue%5D=${encodeURIComponent(prestadorParaEnviar.nome)}&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;
    const searchRes = await request(getOpts(searchUrl, 'POST', cleanToken));

    try {
        const listJson = JSON.parse(searchRes.data);
        const list = Array.isArray(listJson) ? listJson : (listJson.content || listJson.data || []);
        const idControlUser = list.find(u => normalizar(u.name) === supaNomeNormalizado);

        if (idControlUser) {
            fullProf.id = idControlUser.id || idControlUser.idUser;
            console.log(`   🔎 Usuário encontrado no ID Control com ID: ${fullProf.id}`);
        } else {
            // Se não encontrou, talvez seja caso de POST, mas o mapping que fizemos
            // foi especificamente para PUT (atualização). Remova o ID fixo se for POST.
            delete fullProf.id;
            console.log(`   ⚠️ Usuário não encontrado no ID Control pelo nome. Um novo será criado (POST sugerido).`);
        }
    } catch (e) {
        console.error("   ❌ Erro ao buscar usuário no ID Control:", e.message);
    }

    console.log(`📤 Enviando o RAW JSON...`);
    const endpointUrl = fullProf.id ? `/api/user/` : `/api/user/novo_endpoint`; // Ajuste caso POST seja diferente
    const putRes = await request(getOpts(endpointUrl, fullProf.id ? 'PUT' : 'POST', cleanToken), fullProf);

    if (putRes.status === 200) {
        console.log(`   🟩 SUCESSO ABSOLUTO (Status 200).`);
        return true;
    } else {
        console.log(`   ❌ FALHA NO ENVIO: ${putRes.status} - ${putRes.data}`);
        return false;
    }
}

// ============================================================================
// EXEMPLO DE USO DO SEU NOVO ROBO (Alimente ele como preferir)
// ============================================================================
/*
const meuPrestadorTeste = {
    nome: "Nome Teste",
    doc1: "123456789",
    data_inicial: "2026-03-01",
    data_final: "2026-03-15"
};
enviarParaIdControl(meuPrestadorTeste);
*/

module.exports = { enviarParaIdControl };
