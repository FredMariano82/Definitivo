import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase Client (Service Role for Admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Utility to normalize strings for comparison
function normalizar(str: any) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
}

// Utility to find column by keywords
function buscarColuna(linha: any, keywords: string[]): string | undefined {
  const keys = Object.keys(linha);
  for (const k of keys) {
    const kn = normalizar(k);
    if (keywords.some(kw => kn === kw || kn.includes(kw))) return k;
  }
  return undefined;
}

// Utility to parse Excel dates correctly
function formatarDataDoExcel(valorExcel: any): string | null {
  if (!valorExcel) return null;
  // Se for número (serial do Excel)
  if (typeof valorExcel === 'number') {
    const dataJs = new Date(Math.round((valorExcel - 25569) * 86400 * 1000));
    const dia = String(dataJs.getUTCDate()).padStart(2, '0');
    const mes = String(dataJs.getUTCMonth() + 1).padStart(2, '0');
    const ano = dataJs.getUTCFullYear();
    return `${ano}-${mes}-${dia}`;
  }
  
  // Se for string DD/MM/YYYY
  if (typeof valorExcel === 'string') {
    const parts = valorExcel.substring(0, 10).split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`; // Já YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY -> YYYY-MM-DD
    }
  }
  
  return null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Leitura do Arquivo na Memória e Localização Inteligente da Aba
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    
    // HEURÍSTICA: Procurar a aba correta ignorando abas 'Resumo' ou vazias
    const findBestData = (wb: xlsx.WorkBook) => {
        for (const name of wb.SheetNames) {
            if (normalizar(name).includes("resumo")) continue
            const sheetData: any[] = xlsx.utils.sheet_to_json(wb.Sheets[name], { defval: "" })
            if (sheetData.length === 0) continue
            const keys = Object.keys(sheetData[0]).map(k => normalizar(k))
            if (keys.some(k => k.includes("nome") || k.includes("prest") || k.includes("usuario") || k.includes("rg"))) {
                return sheetData;
            }
        }
        return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }); // Fallback
    }

    // Converte para JSON usando a melhor aba encontrada
    const jsonData = findBestData(workbook);
    
    // Debug robusto em arquivo
    const debugInfo = {
      timestamp: new Date().toISOString(),
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      totalLinhas: (jsonData as any[]).length,
      colunas: (jsonData as any[]).length > 0 ? Object.keys(jsonData[0] as any) : [],
      primeiraLinha: (jsonData as any[]).length > 0 ? jsonData[0] : null
    };
    fs.writeFileSync(path.join(process.cwd(), 'import_debug.log'), JSON.stringify(debugInfo, null, 2));

    const prestadoresParaUpsert: any[] = [];
    let ignorados = 0;

    for (const linha of jsonData as any[]) {
      const colNome = buscarColuna(linha, ["nome", "prest", "usuario"]);
      const colRG = buscarColuna(linha, ["rg", "doc", "documento"]) || buscarColuna(linha, ["rg id control"]);
      const colEmpresa = buscarColuna(linha, ["empresa", "cia", "corp"]);
      const colChecagem = buscarColuna(linha, ["checa"]);

      const nome = colNome ? linha[colNome]?.toString().trim() : "";
      const rgRaw = colRG ? linha[colRG]?.toString().trim() : "";
      const rgLimpo = rgRaw.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
      const empresa = colEmpresa ? linha[colEmpresa]?.toString().trim() : "";
      const dataChecagem = colChecagem ? formatarDataDoExcel(linha[colChecagem]) : null;

      if (!nome || !rgLimpo) {
        ignorados++;
        continue;
      }

      prestadoresParaUpsert.push({
        doc1: rgLimpo,
        nome: nome,
        empresa: empresa,
        checagem_valida_ate: dataChecagem,
        checagem: dataChecagem ? 'aprovado' : 'base',
        data_avaliacao: dataChecagem ? new Date().toISOString() : null,
        aprovado_por: dataChecagem ? "Importação (Excel)" : null,
        liberacao: 'pendente'
      });
    }

    console.log(`🚀 Buscando ADMIN responsável para o vínculo...`);

    // 🎯 PASSO 1: BUSCAR UM USUÁRIO ADMIN PARA SER O "DONO" DA CARGA
    const { data: usuarioAdmin, error: errorUser } = await supabase
      .from('usuarios')
      .select('id')
      .or('perfil.eq.superadmin,perfil.eq.admin')
      .limit(1)
      .single();

    if (errorUser || !usuarioAdmin) {
      console.error("❌ Erro ao localizar administrador para o vínculo:", errorUser);
      throw new Error("Não foi possível localizar um administrador responsável para a carga massiva.");
    }

    const idAdmin = usuarioAdmin.id;

    // 🎯 NOVO: EXTRAIR DATAS DA PRIMEIRA LINHA VÁLIDA PARA A SOLICITAÇÃO MESTRE
    const colIni = buscarColuna(jsonData[0], ["inicial", "inicio", "ini"]);
    const colFim = buscarColuna(jsonData[0], ["final", "fim", "fin"]);
    
    const dataIniExtraida = colIni ? formatarDataDoExcel(jsonData[0][colIni]) : null;
    const dataFimExtraida = colFim ? formatarDataDoExcel(jsonData[0][colFim]) : null;
    const hojeISO = new Date().toISOString().split('T')[0];

    console.log(`🚀 Criando SOLICITAÇÃO MESTRE (Dono: ${idAdmin}) para o Lote de ${prestadoresParaUpsert.length} nomes...`);

    // 🎯 PASSO 2: CRIAR SOLICITAÇÃO MESTRE (CONTÊINER) COM AS DATAS DO EXCEL
    const { data: solMestre, error: errorSol } = await supabase
      .from('solicitacoes')
      .insert({
        numero: `LIB-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`,
        solicitante: "Processamento Automático (Botão 5)",
        departamento: "ADM",
        usuario_id: idAdmin,
        data_solicitacao: hojeISO,
        hora_solicitacao: new Date().toTimeString().split(' ')[0],
        tipo_solicitacao: "checagem_liberacao",
        finalidade: "obra",
        local: "Cadastro de Biblioteca (Massa)",
        empresa: "MÚLTIPLAS EMPRESAS",
        data_inicial: dataIniExtraida || hojeISO, // 📅 Tenta pegar do Excel, se não tiver usa HOJE
        data_final: dataFimExtraida || new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0], // 📅 Se não tiver, usa +6 meses
        status_geral: "base",
        custo_checagem: 0,
        economia_gerada: 0
      })
      .select()
      .single();

    if (errorSol) {
      console.error("❌ Erro ao criar Solicitação Mestre:", errorSol);
      throw errorSol;
    }

    const idSolicitacaoMestre = solMestre.id;

    // 🎯 PASO 2: VINCULAR PRESTADORES À SOLICITAÇÃO MESTRE
    const prestadoresComChave = prestadoresParaUpsert.map(p => ({
      ...p,
      solicitacao_id: idSolicitacaoMestre
    }));

    console.log(`🚀 Iniciando INSERT de ${prestadoresComChave.length} registros com CHAVE ${idSolicitacaoMestre}...`);

    // 🔥 REMOVIDO ON CONFLICT PORQUE O BANCO NÃO TEM INDEX UNIQUE NO DOC1
    const { data: upsertResult, error: upsertError } = await supabase
      .from('prestadores')
      .insert(prestadoresComChave);

    if (upsertError) {
      console.error("❌ Erro no UPSERT em lote:", upsertError);
      throw upsertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Importação Concluída! ${prestadoresComChave.length} nomes vinculados à solicitação ${solMestre.numero}.`,
      importados: prestadoresComChave.length,
      solicitacao: solMestre.numero
    });

  } catch (error: any) {
    console.error("💥 ERRO GERAL NO IMPORT-DB:", error);
    
    // Log detalhado para o arquivo na raiz
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message || error,
      details: error.details || "Sem detalhes",
      hint: error.hint || "Sem dicas",
      code: error.code || "Sem código",
      stack: error.stack
    };
    
    try {
      require('fs').writeFileSync('import_error_detail.log', JSON.stringify(errorLog, null, 2));
    } catch (e) {
      console.error("Falha ao gravar arquivo de log:", e);
    }

    return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
  }
}
