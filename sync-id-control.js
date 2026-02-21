
// 🔄 Sincronizador Supabase -> ID Control (Versão Final: Criação s/ ID, newID, Obs e Datas)
// Executar: node scripts/sync-id-control.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configurações
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const CHECK_INTERVAL_MS = 60 * 1000; // 1 minuto
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

// Inicializar Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

let sessionToken = null;

// ==========================================
// 🛠️ FUNÇÕES DE API
// ==========================================

async function loginIdControl() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    try {
        const response = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        sessionToken = data.accessToken || data.token;
        return !!sessionToken;
    } catch (e) {
        console.error("❌ Erro login:", e.message);
        return false;
    }
}

async function buscarUsuarioIdControl(documento) {
    if (!sessionToken && !await loginIdControl()) return null;
    try {
        const docLimpo = documento.replace(/[^0-9]/g, "");
        const response = await fetch(`${ID_CONTROL_URL}/api/users?rg=${docLimpo}`, {
            headers: { "Authorization": `Bearer ${sessionToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) return data[0];
            if (data.id) return data;
        }
    } catch (e) {
        // Ignora erro se não achar
    }
    return null;
}

// FORMATO F12: DD/MM/YYYY HH:mm
function formatDateF12(dateStr, isStart) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const time = "00:00";
    return `${day}/${month}/${year} ${time}`;
}

async function upsertUsuarioIdControl(prestador, usuarioExistente) {
    if (!sessionToken) await loginIdControl();

    // 1. Preparar Datas e Dados
    const sol = Array.isArray(prestador.solicitacoes) ? prestador.solicitacoes[0] : prestador.solicitacoes;
    const shelfStart = formatDateF12(sol?.data_inicial, true);
    const shelfEnd = formatDateF12(sol?.data_final, false);

    // Mapeamento de observação
    const comments = prestador.observacoes || "";

    console.log(`   📅 Datas: [${shelfStart}] -> [${shelfEnd}] | Obs: [${comments}]`);

    // 2. Montar Payload (Idêntico ao F12)
    const id = usuarioExistente?.id || 0; // Se existe, pega ID. Se novo, 0 (mas removemos do payload abaixo).
    const idDevice = usuarioExistente?.idDevice || 0; // Mantém se existir.

    const payload = {
        // id: id, // <--- REMOVIDO PARA CRIAÇÃO (Adicionado só se > 0 no final)
        idDevice: idDevice,
        name: prestador.nome,
        rg: prestador.documento.replace(/[^0-9]/g, ""),
        document: `RG: ${prestador.documento.replace(/[^0-9]/g, "")}`,

        // Datas
        shelfStartLife: shelfStart,
        shelfLife: shelfEnd,
        shelfStartLifeDate: shelfStart.split(' ')[0],
        shelfLifeDate: shelfEnd.split(' ')[0],

        // Outros
        // Outros
        // timeOfRegistration: `/Date(${Date.now()}-0300)/`, // REMOVIDO PARA CRIAÇÃO (F12 não manda)
        comments: comments,
        customFields: {},
        templates: [],
        cards: [],
        groups: [],
        userGroupsList: [],
        deleted: false,
        inativo: false,
        Ativacao: "", Validade: "", password: "", password_confirmation: "",
        pis: 0,
        foto: null, fotoDoc: null
    };

    // Só incluir ID se for UPDATE
    if (id > 0) {
        payload.id = id;
    }

    // 3. Enviar
    // F12 Creation usa POST sem ID. Update usa PUT com ID.
    const method = id ? "PUT" : "POST";
    const url = `${ID_CONTROL_URL}/api/user/`;

    console.log(`   📤 Enviando (${method})...`);

    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionToken}` },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        try {
            return await response.json(); // Retorna { newID: ... } na criação
        } catch (e) {
            return { success: true, id: id };
        }
    }

    const errText = await response.text();
    throw new Error(`${response.status} - ${errText}`);
}

// ==========================================
// 🚀 LÓGICA PRINCIPAL
// ==========================================

async function processarPendentes() {
    console.log("🔍 Buscando pendentes (Ordenado por Criação)...");

    // Ordenar por ID DESC para pegar os novos (Ligia, etc)
    const { data: pendentes, error } = await supabase
        .from('prestadores')
        .select(`
            id, nome, documento, status, observacoes,
            solicitacao_id, 
            solicitacoes:solicitacao_id ( data_inicial, data_final )
        `)
        .eq('status', 'aprovado')
        .is('integrado_id_control', false)
        .order('id', { ascending: false })
        .limit(50);

    if (error) {
        console.error("❌ Erro BD:", error.message);
        return;
    }

    if (!pendentes || pendentes.length === 0) {
        // console.log("💤 Nada novo..."); 
        return;
    }

    console.log(`📦 Processando ${pendentes.length} novos...`);

    for (const p of pendentes) {
        try {
            console.log(`🔄 Prestador: ${p.nome} (${p.documento})`);

            // 1. Verificar ID Control
            const usuarioExistente = await buscarUsuarioIdControl(p.documento);
            let idControlRemoto = null;

            if (usuarioExistente) {
                console.log(`   ✅ Já existe: ID ${usuarioExistente.id}`);
                idControlRemoto = usuarioExistente.id;
            } else {
                console.log(`   🆕 Não existe. Criando...`);
            }

            // 2. UPSERT
            const resultado = await upsertUsuarioIdControl(p, usuarioExistente);

            // CAPTURA DO O ID (Pode ser .newID na criação ou .id no update)
            const novoId = resultado.newID || resultado.id;

            if (!idControlRemoto && novoId) {
                idControlRemoto = novoId;
                console.log(`   ✨ Novo ID Gerado: ${idControlRemoto}`);
            }

            // 3. Atualizar Supabase e gravar o ID correto
            console.log(`   🏁 Atualizando Supabase...`);
            const { error: updateError } = await supabase
                .from('prestadores')
                .update({
                    integrado_id_control: true,
                    id_control_id: idControlRemoto || 0,
                    data_integracao: new Date()
                })
                .eq('id', p.id);

            if (updateError) throw updateError;
            console.log(`   ✅ Sincronizado com Sucesso!`);

        } catch (err) {
            console.error(`   ❌ Falha:`, err.message);
        }
    }
}

console.log("🚀 Monitor Final Iniciado");
setInterval(processarPendentes, CHECK_INTERVAL_MS);
processarPendentes(); 
