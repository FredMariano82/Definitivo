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
        return true; 
    }
}

function addLogToHistory(logEntry) {
    try {
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        }
        history.unshift({ timestamp: new Date().toISOString(), ...logEntry });
        if (history.length > 50) history = history.slice(0, 50);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error("❌ ERRO ao salvar histórico:", e.message);
    }
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

function construirPayloadUniversal(prestador, serverUser = null) {
    const rawUserPayloadInfo = `{"Ativacao":"","Validade":"","admin":false,"admissao":"","admissionDate":"","allowParkingSpotCompany":null,"availableCompanies":null,"availableGroupsVisitorsList":null,"availableResponsibles":null,"bairro":"","barras":"","blackList":false,"bornDate":"","canUseFacial":true,"cards":[],"cargo":"","cep":"","cidade":"","comments":"","contingency":true,"cpf":"","deleted":false,"document":"","dtAdmissao":"","dtNascimento":"","email":"","emailAcesso":"","endereco":"","estadoCivil":"","expireOnDateLimit":true,"foto":null,"fotoDoc":null,"groups":[],"groupsList":[],"idArea":1,"idDevice":0,"idResponsavel":null,"idType":0,"inativo":false,"mae":"","nacionalidade":"","name":"","nascimento":null,"naturalidade":"","objectGuid":null,"pai":"","password":"","phone":"","photoDeleted":false,"photoIdFaceState":0,"photoTimestamp":0,"pis":0,"pisAnterior":0,"ramal":"","registration":"","responsavelNome":null,"rg":"","selectedGroupsVisitorsList":null,"selectedIdGroupsVisitorsList":null,"selectedIdResponsible":null,"selectedIdVisitedCompany":null,"selectedNameResponsible":null,"selectedResponsible":null,"selectedVisitedCompany":null,"senha":0,"sexo":"","shelfLife":"","shelfStartLife":"","telefone":"","templates":[],"templatesImages":[],"templatesList":[],"templatesPanic":[],"templatesPanicImages":[],"templatesPanicList":[],"userGroupsList":[],"veiculo_cor":null,"veiculo_marca":null,"veiculo_modelo":null,"veiculo_placa":null,"visitorCompany":null,"credits":[],"rulesList":[],"password_confirmation":"","shelfLifeDate":"","shelfStartLifeDate":"","customFields":{}}`;
    const payload = JSON.parse(rawUserPayloadInfo);

    payload.name = prestador.nome;
    payload.rg = (prestador.doc1 || "").replace(/[^0-9]/g, "");
    payload.document = `RG: ${payload.rg}`;
    payload.cpf = (prestador.doc2 || "").replace(/[^0-9]/g, "");
    payload.comments = `checagem válida até ${formatDateOnly(prestador.checagem_valida_ate)}`;
    
    payload.customFields = [];
    
    if (serverUser) {
        payload.id = serverUser.id;
        payload.idDevice = serverUser.idDevice;
        payload.foto = serverUser.foto || null;
        payload.fotoDoc = serverUser.fotoDoc || null;
        payload.photoTimestamp = serverUser.photoTimestamp || 0;
        payload.photoIdFaceState = serverUser.photoIdFaceState || 0;
        payload.objectGuid = serverUser.objectGuid || null;
        payload.registration = serverUser.registration || "";
        payload.templates = serverUser.templates || [];
        payload.templatesImages = serverUser.templatesImages || [];
        payload.templatesList = serverUser.templatesList || [];
        payload.groupsList = serverUser.groupsList || [];
    }
    return payload;
}

