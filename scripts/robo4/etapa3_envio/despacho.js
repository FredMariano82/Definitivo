const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// 1. UTILITÁRIOS DA ETAPA 2 (Gera o Payload blindado)
// ============================================================================
function normalizar(str) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
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

function construirPayloadUniversal(prestador) {
    // PASSO 1: APENAS DADOS DA PÁGINA "GERAL" (Observação vem de checagem_valida_ate)
    // Usando exatamente o que o F12 mostrou mas sem IDs
    const payload = {
        name: prestador.nome,
        rg: (prestador.doc1 || "").replace(/[^0-9]/g, ""),
        document: `RG: ${(prestador.doc1 || "").replace(/[^0-9]/g, "")}`,
        cpf: (prestador.doc2 || "").replace(/[^0-9]/g, ""),
        comments: `checagem válida até ${formatDateOnly(prestador.checagem_valida_ate)}`,

        // Boilerplate essencial do Passo 1
        idType: 0,
        idArea: 0,
        registration: "",
        inativo: false,
        canUseFacial: true,
        admin: false,
        deleted: false,

        // Arrays vazios que o C# exige para não dar NullReference
        groups: [],
        groupsList: [],
        userGroupsList: [],
        cards: [],
        credits: [],
        templates: [],
        templatesList: [],
        templatesPanic: [],
        templatesPanicList: [],
        rulesList: [],
        customFields: {}
    };

    return payload;
}

