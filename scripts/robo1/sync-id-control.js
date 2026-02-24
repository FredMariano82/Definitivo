
// 🔄 Sincronizador Supabase -> ID Control (Versão Final: Criação s/ ID, newID, Obs e Datas)
// Executar: node scripts/sync-id-control.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configurações
const ID_CONTROL_URL = "https://192.168.100.20:30443";
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

// Inicializar Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

let sessionToken = null;
let cacheGrupos = []; // Cache global de grupos da ID Control
let cacheUsuarios = []; // Cache global de usuários (Segurança Total)

// ==========================================
// 🛠️ FUNÇÕES DE SEGURANÇA E NORMALIZAÇÃO
// ==========================================

function normalizar(str) {
    return (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais
        .trim();
}

function validarSimilaridadeNome(nomeSupabase, nomeIdControl) {
    if (!nomeSupabase || !nomeIdControl) return false;

    const s1 = normalizar(nomeSupabase);
    const s2 = normalizar(nomeIdControl);

    console.log(`      🔎 Comparando: [${s1}] vs [${s2}]`);

    if (s1 === s2) {
        console.log(`      ✅ Match Exato (normalizado).`);
        return true;
    }

    const n1 = s1.split(/\s+/).filter(p => p.length > 0);
    const n2 = s2.split(/\s+/).filter(p => p.length > 0);

    // 1. Comparação de Primeiro e Último Nome (ignorando sufixos)
    const sufixos = ["junior", "jr", "filho", "neto", "sobrinho", "segundo", "terceiro"];

    const primeiro1 = n1[0];
    const primeiro2 = n2[0];

    let ultimo1 = n1.length > 1 ? n1[n1.length - 1] : "";
    let ultimo2 = n2.length > 1 ? n2[n2.length - 1] : "";

    // Se o último nome for um sufixo, tenta pegar o penúltimo
    if (sufixos.includes(ultimo1) && n1.length > 2) ultimo1 = n1[n1.length - 2];
    if (sufixos.includes(ultimo2) && n2.length > 2) ultimo2 = n2[n2.length - 2];

    const nomesPrincipaisBatem = (primeiro1 === primeiro2 && ultimo1 === ultimo2);
    if (nomesPrincipaisBatem && primeiro1 && ultimo1) {
        console.log(`      ✅ Match por Primeiro/Último Nome: [${primeiro1}...${ultimo1}]`);
        return true;
    }

    // 2. Similaridade de intersecção de palavras
    const palavras1 = new Set(n1.filter(p => !sufixos.includes(p)));
    const palavras2 = new Set(n2.filter(p => !sufixos.includes(p)));

    let intersecção = 0;
    palavras1.forEach(p => { if (palavras2.has(p)) intersecção++; });

    const totalPalavras = Math.max(palavras1.size, palavras2.size);
    const similaridade = intersecção / totalPalavras;

    console.log(`      📊 Similaridade calculada: ${(similaridade * 100).toFixed(0)}%`);
    return similaridade >= 0.7; // Regra dos 70%
}

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
        const rawToken = data.accessToken || data.token;
        sessionToken = rawToken ? rawToken.replace(/[\r\n]/g, '').trim() : null;
        return !!sessionToken;
    } catch (e) {
        console.error("❌ Erro login:", e.message);
        return false;
    }
}

