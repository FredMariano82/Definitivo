const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (com Service Role para não ter bloqueio de RLS)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function lerUltimaSolicitacao() {
    console.log("==================================================");
    console.log("🤖 ROBO 4 - ETAPA 1: LEITURA UNIVERSAL");
    console.log("==================================================");
    console.log("Buscando a última aprovação de acesso no banco de dados...\n");

    try {
        // Busca o ÚLTIMO prestador (mais recente) que tenha uma checagem "aprovada"
        // E traz os dados da solicitação "pai" junto (data inicial/final)
        const { data: prestadores, error } = await supabase
            .from('prestadores')
            .select('*, solicitacoes:solicitacao_id(numero, solicitante, data_inicial, data_final)')
            .in('checagem', ['aprovado', 'aprovada'])
            .order('criado_em', { ascending: false })
            .limit(1);

        if (error) {
            console.error("❌ Erro ao consultar o banco de dados:", error.message);
            return;
        }

        if (!prestadores || prestadores.length === 0) {
            console.log("⚠️ Nenhum prestador recém aprovado encontrado na tabela.");
            return;
        }

        const prestador = prestadores[0];
        const resSolicitacao = prestador.solicitacoes || {};
        const isArray = Array.isArray(resSolicitacao);
        const solValida = isArray ? resSolicitacao[0] : resSolicitacao;

        console.log(`✅ Registro encontrado com sucesso!`);
        console.log("--------------------------------------------------");
        console.log(`🔍 DADOS DO PRESTADOR`);
        console.log(`  ID (Supabase): ${prestador.id}`);
        console.log(`  Nome:          ${prestador.nome}`);
        console.log(`  Documento:     ${prestador.doc1}`);
        console.log(`  Empresa:       ${prestador.empresa || 'N/A'}`);
        console.log(`  Checagem:      ${prestador.checagem}`);

        console.log(`\n📅 DADOS DA SOLICITAÇÃO (PAI)`);
        console.log(`  Solicitação No: ${solValida?.numero || prestador.solicitacao_id}`);
        console.log(`  Solicitante:    ${solValida?.solicitante || 'N/A'}`);
        console.log(`  Data Inicial:   ${solValida?.data_inicial || prestador.data_inicial || 'N/A'}`);
        console.log(`  Data Final:     ${solValida?.data_final || prestador.data_final || 'N/A'}`);

        console.log("\n==================================================");
        console.log("FIM DA ETAPA 1 (LEITURA APENAS - NADA FOI ENVIADO)");
        console.log("==================================================");

    } catch (err) {
        console.error("❌ Erro fatal na execução do script:", err);
    }
}

lerUltimaSolicitacao();
