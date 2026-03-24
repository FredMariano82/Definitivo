const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const LOCK_FILE = path.resolve(__dirname, 'robo4.lock');
const STATUS_FILE = path.resolve(__dirname, '../../../robo4_status.json');
const HISTORY_FILE = path.resolve(__dirname, '../../../robo4_history.json');

// ============================================================================
// 1. UTILITÁRIOS
// ============================================================================
function isRoboAtivo() {
    try {
        if (!fs.existsSync(STATUS_FILE)) return true;
        const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
        return data.active !== false;
    } catch (e) {
        return true; // Fallback para ativo
    }
}

function addLogToHistory(logEntry) {
    try {
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        }
        
        // Adicionar novo log ao início
        history.unshift({
            timestamp: new Date().toISOString(),
            ...logEntry
        });

        // Manter apenas os últimos 50 logs
        if (history.length > 50) history = history.slice(0, 50);

        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error("❌ ERRO ao salvar histórico:", e.message);
    }
}

function normalizar(str) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
}

function formatDateOnly(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function construirPayloadUniversal(prestador) {
    const payload = {
        name: prestador.nome,
        rg: (prestador.doc1 || "").replace(/[^0-9]/g, ""),
        document: `RG: ${(prestador.doc1 || "").replace(/[^0-9]/g, "")}`,
        cpf: (prestador.doc2 || "").replace(/[^0-9]/g, ""),
        comments: `checagem válida até ${formatDateOnly(prestador.checagem_valida_ate)}`,
        idType: 0,
        idArea: 0,
        registration: "",
        inativo: false,
        canUseFacial: true,
        admin: false,
        deleted: false,
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
// 3. EXECUÇÃO DA ETAPA 3 (O Envio para a API via FETCH em LOOP)
// ============================================================================
async function despacharParaIDControl() {
    // A0. VERIFICAR SE O ROBÔ ESTÁ ATIVO (PAUSE/RESUME)
    if (!isRoboAtivo()) {
        console.log("⏸️ ROBÔ PAUSADO: A execução foi suspensa via Dashboard (SuperAdmin).");
        return;
    }

    // A. VERIFICAR CADEADO (LOCK)
    if (fs.existsSync(LOCK_FILE)) {
        console.log("🛑 CONFLITO: Outra instância do Robô 4 já está em execução. Encerrando para evitar duplicidade.");
        return;
    }

    try {
        // B. FECHAR CADEADO
        fs.writeFileSync(LOCK_FILE, `Iniciado em: ${new Date().toLocaleString()}`);
        
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        const ID_CONTROL_URL = "https://192.168.100.20:30443";

        console.log("==================================================");
        console.log("🤖 ROBO 4: PASSO 3 - MODO LOOP ROBUSTO");
        console.log("==================================================");

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // 1. Buscar Alvos Pendentes (Usando Raw Fetch por confiabilidade em ambientes restritos)
        console.log("Buscando fila de aprovados pendentes de sincronização...");
        
        const queryRes = await fetch(`${SUPABASE_URL}/rest/v1/prestadores?select=*,solicitacoes:solicitacao_id(*)&checagem=eq.aprovado&id_control_id=is.null&order=criado_em.asc`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (!queryRes.ok) throw new Error("Erro ao consultar fila no banco de dados.");
        const pendentes = await queryRes.json();

        if (!pendentes || pendentes.length === 0) {
            console.log("✨ FILA VAZIA: Todos os aprovados já têm ID Control.");
            return;
        }

        const total = pendentes.length;
        console.log(`📡 FILA ENCONTRADA: [${total}] registros para processar.\n`);

        // 2. Autenticação (Uma vez por ciclo para eficiência)
        console.log("Autenticando no ID Control...");
        const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "mariano", password: "123456789" })
        });
        const { accessToken } = await loginRes.json();
        console.log("🔓 Login efetuado com sucesso.");

        // 3. Buscar grupos uma vez para mapeamento
        console.log("Mapeando grupos do servidor...");
        const groupsRes = await fetch(`${ID_CONTROL_URL}/api/group/`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const groupsJson = await groupsRes.json();
        const allGroups = Array.isArray(groupsJson) ? groupsJson : (groupsJson.data || []);
        console.log(`📊 ${allGroups.length} grupos carregados.`);

        const normalizeLocal = (n) => (n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
        const findGroupId = (name) => {
            if (!name) return null;
            const normTarget = normalizeLocal(name);
            const match = allGroups.find(g => normalizeLocal(g.name) === normTarget);
            return match ? match.id : null;
        };

        // 🎯 INÍCIO DO LOOP METICULOSO
        let index = 1;
        for (const prestador of pendentes) {
            console.log(`\n--------------------------------------------------`);
            console.log(`👤 [${index}/${total}] PROCESSANDO: ${prestador.nome}`);
            console.log(`--------------------------------------------------`);

            try {
                const sol = prestador.solicitacoes || {};
                
                // 🛑 TRAVA DE SEGURANÇA: Só prosseguir se as datas REALMENTE existirem (evita o erro de data provisória)
                if (!sol.data_inicial || !sol.data_final || !prestador.checagem_valida_ate) {
                    console.log(`⚠️ PULO DE SEGURANÇA: ${prestador.nome} ainda não foi enriquecido via Botão BD (Datas faltando). Ignorando...`);
                    index++;
                    continue;
                }

                // Vigência (Com fallback para datas padrão se sol for vazio)
                const dIni = sol.data_inicial;
                const dFim = sol.data_final;

                const formatarDataLocal = (iso) => {
                    const [y, m, d] = iso.split('-');
                    return `${d}/${m}/${y}`;
                };

                const dataIni = formatarDataLocal(dIni);
                const dataFim = formatarDataLocal(dFim);

                // Mapeamento de Grupos para ESTE prestador
                const nomeEmpresa = prestador.empresa;
                const nomeDepto = sol.departamento || prestador.departamento || "Segurança";

                const idEmpresa = findGroupId(nomeEmpresa);
                const idDepto = findGroupId(nomeDepto);

                const idsGrupos = [];
                if (idDepto) idsGrupos.push(idDepto);
                if (idEmpresa) idsGrupos.push(idEmpresa);

                // Verificar existência (POST vs PUT)
                const searchRes = await fetch(`${ID_CONTROL_URL}/api/user/list?search%5Bvalue%5D=${encodeURIComponent(prestador.nome)}&inactive=0&blacklist=0&filterCol=name&length=10`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: null
                });
                const { data: list } = await searchRes.json();
                const serverUser = list && list.length > 0 ? list[0] : null;

                const payloadCentral = {
                    ...construirPayloadUniversal(prestador),
                    expireOnDateLimit: true,
                    shelfStartLife: `${dataIni} 00:00`,
                    shelfStartLifeDate: dataIni,
                    shelfLife: `${dataFim} 00:00`,
                    shelfLifeDate: dataFim,
                    groups: idsGrupos,
                    userGroupsList: idsGrupos.map(gid => ({ idGroup: gid, idUser: serverUser?.id || 0, isVisitor: 0 })),
                    dateStartLimit: null,
                    dateLimit: null
                };

                if (serverUser) {
                    // MODO VERIFICAÇÃO DE HOMÔNIMO
                    const rgDB = (prestador.doc1 || "").replace(/[^0-9]/g, "");
                    const cpfDB = (prestador.doc2 || "").replace(/[^0-9]/g, "");
                    const rgID = (serverUser.rg || "").replace(/[^0-9]/g, "");
                    const cpfID = (serverUser.cpf || "").replace(/[^0-9]/g, "");

                    let aprovadoParaPUT = false;
                    if (!rgID || rgID === rgDB) aprovadoParaPUT = true;
                    else if (cpfDB && (!cpfID || cpfID === cpfDB)) aprovadoParaPUT = true;

                    if (!aprovadoParaPUT) {
                        console.log(`❌ CONFLITO: Documentos divergem (RG/CPF). Enviando para Revisão Manual.`);
                        await supabase.from('prestadores').update({ checagem: 'revisar', observacoes: `[CONFLITO RG: ${rgID}]` }).eq('id', prestador.id);
                        index++;
                        continue;
                    }

                    console.log(`🔄 Atualizando cadastro existente (ID: ${serverUser.id})...`);
                    const res = await fetch(`${ID_CONTROL_URL}/api/user/`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
                        body: JSON.stringify({ ...payloadCentral, id: serverUser.id, idDevice: serverUser.idDevice })
                    });

                    if (res.ok) {
                        const idGerado = serverUser.idDevice || serverUser.id;
                        console.log(`🟩 SUCESSO: Cadastro atualizado (Link: ${idGerado})`);
                        await supabase.from('prestadores').update({ id_control_id: String(idGerado), data_integracao: new Date().toISOString() }).eq('id', prestador.id);
                        
                        // FALTAVA ISTO NA ATUALIZAÇÃO! AGORA GRAVA NO HISTÓRICO.
                        addLogToHistory({
                            nome: prestador.nome,
                            doc: prestador.doc1,
                            status: 'sucesso',
                            id_control: idGerado,
                            mensagem: 'Atualizado (Vigência/Campos) com sucesso'
                        });
                    }
                } else {
                    console.log(`🆕 Criando novo cadastro no ID Control...`);
                    const res = await fetch(`${ID_CONTROL_URL}/api/user/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
                        body: JSON.stringify(payloadCentral)
                    });

                    if (res.ok) {
                        const novo = await res.json();
                        const idGerado = novo.idDevice || novo.id;
                        console.log(`🟩 SUCESSO: Criado com ID ${idGerado}`);
            // F. ATUALIZAR STATUS NO SUPABASE
            await supabase.from('prestadores').update({ id_control_id: String(idGerado), data_integracao: new Date().toISOString() }).eq('id', prestador.id);
            console.log(`✅ SUCESSO: ${prestador.nome} sincronizado. ID: ${idGerado}`);

            addLogToHistory({
                nome: prestador.nome,
                doc: prestador.doc1,
                status: 'sucesso',
                id_control: idGerado,
                mensagem: 'Sincronizado com sucesso'
            });
                    } else {
                        console.log("❌ Falha na Criação:", await res.text());
                    }
                }
            } catch (itemError) {
                console.error(`💥 Erro ao processar ${prestador.nome}:`, itemError.message);
            
            addLogToHistory({
                nome: prestador.nome,
                doc: prestador.doc1,
                status: 'erro',
                mensagem: itemError.message
            });
            }

            // 🕒 FOLGA ENTRE CADASTROS (2 Segundos)
            if (index < total) {
                console.log(`...Aguardando 2 segundos para o próximo...`);
                await wait(2000);
            }
            index++;
        }

        console.log("\n✅ CICLO DE SINCRONIZAÇÃO FINALIZADO COM SUCESSO!");

    } catch (error) {
        console.error("\n❌ ERRO CRÍTICO NO ROBÔ: ", error.message);
    } finally {
        // C. ABRIR CADEADO SEMPRE
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
            console.log("🔓 Cadeado aberto. Sistema liberado para o próximo ciclo.");
        }
    }
}

const INTERVALO_MS = 60 * 1000; // 1 minuto configurado como padrão

async function iniciarPulmao() {
    console.log(`\n[PULMAO ATIVADO] O Robo4 agora esta em modo de escuta continua.`);
    console.log(`[RELOGIO] Verificando a fila automaticamente a cada ${INTERVALO_MS / 1000} segundos...`);
    console.log(`[CONTROLE] Use o botao no Dashboard (SuperAdmin) para pausar ou ligar o robo.\n`);

    // Primeira execução imediata ao dar o comando
    await despacharParaIDControl().catch(err => {
        console.error("[ERRO FATAL NA PRIMEIRA EXECUCAO]:", err.message);
        if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    });

    // Loop contínuo a cada X segundos
    setInterval(async () => {
        // Só tenta rodar se o cadeado estiver aberto
        if (!fs.existsSync(LOCK_FILE)) {
            await despacharParaIDControl().catch(err => {
                console.error("[ERRO FATAL NO CICLO]:", err.message);
                if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
            });
        } else {
            console.log("[PULMAO IGNORADO] O cadeado esta fechado. O Robo ainda esta trabalhando na fila anterior.");
        }
    }, INTERVALO_MS);
}

// Inicia o processo que nunca morre
iniciarPulmao();