// ============================================================================
// 3. EXECUÇÃO DA ETAPA 3 (O Envio para a API via FETCH IGUAL MODO 1)
// ============================================================================
async function despacharParaIDControl() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const ID_CONTROL_URL = "https://192.168.100.20:30443";

    console.log("==================================================");
    console.log("🤖 ROBO 4: PASSO 3 - SINCRONIZAÇÃO DE DATAS");
    console.log("==================================================");

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Buscar o próximo alvo pendente (Universal)
    console.log("Buscando próximo prestador aprovado sem vínculo...");
    const { data: pendentes, error: dbError } = await supabase
        .from('prestadores')
        .select('*, solicitacoes:solicitacao_id(*)')
        .eq('checagem', 'aprovado') // Apenas aprovados
        .is('id_control_id', null)  // Que ainda não têm ID Control
        .limit(1);

    if (dbError) throw new Error("Erro no banco: " + dbError.message);

    if (!pendentes || pendentes.length === 0) {
        return console.log("✨ NADA PARA SINCRONIZAR: Todos os aprovados já têm ID Control.");
    }

    const prestador = pendentes[0];
    const sol = prestador.solicitacoes || {};

    console.log(`\n🎯 ALVO ENCONTRADO: [${prestador.nome}]`);
    console.log(`🔗 Link Supabase: ${prestador.id}`);

    // Datas da Solicitação
    const dIni = sol.data_inicial;
    const dFim = sol.data_final;

    if (!dIni || !dFim) {
        return console.log("⚠️ Datas não encontradas para este prestador. Ignorando...");
    }

    // Formatação
    const formatarDataSimples = (iso) => {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    const dataIni = formatarDataSimples(dIni);
    const dataFim = formatarDataSimples(dFim);

    console.log(`📅 VIGÊNCIA: ${dataIni} até ${dataFim}`);

    // 2. Autenticação
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "mariano", password: "123456789" })
    });
    const { accessToken } = await loginRes.json();

    // 4. Mapeamento de Grupos (Dinâmico e Inteligente)
    console.log("Buscando lista de grupos oficial do ID Control...");
    const groupsRes = await fetch(`${ID_CONTROL_URL}/api/group/`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const groupsJson = await groupsRes.json();
    // A API pode retornar o array direto ou dentro de uma propriedade 'data'
    const allGroups = Array.isArray(groupsJson) ? groupsJson : (groupsJson.data || []);

    console.log(`📊 Carregados ${allGroups.length} grupos do servidor.`);

    const normalize = (n) => (n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

    const findGroupId = (name) => {
        if (!name) return null;
        const normTarget = normalize(name);
        // Tenta achar o grupo cujo nome normalizado bata com o alvo
        const match = allGroups.find(g => normalize(g.name) === normTarget);
        return match ? match.id : null;
    };

    const nomeEmpresa = prestador.empresa;
    const nomeDepto = sol.departamento || prestador.departamento || "Segurança";

    const idEmpresa = findGroupId(nomeEmpresa);
    const idDepto = findGroupId(nomeDepto);

    const idsGrupos = [];
    if (idDepto) idsGrupos.push(idDepto);
    else if (nomeDepto) console.log(`⚠️ Alerta: Departamento '${nomeDepto}' não encontrado no ID Control.`);

    if (idEmpresa) idsGrupos.push(idEmpresa);
    else if (nomeEmpresa) console.log(`⚠️ Alerta: Empresa '${nomeEmpresa}' não encontrada no ID Control.`);

    console.log(`🏢 GRUPOS LOCALIZADOS: Empresa(${nomeEmpresa}=${idEmpresa || 'N/A'}) | Depto(${nomeDepto}=${idDepto || 'N/A'})`);

    // 5. Verificar se o usuário já existe para decidir entre POST (Novo) ou PUT (Edição)
    console.log("Verificando existência no ID Control com query expandida...");

    // O F12 manda isso no POST BODY e não na URL, mas a API antiga parsa como query!
    const searchUrl = `${ID_CONTROL_URL}/api/user/list?idType=0&deleted=false&draw=9&columns%5B0%5D%5Bdata%5D=&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=idDevice&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=name&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=registration&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=rg&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=cpf&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=phone&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=cargo&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=inativo&columns%5B8%5D%5Bname%5D=&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=blackList&columns%5B9%5D%5Bname%5D=&columns%5B9%5D%5Bsearchable%5D=true&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D=&columns%5B10%5D%5Bname%5D=&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=false&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D=&columns%5B11%5D%5Bname%5D=&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=false&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=2&order%5B0%5D%5Bdir%5D=asc&start=0&length=10&search%5Bvalue%5D=${encodeURIComponent(prestador.nome)}&search%5Bregex%5D=false&inactive=0&blacklist=0&filterCol=name`;

    const searchRes = await fetch(searchUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: null
    });
    const { data: list } = await searchRes.json();
    const serverUser = list[0];

    // 6. Construir Payload de Carga Total (Universal)
    const payloadCentral = {
        ...construirPayloadUniversal(prestador),
        expireOnDateLimit: true,
        // Vigência
        shelfStartLife: `${dataIni} 00:00`,
        shelfStartLifeDate: dataIni,
        shelfLife: `${dataFim} 00:00`,
        shelfLifeDate: dataFim,
        // Grupos
        groups: idsGrupos,
        userGroupsList: idsGrupos.map(gid => ({ idGroup: gid, idUser: serverUser?.id || 0, isVisitor: 0 })),
        // Limpar campos de ID legado
        dateStartLimit: null,
        dateLimit: null
    };

    if (serverUser) {
        // MODO VERIFICAÇÃO DE HOMÔNIMO (Escadinha)
        console.log(`\n🔍 Validando documentos para o ID Control Técnico: ${serverUser.id}`);

        const rgDB = (prestador.doc1 || "").replace(/[^0-9]/g, "");
        const cpfDB = (prestador.doc2 || "").replace(/[^0-9]/g, "");
        const rgID = (serverUser.rg || "").replace(/[^0-9]/g, "");
        const cpfID = (serverUser.cpf || "").replace(/[^0-9]/g, "");

        let aprovadoParaPUT = false;

        // PASSO A: O RG Bate? (Ou está vazio no F12)
        if (!rgID || rgID === rgDB) {
            console.log("✔️ Match Sucesso (Regra RG): O RG do ID Control está vazio ou é igual ao do Supabase.");
            aprovadoParaPUT = true;
        }
        // PASSO B: O CPF Bate? (Ou está vazio no F12)
        else if (cpfDB && (!cpfID || cpfID === cpfDB)) {
            console.log("✔️ Match Sucesso (Regra CPF): O RG divergiu, mas o CPF do ID Control está vazio ou é igual ao CPF validado no Supabase.");
            aprovadoParaPUT = true;
        }

        // PASSO C: Conflito Real
        if (!aprovadoParaPUT) {
            console.log(`❌ HOMÔNIMO DETECTADO: Os documentos não batem. RG(${rgDB} != ${rgID}) e CPF(${cpfDB} != ${cpfID}).`);
            console.log(`⏸️ Pausando sincronização e recuando status para 'revisar' no banco.`);

            await supabase.from('prestadores').update({
                checagem: 'revisar',
                observacoes: `[CONFLITO RG: ${rgID}]`
            }).eq('id', prestador.id);
            console.log("✅ Solicitacão enviada para a fila de Revisão (Aprovador).");
            return; // Interrompe o processo para não sobescrever o cadastro alheio
        }

        // Se chegou aqui, MODO EDIÇÃO (PUT)
        console.log(`🔄 Liberado para Atualização. Aplicando Carga Total...`);
        const res = await fetch(`${ID_CONTROL_URL}/api/user/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
            body: JSON.stringify({
                ...payloadCentral,
                id: serverUser.id,
                idDevice: Number(prestador.id_control_id) || serverUser.idDevice
            })
        });

        if (res.ok) {
            console.log("🟩 SUCESSO: Cadastro atualizado totalmente (Datas + Grupos)!");
            if (!prestador.id_control_id) {
                const idGerado = serverUser.idDevice || serverUser.id;
                console.log(`🔗 Sincronizando ID Mestre ${idGerado} no Supabase...`);
                await supabase.from('prestadores').update({ id_control_id: String(idGerado) }).eq('id', prestador.id);
            }
        } else {
            const erro = await res.text();
            console.log("❌ Falha na Atualização:", erro);
            require('fs').writeFileSync('erro_sinc.txt', erro);
        }
    } else {
        // MODO CRIAÇÃO (POST)
        console.log("🆕 Novo cadastro. Criando com Carga Total...");
        const res = await fetch(`${ID_CONTROL_URL}/api/user/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
            body: JSON.stringify(payloadCentral)
        });

        if (res.ok) {
            const novo = await res.json();
            const idGerado = novo.idDevice || novo.id;
            console.log(`🟩 SUCESSO: Criado com ID ${idGerado}!`);
            console.log(`🔗 Sincronizando ID Mestre ${idGerado} no Supabase...`);
            await supabase.from('prestadores').update({ id_control_id: String(idGerado) }).eq('id', prestador.id);
        } else {
            console.log("❌ Falha na Criação:", await res.text());
        }
    }

    console.log("\n✅ PROCESSO FINALIZADO!");
}

despacharParaIDControl().catch(e => {
    console.error("\n❌ ERRO CRÍTICO NO ROBÔ: ", e.message);
});
