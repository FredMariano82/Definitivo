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
    console.log("Verificando existência no ID Control...");
    const searchRes = await fetch(`${ID_CONTROL_URL}/api/user/list?idType=0&deleted=false&draw=1&length=10&search%5Bvalue%5D=${encodeURIComponent(prestador.nome)}&filterCol=name`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
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
        // MODO EDIÇÃO (PUT)
        console.log(`🔄 Usuário já existe (ID Técnico: ${serverUser.id}). Atualizando com Carga Total...`);
        const res = await fetch(`${ID_CONTROL_URL}/api/user/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
            body: JSON.stringify({
                ...payloadCentral,
                id: serverUser.id,
                idDevice: Number(prestador.id_control_id) || serverUser.idDevice
            })
        });

        if (res.ok) console.log("🟩 SUCESSO: Cadastro atualizado totalmente (Datas + Grupos)!");
        else {
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
