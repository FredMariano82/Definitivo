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

    // 1. Localizar o registro que acabamos de criar (Jonas)
    console.log("Buscando Jonas Silva para preenchimento de datas...");
    const { data: prestadores, error: dbError } = await supabase
        .from('prestadores')
        .select('*, solicitacoes:solicitacao_id(*)')
        .eq('nome', 'Jonas Silva')
        .limit(1);

    if (dbError) throw new Error("Erro no banco: " + dbError.message);
    const prestador = prestadores[0];

    if (!prestador || !prestador.id_control_id) {
        return console.log("⚠️ Jonas Silva ainda não tem vínculo! Rode o Passo 1 primeiro.");
    }

    // Datas da Solicitação (conforme o print do usuário e o mapeamento F12)
    const sol = prestador.solicitacoes || {};
    const dIni = sol.data_inicial; // YYYY-MM-DD
    const dFim = sol.data_final;   // YYYY-MM-DD

    if (!dIni || !dFim) {
        return console.log("⚠️ Datas não encontradas na solicitação vinculada.");
    }

    // Formatação conforme o mapeamento real do F12
    const formatarDataSimples = (iso) => {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    const dataIni = formatarDataSimples(dIni);
    const dataFim = formatarDataSimples(dFim);

    console.log(`🎯 ALVO: [${prestador.nome}] - ID Mestre: ${prestador.id_control_id}`);
    console.log(`📅 VIGÊNCIA MAPA F12: ${dataIni} até ${dataFim}`);

    // 2. Autenticação
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "mariano", password: "123456789" })
    });
    const { accessToken } = await loginRes.json();

    // 4. Mapeamento de Grupos (Dinâmico)
    const MAPA_GRUPOS = {
        "4irmaos": 2193,
        "seguranca": 1104
    };

    const normalize = (n) => (n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

    const nomeEmpresa = prestador.empresa;
    const nomeDepto = sol.departamento || prestador.departamento || "Segurança";

    const idEmpresa = MAPA_GRUPOS[normalize(nomeEmpresa)];
    const idDepto = MAPA_GRUPOS[normalize(nomeDepto)];

    const idsGrupos = [];
    if (idDepto) idsGrupos.push(idDepto);
    if (idEmpresa) idsGrupos.push(idEmpresa);

    console.log(`🏢 GRUPOS: Empresa(${nomeEmpresa}=${idEmpresa}) | Depto(${nomeDepto}=${idDepto})`);

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
