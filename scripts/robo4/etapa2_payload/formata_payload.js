const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });
const { createClient } = require('@supabase/supabase-js');

// 1. Funções de formatação de datas (Idênticas às do Robo 3 que funcionaram)
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

// 2. A Função que cria o payload completo e bruto baseado num prestador
function construirPayloadUniversal(prestador, solicitacaoPai) {
    // Esqueleto gigante e "burro" descoberto no Marcus, garantido de funcionar na API
    const rawUserPayloadInfo = `{"Ativacao":"22/02/2026 00:00","Validade":"30/06/2026 23:59","admin":false,"admissao":"/Date(1728529200000-0300)/","admissionDate":"10/10/2024","allowParkingSpotCompany":null,"availableCompanies":null,"availableGroupsVisitorsList":null,"availableResponsibles":null,"bairro":"","barras":"","blackList":false,"bornDate":"","canUseFacial":true,"cards":[],"cargo":"Op. Monitoramento","cep":"","cidade":"","comments":"Haganá: 56996","contingency":true,"cpf":"","dataLastLog":"/Date(1771880203000-0300)/","dateLimit":"/Date(1782874799000-0300)/","dateStartLimit":"/Date(1771729200000-0300)/","deleted":false,"document":"RG: 56996","dtAdmissao":"10/10/2024","dtNascimento":"","email":"","emailAcesso":"","endereco":"","estadoCivil":"","expireOnDateLimit":false,"foto":null,"fotoDoc":null,"groups":[2039,1104],"groupsList":[{"contingency":false,"controlVisitors":false,"disableADE":false,"id":2039,"id2":0,"idType":2,"maxTimeInside":0,"maxVisitors":0,"nPeople":0,"nUsers":0,"nVisitors":0,"name":"Haganá","qtyTotalSpots":0,"users":null,"usersList":null},{"contingency":false,"controlVisitors":false,"disableADE":false,"id":1104,"id2":null,"idType":0,"maxTimeInside":null,"maxVisitors":0,"nPeople":0,"nUsers":0,"nVisitors":0,"name":"Segurança","qtyTotalSpots":0,"users":null,"usersList":null}],"id":10023953,"idArea":1,"idDevice":10023166,"idResponsavel":null,"idType":0,"inativo":false,"mae":"","nacionalidade":"","name":"Marcus Vinicius Mariano","nascimento":null,"naturalidade":"","objectGuid":null,"pai":"","password":"","phone":"","photoDeleted":false,"photoIdFaceState":0,"photoTimestamp":1772048531,"pis":0,"pisAnterior":0,"ramal":"","registration":"20184397","responsavelNome":null,"rg":"56996","selectedGroupsVisitorsList":null,"selectedIdGroupsVisitorsList":null,"selectedIdResponsible":null,"selectedIdVisitedCompany":null,"selectedNameResponsible":null,"selectedResponsible":null,"selectedVisitedCompany":null,"senha":0,"sexo":"Masculino","shelfLife":"29/06/2026 00:00","shelfStartLife":"22/02/2026 00:00","telefone":"","templates":[],"templatesImages":[],"templatesList":[],"templatesPanic":[],"templatesPanicImages":[],"templatesPanicList":[],"timeOfRegistration":"/Date(1772091717000-0300)/","userGroupsList":[{"id":169900,"idGroup":2039,"idUser":10023953,"isVisitor":0},{"id":169901,"idGroup":1104,"idUser":10023953,"isVisitor":0}],"veiculo_cor":null,"veiculo_marca":null,"veiculo_modelo":null,"veiculo_placa":null,"visitorCompany":null,"credits":[],"rulesList":[],"password_confirmation":"","shelfLifeDate":"29/06/2026","shelfStartLifeDate":"22/02/2026","customFields":{}}`;

    // Converte para objeto para substituir os valores
    const fullProf = JSON.parse(rawUserPayloadInfo);

    // Datas corretas lidas da Etapa 1
    const dataInicialCerta = solicitacaoPai?.data_inicial || prestador.data_inicial;
    const dataFinalCerta = solicitacaoPai?.data_final || prestador.data_final;

    const dataBrasil = dataFinalCerta ? dataFinalCerta.split('-').reverse().join('/') : '';
    const startTimeTime = formatDateF12(dataInicialCerta, false);
    const startDate = formatDateOnly(dataInicialCerta);
    const endTimeTime = formatDateF12(dataFinalCerta, true);
    const endDate = formatDateOnly(dataFinalCerta);

    // Injeção limpa de dados
    fullProf.name = prestador.nome;
    fullProf.document = `RG: ${prestador.doc1}`;
    fullProf.rg = prestador.doc1;
    fullProf.Ativacao = startTimeTime;
    fullProf.Validade = endTimeTime;
    fullProf.shelfStartLife = startTimeTime;
    fullProf.shelfStartLifeDate = startDate;
    fullProf.shelfLife = endTimeTime;
    fullProf.shelfLifeDate = endDate;
    fullProf.comments = `Checagem válida até ${dataBrasil}`;

    // IMPORTANTÍSSIMO: Remover o 'id' fixo e as IDs das listas dependentes, pois 
    // IDs de usuários e templates são únicos pra cada um e dão conflitos se fixos no POST
    delete fullProf.id;
    fullProf.templates = [];
    fullProf.templatesImages = [];
    fullProf.userGroupsList = fullProf.userGroupsList.map(ug => ({
        ...ug,
        idUser: null, // Deixa a API designar a relação
        id: null
    }));

    return fullProf;
}

// 3. Executar Etapa 1 e Etapa 2 em Cadeia
async function testarFormatoNaTela() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("🤖 ROBO 4 - ETAPA 2: APLICANDO PAYLOAD UNIVERSAL");
    console.log("Lendo do Supabase...");

    const { data: prestadores } = await supabase
        .from('prestadores')
        .select('*, solicitacoes:solicitacao_id(numero, solicitante, data_inicial, data_final)')
        .in('checagem', ['aprovado', 'aprovada'])
        .order('criado_em', { ascending: false })
        .limit(1);

    if (!prestadores || prestadores.length === 0) {
        console.log("Nenhuma aprovacao mais recente para testar.");
        return;
    }

    const prestadorAlvo = prestadores[0];
    const resSolicitacao = prestadorAlvo.solicitacoes || {};
    const solicitacaoPai = Array.isArray(resSolicitacao) ? resSolicitacao[0] : resSolicitacao;

    console.log(`\nTransformando: [${prestadorAlvo.nome} - RG: ${prestadorAlvo.doc1}]`);

    // Roda a mágica formatadora
    const payloadFinal = construirPayloadUniversal(prestadorAlvo, solicitacaoPai);

    console.log("\n==================================================");
    console.log("O PACOTE FINAL JSON GERADO (PRONTO PARA ENVIO):");
    console.log("==================================================");
    console.log(JSON.stringify(payloadFinal, null, 2));
    console.log("==================================================");
}

testarFormatoNaTela();
