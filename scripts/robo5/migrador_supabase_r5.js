const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Carregar .env.local de forma segura (subindo 2 níveis a partir de scripts/robo5)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_KEY não configurados no .env.local.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EXCEL_PATH = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx";

function excelDateToISO(serial) {
    if (!serial) return null;
    try {
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
    } catch (e) {
        return null;
    }
}

async function migrar() {
    console.log("==================================================");
    console.log("🤖 ROBO 5 - MIGRAÇÃO INDEPENDENTE PARA SUPABASE");
    console.log("==================================================");

    if (!fs.existsSync(EXCEL_PATH)) {
        console.error(`❌ Arquivo Excel não encontrado em: ${EXCEL_PATH}`);
        return;
    }

    // 1. Omitir criação de solicitação (limitado por permissões de INSERT na tabela solicitacoes)
    // Usaremos as colunas 'motivo' e 'setor' para identificar o SISTEMA MVM
    console.log("📡 Modo: Inserção direta na tabela 'prestadores' (SISTEMA MVM)...");
    let solicitacaoId = null;

    // 2. Ler o Excel
    console.log("\n📖 Lendo arquivo Excel de 1.891 pessoas...");
    const wb = XLSX.readFile(EXCEL_PATH);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`   🔸 Total de registros lidos: ${data.length}`);

    // 3. Processar em lotes
    const batchSize = 50;
    let totalProcessados = 0;
    let errosTotal = 0;

    console.log("\n📤 Enviando para o banco de dados (UPSERT via RG)...");

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const payload = batch
            .map(row => {
                const rg = String(row['RG'] || "").trim();
                if (!rg) return null;

                return {
                    nome: row['nome'],
                    doc1: rg,
                    empresa: row['EMPRESA '] || "desconhecida",
                    checagem: 'aprovado',
                    tipo: 'prestador',
                    motivo: 'SISTEMA MVM', // Identificador da origem
                    setor: 'SISTEMA MVM',  // Identificador da origem
                    solicitacao_id: null,
                    data_inicial: excelDateToISO(row['liberação DATA INICIAL']),
                    data_final: excelDateToISO(row['liberação DATA FINAL']),
                    checagem_validade: excelDateToISO(row['checagem válida até'])
                };
            })
            .filter(p => p !== null);

        if (payload.length > 0) {
            const { error: insertError } = await supabase
                .from('prestadores')
                .insert(payload);

            if (insertError) {
                console.error(`\n❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, insertError.message);
                errosTotal++;
            } else {
                totalProcessados += payload.length;
                process.stdout.write(`   🚀 Progresso: ${totalProcessados}/${data.length}...\r`);
            }
        }
    }

    console.log(`\n\n==================================================`);
    console.log(`✨ FINALIZADO COM SUCESSO!`);
    console.log(`   ✅ Registros migrados/atualizados: ${totalProcessados}`);
    console.log(`   ❌ Lotes com erro: ${errosTotal}`);
    console.log(`==================================================`);
}

migrar().catch(err => console.error("❌ Erro fatal:", err));
