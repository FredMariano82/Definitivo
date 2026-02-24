
// 🤖 ROBO 2 - Sincronização Estrita por NOME (Versão 2.3)
// Regra: Somente Localizar por Nome -> Atualizar Datas/Grupos. 
// Proibido: Buscar por RG ou Criar sem Nome.

const fs = require('fs');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";
const CSV_PATH = "c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Pessoas_2026224_0302.csv";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

let sessionToken = null;
let cacheCSV = [];
let cacheGrupos = [];

function normalizar(str) {
    return (str || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "").trim();
}

async function login() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    try {
        const res = await fetch(`${ID_CONTROL_URL}/api/login/`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
        });
        const data = await res.json();
        sessionToken = (data.accessToken || data.token || "").trim();
        return !!sessionToken;
    } catch (e) { return false; }
}

async function carregarReferencial() {
    console.log("   📡 Carregando grupos e arquivo CSV...");
    try {
        const resG = await fetch(`${ID_CONTROL_URL}/api/group/`, { headers: { "Authorization": `Bearer ${sessionToken}` } });
        if (resG.ok) { cacheGrupos = (await resG.json()).data || []; }

        if (fs.existsSync(CSV_PATH)) {
            const csvData = fs.readFileSync(CSV_PATH, 'latin1');
            Papa.parse(csvData, { header: true, skipEmptyLines: true, complete: (res) => { cacheCSV = res.data; } });
        }
    } catch (e) { console.error("   ⚠️ Erro referencial."); }
}

function mapearGrupo(nome) {
    if (!nome) return null;
    const n = normalizar(nome);
    if (n.includes("HAGANA")) return 2039;
    if (n.includes("SEGURANCA")) return 1104;
    const match = cacheGrupos.find(g => normalizar(g.name) === n);
    return match ? match.id : null;
}

async function buscarUsuario(nomeSupabase) {
    const alvo = normalizar(nomeSupabase);

    // 1. CSV
    const noCSV = cacheCSV.find(u => normalizar(u.Usuário || u.name) === alvo);
    if (noCSV) { return { id: noCSV.ID, name: noCSV.Usuário || noCSV.name }; }

    // 2. API (Nome Exato)
    try {
        const res = await fetch(`${ID_CONTROL_URL}/api/users?name=${encodeURIComponent(nomeSupabase)}`, {
            headers: { "Authorization": `Bearer ${sessionToken}` }
        });
        const text = await res.text();
        if (res.ok && !text.includes("Not Found")) {
            const json = JSON.parse(text);
            const list = Array.isArray(json) ? json : (json.content || []);
            return list.find(u => normalizar(u.name) === alvo);
        }
    } catch (e) { }
    return null;
}

async function sincronizar(prestador, userExistente) {
    if (!userExistente) {
        throw new Error("Localização falhou: Nome não encontrado no sistema. Operação cancelada.");
    }

    const sol = Array.isArray(prestador.solicitacoes) ? prestador.solicitacoes[0] : prestador.solicitacoes;
    const fmtDate = (d) => {
        if (!d) return "";
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y} 00:00`;
    };

    const idsGrupos = [mapearGrupo(prestador.empresa), mapearGrupo(sol?.departamento)].filter(id => id !== null);

    const payload = {
        id: userExistente.id || userExistente.idUser,
        name: userExistente.name, // Mantém o nome do sistema
        rg: (prestador.doc1 || "").replace(/[^0-9]/g, ""),
        shelfStartLife: fmtDate(sol?.data_inicial),
        shelfLife: fmtDate(sol?.data_final),
        shelfStartLifeDate: fmtDate(sol?.data_inicial).split(' ')[0],
        shelfLifeDate: fmtDate(sol?.data_final).split(' ')[0],
        groups: idsGrupos,
        userGroupsList: idsGrupos.map(id => ({ idGroup: id, idUser: userExistente.id || userExistente.idUser, isVisitor: 0 })),
        comments: prestador.observacoes || "",
        active: true, deleted: false, inactive: false
    };

    const res = await fetch(`${ID_CONTROL_URL}/api/user/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionToken}` },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Falha ao salvar (API ${res.status}): ${await res.text()}`);
    return { id: payload.id };
}

async function main() {
    console.log("🚀 ROBO 2 - ESTREITAMENTE POR NOME");
    if (!await login()) return;
    await carregarReferencial();

    const { data: pendentes } = await supabase.from('prestadores')
        .select(`id, nome, doc1, liberacao, observacoes, empresa, solicitacao_id, solicitacoes:solicitacao_id ( data_inicial, data_final, departamento )`)
        .eq('liberacao', 'ok').is('integrado_id_control', false).order('id', { ascending: false }).limit(1);

    if (!pendentes || pendentes.length === 0) { console.log("💤 Sem pendentes."); return; }

    const p = pendentes[0];
    console.log(`\n🔍 Localizando: ${p.nome}`);
    try {
        const user = await buscarUsuario(p.nome);
        if (!user) {
            console.log(`❌ ERRO: Nome "${p.nome}" não localizado. Nenhuma ação será tomada.`);
            return;
        }

        console.log(`✅ Localizado: ${user.name} (ID: ${user.id || user.idUser})`);
        await sincronizar(p, user);

        await supabase.from('prestadores').update({ integrated_id_control: true, id_control_id: user.id || user.idUser, data_integracao: new Date() }).eq('id', p.id);
        console.log(`✨ SUCESSO na sincronização por nome!`);
    } catch (e) { console.error(`❌ ${e.message}`); }
}

main();