// ============================================================================
// 3. EXECUÇÃO
// ============================================================================
async function despacharParaIDControl() {
    if (!isRoboAtivo()) return;
    if (fs.existsSync(LOCK_FILE)) return;

    try {
        fs.writeFileSync(LOCK_FILE, `Iniciado em: ${new Date().toLocaleString()}`);
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        const ID_CONTROL_URL = "https://192.168.100.20:30443";

        console.log("==================================================");
        console.log("🤖 ROBO 4: PASSO 3 - MODO LOOP ROBUSTO");
        console.log("==================================================");

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        console.log("Buscando fila de aprovados pendentes...");
        const searchUrl = `${SUPABASE_URL}/rest/v1/prestadores?select=*,solicitacoes:solicitacao_id(*)&checagem=eq.aprovado&id_control_id=is.null&limit=1`;
        
        const queryRes = await fetch(searchUrl, {
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        });
        const pendentes = await queryRes.json();

        if (!pendentes || pendentes.length === 0) {
            console.log("✨ FILA VAZIA.");
            return;
        }

        const total = pendentes.length;
        console.log(`📡 FILA ENCONTRADA: [${total}] registros.\n`);

        const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "mariano", password: "123456789" })
        });
        const { accessToken } = await loginRes.json();

        const groupsRes = await fetch(`${ID_CONTROL_URL}/api/group/`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const groupsJson = await groupsRes.json();
        const allGroups = Array.isArray(groupsJson) ? groupsJson : (groupsJson.data || []);

        const normalizeLocal = (n) => (n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
        const findGroupId = (name) => {
            if (!name) return null;
            const normTarget = normalizeLocal(name);
            const match = allGroups.find(g => normalizeLocal(g.name) === normTarget);
            return match ? match.id : null;
        };

        let index = 1;
        for (const prestador of pendentes) {
            console.log(`👤 [${index}/${total}] PROCESSANDO: ${prestador.nome}`);
            try {
                const sol = prestador.solicitacoes || {};
                if (!sol.data_inicial || !sol.data_final || !prestador.checagem_valida_ate) {
                    console.log(`⚠️ PULO DE SEGURANÇA: Dados faltando.`);
                    index++; continue;
                }

                const formatarDataLocal = (iso) => {
                    const [y, m, d] = iso.split('-');
                    return `${d}/${m}/${y}`;
                };
                const dataIni = formatarDataLocal(sol.data_inicial);
                const dataFim = formatarDataLocal(sol.data_final);

                // Mapeamento de Grupos
                // Mapeamento de Grupos
                const idEmpresa = findGroupId(prestador.empresa);
                const idDepto = findGroupId(sol.departamento || prestador.departamento || "Segurança");
                const idsGruposRaw = [];
                if (idDepto) idsGruposRaw.push(idDepto);
                if (idEmpresa) idsGruposRaw.push(idEmpresa);
                const idsGrupos = [...new Set(idsGruposRaw)];

                // Verificar existência via RG (Critério Único e Seguro)
                const rgSoNumeros = (prestador.doc1 || "").replace(/[^0-9]/g, "");
                const searchRes = await fetch(`${ID_CONTROL_URL}/api/user/FindUserByRG?rg=${rgSoNumeros}`, {
                    headers: { "Authorization": `Bearer ${accessToken}` }
                });
                const searchData = await searchRes.json();
                let serverUser = Array.isArray(searchData) ? searchData[0] : (searchData.id ? searchData : null);

                // HOTFIX: Marcus Vinicius Mariano tem múltiplas contas. Forçar a oficial (10026958) capturada no Browser.
                if (prestador.nome.includes("Marcus Vinicius Mariano")) {
                    console.log("🛠️ HOTFIX MARCUS: Forçando ID 10026958 para evitar duplicidade.");
                    serverUser = { id: 10026958, name: prestador.nome }; 
                }

                if (serverUser) {
                    console.log(`🔄 MODO INTELIGENTE: Solicitando cadastro completo para preservação...`);
                    const userFullRes = await fetch(`${ID_CONTROL_URL}/api/user/${serverUser.id}`, {
                        headers: { "Authorization": `Bearer ${accessToken}` }
                    });
                    let fullData = userFullRes.ok ? await userFullRes.json() : serverUser;
                    
                    // Forçar integridade para Marcus
                    if (prestador.nome.includes("Marcus Vinicius Mariano")) {
                        fullData.deleted = false;
                        fullData.inativo = false;
                    }

                    // REGRA DE OURO: Se não encontrar novos grupos, mantém os originais.
                    const finalGroups = (idsGrupos && idsGrupos.length > 0) ? idsGrupos : (fullData.groups || []);
                    const finalUserGroupsList = (idsGrupos && idsGrupos.length > 0) 
                        ? idsGrupos.map(gid => ({ idGroup: gid, idUser: serverUser.id, isVisitor: 0 }))
                        : (fullData.userGroupsList || []);

                    // ESTRATÉGIA: ESPELHAMENTO REAL (Baseado na Auditoria Browser)
                    // Pegamos TUDO o que o servidor nos mandou e apenas injetamos as novas datas.
                    const finalPayload = { 
                        ...fullData,
                        name: prestador.nome, // Garantir nome atualizado se mudou no Supabase
                        Ativacao: `${dataIni} 00:00`,
                        Validade: `${dataFim} 23:59`,
                        shelfStartLife: `${dataIni} 00:00`,
                        shelfLife: `${dataFim} 23:59`,
                        shelfStartLifeDate: dataIni,
                        shelfLifeDate: dataFim,
                        dateStartLimitDate: dataIni,
                        dateLimitDate: dataFim,
                        admissionDate: fullData.admissionDate || fullData.dtAdmissao || "",
                        dtAdmissao: fullData.dtAdmissao || fullData.admissionDate || "",
                        expireOnDateLimit: true,
                        comments: `checagem válida até ${formatDateOnly(prestador.checagem_valida_ate)}`,
                        // Vínculos de Grupos (Empresa e Departamento)
                        groups: finalGroups,
                        userGroupsList: finalUserGroupsList,

                        // CORREÇÃO PARA EVITAR ERRO 500 (NullReference)
                        templatesImages: fullData.templatesImages || [],
                        templatesPanicImages: fullData.templatesPanicImages || [],
                        credits: fullData.credits || [],
                        customFields: fullData.customFields || []
                    };

                    console.log("📤 PAYLOAD ESPELHO FINAL (PUT):", JSON.stringify({ ...finalPayload, foto: finalPayload.foto ? 'PRESENT' : 'ABSENT' }, null, 2));

                    console.log(`🔄 Atualizando via Protocolo de Espelhamento de Alta Fidelidade (ID: ${serverUser.id})...`);
                    const res = await fetch(`${ID_CONTROL_URL}/api/user/`, {
                        method: "PUT",
                        headers: { 
                            "Accept": "application/json, text/plain, */*",
                            "Content-Type": "application/json;charset=UTF-8", 
                            "Authorization": `Bearer ${accessToken}` 
                        },
                        body: JSON.stringify(finalPayload)
                    });

                    if (res.ok) {
                        const idGerado = serverUser.idDevice || serverUser.id;
                        console.log(`🟩 SUCESSO: Atualizado ID ${idGerado}`);
                        await supabase.from('prestadores').update({ id_control_id: String(idGerado), data_integracao: new Date().toISOString() }).eq('id', prestador.id);
                        addLogToHistory({ nome: prestador.nome, doc: prestador.doc1, status: 'sucesso', id_control: idGerado, mensagem: 'Preservado e Atualizado' });
                    } else {
                        console.error(`❌ FALHA PUT:`, res.status, await res.text());
                    }
                } else {
                    console.log(`🆕 Criando novo cadastro...`);
                    const res = await fetch(`${ID_CONTROL_URL}/api/user/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
                        body: JSON.stringify(construirPayloadUniversal(prestador))
                    });
                    if (res.ok) {
                        const novo = await res.json();
                        const idGerado = novo.idDevice || novo.id;
                        await supabase.from('prestadores').update({ id_control_id: String(idGerado), data_integracao: new Date().toISOString() }).eq('id', prestador.id);
                        addLogToHistory({ nome: prestador.nome, doc: prestador.doc1, status: 'sucesso', id_control: idGerado, mensagem: 'Criado com sucesso' });
                    } else {
                        console.error("❌ FALHA POST:", await res.text());
                    }
                }
            } catch (err) {
                console.error(`💥 Erro em ${prestador.nome}:`, err.message);
            }
            index++;
        }
        console.log("\n✅ CICLO FINALIZADO!");
    } catch (error) {
        console.error("\n❌ ERRO CRÍTICO: ", error.message);
    } finally {
        if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    }
}

despacharParaIDControl().then(() => process.exit(0)).catch(err => { console.error('Erro:', err); process.exit(1); });
