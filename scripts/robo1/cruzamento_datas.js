const fs = require('fs');
const xlsx = require('xlsx');
require('dotenv').config({ path: '../../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERRO: Faltando SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// FUNÇÕES AUXILIARES DE NORMALIZAÇÃO
// ==========================================
function normalizar(texto) {
  if (!texto) return "";
  return texto.toString().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizarDataExcel(dataBr) {
    if (!dataBr) return null;
    const parts = dataBr.split('/');
    if (parts.length === 3) {
        // Assume formato DD/MM/YYYY do Excel para string '2026-10-30'
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return null;
}

// ==========================================
// MÓDULO PRINCIPAL
// ==========================================
async function cruzarEAtualizar() {
  console.log("🚀 Iniciando Motor de Enriquecimento de Datas...");

  const arquivo = "dados_final.xlsx"; // Substitua pelo arquivo real
  if (!fs.existsSync(arquivo)) {
      console.log(`⚠️ Arquivo ${arquivo} não encontrado para leitura automática. Crie o arquivo ou altere o nome no script.`);
      return;
  }

  const workbook = xlsx.readFile(arquivo);
  const sheetName = workbook.SheetNames[0];
  const dados = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

  console.log(`📊 Encontradas ${dados.length} linhas na planilha. Buscando no Supabase...`);

  let atualizados = 0;
  let naoEncontrados = 0;

  for (const linha of dados) {
    // 1. Extrair Colunas. Ajuste o nome conforme o cabeçalho original da planilha!
    const nomeOriginal = linha['NOME'] || linha['Nome'] || linha['nome'];
    const dataInicialOriginal = linha['DATA INICIAL'] || linha['Data Inicial'];
    const dataFinalOriginal = linha['DATA FINAL'] || linha['Data Final'];
    const checagemOriginal = linha['CHECAGEM'] || linha['Checagem']; // Checagem aqui geralmente significa a Validade da Checagem

    if (!nomeOriginal) continue;

    const nomeTratado = normalizar(nomeOriginal);
    const dataInicial = normalizarDataExcel(dataInicialOriginal);
    const dataFinal = normalizarDataExcel(dataFinalOriginal);
    const checagemValidaAte = normalizarDataExcel(checagemOriginal);

    console.log(`\n🔍 Buscando Prestador: ${nomeOriginal}`);

    // 2. Buscar o Prestador no Supabase pelo NOME
    // Usamos ilike e curamos nomes compostos simplificados
    const { data: prestadores, error: errBusca } = await supabase
        .from('prestadores')
        .select('id, nome, solicitacao_id')
        .ilike('nome', `%${nomeTratado.split(' ')[0]}%${nomeTratado.split(' ')[nomeTratado.split(' ').length - 1]}%`)
        .limit(1);

    if (errBusca) {
        console.error(`  ❌ Erro ao buscar: ${errBusca.message}`);
        continue;
    }

    if (!prestadores || prestadores.length === 0) {
        console.log(`  🟡 Não encontrado no BD. Pode não ter sido cadastrado pelo SuperAdmin ainda.`);
        naoEncontrados++;
        continue;
    }

    const prestador = prestadores[0];
    console.log(`  ✅ Encontrado: ${prestador.nome} (ID: ${prestador.id})`);

    // 3. Injetar a Checagem na tabela prestadores
    if (checagemValidaAte) {
        const { error: errPrest } = await supabase
            .from('prestadores')
            .update({ checagem_valida_ate: checagemValidaAte })
            .eq('id', prestador.id);
        
        if (errPrest) console.error(`  ❌ Falha ao atualizar Checagem: ${errPrest.message}`);
        else console.log(`  🔄 Checagem inserida: ${checagemValidaAte}`);
    }

    // 4. Injetar Data Inicial e Data Final na tabela solicitacoes
    if (prestador.solicitacao_id && (dataInicial || dataFinal)) {
        const payloadUpdate = {};
        if (dataInicial) payloadUpdate.data_inicial = dataInicial;
        if (dataFinal) payloadUpdate.data_final = dataFinal;

        const { error: errSol } = await supabase
            .from('solicitacoes')
            .update(payloadUpdate)
            .eq('id', prestador.solicitacao_id);
        
        if (errSol) console.error(`  ❌ Falha ao atualizar Solicitação: ${errSol.message}`);
        else console.log(`  🔄 Datas de Solicitação inseridas (Ini: ${dataInicial}, Fim: ${dataFinal})`);
    }

    atualizados++;
  }

  console.log(`\n🎉 Processo Concluído!`);
  console.log(`✅ Registros Atualizados: ${atualizados}`);
  console.log(`⚠️ Registros Não Encontrados: ${naoEncontrados}`);
}

cruzarEAtualizar();