async function carregarGruposIdControl() {
    if (!sessionToken && !await loginIdControl()) return;
    try {
        console.log("   📡 Carregando lista de grupos da ID Control...");
        const response = await fetch(`${ID_CONTROL_URL}/api/group/`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${sessionToken}` }
        });
        if (response.ok) {
            const result = await response.json();
            cacheGrupos = result.data || result || [];
            console.log(`   📦 ${cacheGrupos.length} grupos carregados.`);
        }
    } catch (e) {
        console.error("   ⚠️ Erro ao carregar grupos:", e.message);
    }
}

function mapearGrupoPelonome(nome) {
    if (!nome) return null;
    const nomeNorm = normalizar(nome);

    // Hardcoded safety for known critical groups
    if (nomeNorm.includes("hagana")) return 2039;
    if (nomeNorm.includes("seguranca") && !nomeNorm.includes("trabalho")) return 1104;

    const match = cacheGrupos.find(g => normalizar(g.name) === nomeNorm);
    if (match) {
        console.log(`      🔗 Mapeado: "${nome}" -> ID ${match.id}`);
        return match.id;
    }
    console.log(`      ⚠️ Grupo não localizado: "${nome}"`);
    return null;
}

async function carregarTodosUsuariosIdControl() {
    if (!sessionToken && !await loginIdControl()) return;
    try {
        console.log("   📡 [SEGURANÇA] Baixando lista completa de usuários para o Cache...");
        const response = await fetch(`${ID_CONTROL_URL}/api/users?page=0&size=5000`, {
            headers: { "Authorization": `Bearer ${sessionToken}` }
        });
        if (response.ok) {
            const result = await response.json();
            cacheUsuarios = result.data || result.content || result || [];
            console.log(`   📦 Cache alimentado com ${cacheUsuarios.length} usuários.`);
        }
    } catch (e) {
        console.error("   ⚠️ Erro ao carregar cache de usuários:", e.message);
    }
}

async function buscarUsuarioIdControl(documento) {
    if (!sessionToken && !await loginIdControl()) return null;

    const docLimpo = documento.replace(/[^0-9]/g, "");
    console.log(`   🔎 BUSCANDO IDENTIDADE (RG: ${docLimpo})...`);

    // 1. Tentar no Cache Local primeiro (Super Seguro)
    const userNoCache = cacheUsuarios.find(u => {
        const uRg = String(u.rg || "").replace(/[^0-9]/g, "");
        return uRg === docLimpo;
    });

    if (userNoCache) {
        const uid = userNoCache.id || userNoCache.idUser;
        console.log(`   ✅ ENCONTRADO NO CACHE: "${userNoCache.name}" (ID: ${uid})`);
        return { ...userNoCache, id: uid };
    }

    // 2. Tentar busca direta se não estiver no cache
    console.log(`   🔄 Não está no cache. Tentando busca viva na API...`);
    try {
        const response = await fetch(`${ID_CONTROL_URL}/api/users?rg=${docLimpo}`, {
            headers: { "Authorization": `Bearer ${sessionToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            const list = Array.isArray(data) ? data : (data.id ? [data] : []);
            const user = list.find(u => String(u.rg || "").replace(/[^0-9]/g, "") === docLimpo);
            if (user) {
                const userId = user.id || user.idUser;
                console.log(`   ✅ LOCALIZADO VIA API: "${user.name}" (ID: ${userId})`);
                return { ...user, id: userId };
            }
        }
    } catch (e) {
        console.error("   ⚠️ Erro na busca viva:", e.message);
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

    // 🆕 MAPEAMENTO DE GRUPOS (EMPRESA E DEPARTAMENTO)
    console.log(`   🏗️ Processando grupos para: [${prestador.empresa}] e [${sol?.departamento}]`);
    const idEmpresa = mapearGrupoPelonome(prestador.empresa);
    const idDepto = mapearGrupoPelonome(sol?.departamento);

    const idsGrupos = [];
    if (idEmpresa) idsGrupos.push(idEmpresa);
    if (idDepto) idsGrupos.push(idDepto);

    // Formatar userGroupsList conforme F12
    const userGroupsList = idsGrupos.map(id => ({
        idGroup: id,
        idUser: usuarioExistente?.id || 0,
        isVisitor: 0
    }));

    console.log(`   📅 Datas: [${shelfStart}] -> [${shelfEnd}] | Obs: [${comments}]`);

    // 2. Montar Payload (Idêntico ao F12)
    const id = usuarioExistente?.id || 0; // Se existe, pega ID. Se novo, 0 (mas removemos do payload abaixo).
    const idDevice = usuarioExistente?.idDevice || 0; // Mantém se existir.

    const payload = {
        name: prestador.nome,
        rg: prestador.doc1.replace(/[^0-9]/g, ""),
        document: `RG: ${prestador.doc1.replace(/[^0-9]/g, "")}`,

        // Datas
        shelfStartLife: shelfStart,
        shelfLife: shelfEnd,
        shelfStartLifeDate: shelfStart.split(' ')[0],
        shelfLifeDate: shelfEnd.split(' ')[0],

        // Vínculos de Grupos (Print 4)
        groups: idsGrupos,
        userGroupsList: userGroupsList,

        comments: comments,
        customFields: {
            "Empresa": prestador.empresa,
            "Departamento": sol?.departamento
        },

        // Flags de estado
        deleted: false,
        inactive: false,
        active: true
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
    console.log("   Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionToken}` },
        body: JSON.stringify(payload)
    });

    const resRaw = await response.text();

    if (response.ok) {
        console.log("   ✅ Sucesso API ID Control");
        try {
            return JSON.parse(resRaw); // Retorna { newID: ... } na criação
        } catch (e) {
            return { success: true, id: id };
        }
    }

    console.error(`   ❌ Falha API (Body):`, resRaw);
    throw new Error(`${response.status} - ${resRaw}`);
}

// ==========================================
// 🚀 LÓGICA PRINCIPAL
// ==========================================

async function processarPendentes() {
    console.log("🔍 Iniciando Ciclo de Sincronização...");

    // 1. Recarregar lista global de usuários e grupos (Cache Definitivo)
    await carregarGruposIdControl();
    await carregarTodosUsuariosIdControl();

    // Ordenar por ID DESC para pegar os novos (Ligia, etc)
    const { data: pendentes, error } = await supabase
        .from('prestadores')
        .select(`
            id, nome, doc1, liberacao, observacoes, empresa,
            solicitacao_id, 
            solicitacoes:solicitacao_id ( data_inicial, data_final, departamento )
        `)
        .eq('liberacao', 'ok')
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

    // console.log("DEBUG Pendentes:", JSON.stringify(pendentes, null, 2));
    console.log("DEBUG Pendentes:", JSON.stringify(pendentes, null, 2));
    console.log(`📦 Processando ${pendentes.length} novos...`);

    for (const p of pendentes) {
        try {
            console.log(`🔄 Prestador: ${p.nome} (${p.doc1})`);

            // 1. Verificar ID Control
            const usuarioExistente = await buscarUsuarioIdControl(p.doc1);
            let idControlRemoto = null;

            if (usuarioExistente) {
                console.log(`   ✅ Encontrado no ID Control: ${usuarioExistente.name} (ID: ${usuarioExistente.id})`);

                // 🛡️ SECURITY CHECK: Nome Bate?
                if (validarSimilaridadeNome(p.nome, usuarioExistente.name)) {
                    console.log(`   🔸 Nomes compatíveis. Prosseguindo com UPDATE.`);
                    idControlRemoto = usuarioExistente.id;
                } else {
                    console.log(`   🚨 NOMES DIVERGENTES! (Supabase: "${p.nome}" vs ID Control: "${usuarioExistente.name}")`);
                    console.log(`   🚩 Marcando como DEVOLVER no Supabase.`);

                    await supabase.from('prestadores')
                        .update({
                            liberacao: 'negada',
                            checagem: 'reprovada',
                            observacoes: `[ERRO RG] Conflito de RG. No ID Control este RG pertence a "${usuarioExistente.name}". Favor corrigir ou informar CPF.`,
                            integrado_id_control: false
                        })
                        .eq('id', p.id);

                    continue; // Pula para o próximo
                }
            } else {
                console.log(`   🆕 Não encontrado. Criando novo...`);
            }

            // 2. UPSERT
            const resultadoId = await upsertUsuarioIdControl(p, usuarioExistente);

            // CAPTURA DO O ID (Pode ser .newID na criação ou .id no update)
            const novoId = resultadoId.newID || resultadoId.id;

            if (!idControlRemoto && novoId) {
                idControlRemoto = novoId;
                console.log(`   ✨ Sucesso! ID: ${idControlRemoto}`);
            }

            // 3. Atualizar Supabase e gravar o ID correto
            console.log(`   🏁 Finalizando no Supabase...`);
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

            // 🛡️ Segurança: Tratar erros do robô
            if (err.message.includes("RG já cadastrado")) {
                console.log(`   🚨 Conflito de RG detectado (Mensagem explícita).`);
                await supabase.from('prestadores')
                    .update({
                        liberacao: 'negada',
                        checagem: 'reprovada',
                        observacoes: '[ERRO RG] RG já cadastrado em outro usuário.'
                    })
                    .eq('id', p.id);
            } else {
                console.log(`   🚨 Erro na Sincronização: ${err.message}`);
                // Não marca como negada automaticamente para erros genéricos, apenas reporta
            }
        }
    }
}

console.log("🚀 Monitor em modo MANUAL. Aguardando execução...");
// setInterval(processarPendentes, CHECK_INTERVAL_MS);
processarPendentes(); 
