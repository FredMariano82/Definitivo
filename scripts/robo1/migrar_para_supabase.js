const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const EXCEL_PATH = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx";

// Funções de utilidade
function excelDateToISO(serial) {
    if (!serial) return null;
    if (typeof serial === 'string') {
        const parts = serial.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
        }
        return new Date(serial).toISOString();
    }
    const utcepoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(utcepoch.getTime() + serial * 86400000);
    return d.toISOString();
}

async function migrar() {
    console.log("🚀 Iniciando migração para o Supabase...");

    // 1. Garantir a solicitação "PAI"
    console.log("📡 Garantindo existência da solicitação 'SISTEMA MVM'...");
    let solicitacaoId = null;

    const { data: existingSol, error: solError } = await supabase
        .from('solicitacoes')
        .select('id')
        .eq('solicitante', 'SISTEMA MVM')
        .limit(1);

    if (existingSol && existingSol.length > 0) {
        solicitacaoId = existingSol[0].id;
        console.log(`   ✅ Solicitação encontrada: ID ${solicitacaoId}`);
    } else {
        const { data: newSol, error: createError } = await supabase
            .from('solicitacoes')
            .insert([{
                solicitante: 'SISTEMA MVM',
                departamento: null,
                status: 'aprovada',
                data_inicial: new Date().toISOString(),
                data_final: '2026-12-31T23:59:59.000Z'
            }])
            .select();

        if (createError) {
            console.error("❌ Erro ao criar solicitação:", createError.message);
            return;
        }
        solicitacaoId = newSol[0].id;
        console.log(`   ✨ Solicitação criada: ID ${solicitacaoId}`);
    }

    // 2. Ler o Excel
    console.log("📖 Lendo arquivo Excel...");
    const wb = XLSX.readFile(EXCEL_PATH);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(`   📊 Total de registros no Excel: ${data.length}`);

    // 3. Preparar e Upsertar Prestadores em lotes
    const batchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const payload = batch.map(row => ({
            nome: row['nome'],
            doc1: String(row['RG'] || "").trim(),
            empresa: row['EMPRESA '],
            checagem: 'aprovado', // ou 'aprovada', conforme o banco aceitar
            tipo: 'prestador',
            solicitacao_id: solicitacaoId,
            data_inicial: excelDateToISO(row['liberação DATA INICIAL']),
            data_final: excelDateToISO(row['liberação DATA FINAL']),
            checagem_validade: excelDateToISO(row['checagem válida até'])
        })).filter(p => p.doc1); // Garantir que tem RG

        const { error: upsertError } = await supabase
            .from('prestadores')
            .upsert(payload, { onConflict: 'doc1' });

        if (upsertError) {
            console.error(`❌ Erro no lote ${i / batchSize + 1}:`, upsertError.message);
        } else {
            totalUpserted += payload.length;
            process.stdout.write(`   🚀 Progresso: ${totalUpserted}/${data.length}...\r`);
        }
    }

    console.log(`\n\n✨ MIGRAÇÃO CONCLUÍDA!`);
    console.log(`   ✅ Total de prestadores enviados/atualizados: ${totalUpserted}`);
}

migrar().catch(console.error);
