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

    let totalImportados = 0;
    let totalErros = 0;

    for (const linha of jsonData as any[]) {
      try {
        // Detecção flexível de colunas
        const colNome = buscarColuna(linha, ["nome", "prest", "usuario"]);
        const colRG = buscarColuna(linha, ["rg", "doc", "documento"]) || buscarColuna(linha, ["rg id control"]);
        const colDataIni = buscarColuna(linha, ["inicial", "inicio", "ini"]);
        const colDataFim = buscarColuna(linha, ["final", "fim", "fin"]);
        const colChecagem = buscarColuna(linha, ["checa"]);

        const nome = colNome ? linha[colNome]?.toString().trim() : "";
        const rgRaw = colRG ? linha[colRG]?.toString().trim() : "";
        const rgLimpo = rgRaw.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
        
        if (!nome || !rgLimpo) {
          totalErros++;
          continue; 
        }

        // 1. EXTRAÇÃO DE DATAS DA PLANILHA
        const dataIni = colDataIni ? formatarDataDoExcel(linha[colDataIni]) : null;
        const dataFim = colDataFim ? formatarDataDoExcel(linha[colDataFim]) : null;
        const dataChecagem = colChecagem ? formatarDataDoExcel(linha[colChecagem]) : null;

        if (!dataIni && !dataFim && !dataChecagem) {
          totalErros++;
          continue; // Nada a atualizar
        }

        // 2. BUSCA DO PRESTADOR PELO NOME
        const nomeTratado = normalizar(nome);
        const partesNome = nomeTratado.split(' ');
        const primeiroNome = partesNome[0];
        const ultimoNome = partesNome.length > 1 ? partesNome[partesNome.length - 1] : '';
        const searchPattern = ultimoNome ? `%${primeiroNome}%${ultimoNome}%` : `%${primeiroNome}%`;

        const { data: prestadoresBusca, error: errBusca } = await supabase
          .from('prestadores')
          .select('id, nome, solicitacao_id')
          .ilike('nome', searchPattern)
          .order('criado_em', { ascending: false })
          .limit(1);

        if (errBusca || !prestadoresBusca || prestadoresBusca.length === 0) {
          totalErros++;
          continue; // Prestador não encontrado
        }

        const prestador = prestadoresBusca[0];

        // 3. ATUALIZAÇÃO DA CHECAGEM NO PRESTADOR (FILHO)
        if (dataChecagem) {
          const { error: errUpdPrest } = await supabase
            .from('prestadores')
            .update({ 
               checagem_valida_ate: dataChecagem,
               checagem: 'aprovado'
            })
            .eq('id', prestador.id);
          
          if (errUpdPrest) throw errUpdPrest;
        }

        // 4. ATUALIZAÇÃO DE DATA INICIAL E FINAL NA SOLICITAÇÃO (PAI)
        if (prestador.solicitacao_id && (dataIni || dataFim)) {
          const payloadUpdate: any = {};
          if (dataIni) payloadUpdate.data_inicial = dataIni;
          if (dataFim) payloadUpdate.data_final = dataFim;

          const { error: errUpdSol } = await supabase
            .from('solicitacoes')
            .update(payloadUpdate)
            .eq('id', prestador.solicitacao_id);
            
          if (errUpdSol) throw errUpdSol;
        }

        totalImportados++;
        
      } catch (err: any) {
        console.error("Erro na linha:", err);
        totalErros++;
        // Log do erro específico no arquivo
        const debugWithError = {
          ...debugInfo,
          errorNoLoop: err.message || err,
          stack: err.stack
        };
        fs.writeFileSync(path.join(process.cwd(), 'import_debug.log'), JSON.stringify(debugWithError, null, 2));
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Importação Concluída: ${totalImportados} linhas importadas, ${totalErros} erros (linhas em branco/inválidas).`,
      importados: totalImportados
    });

  } catch (error: any) {
    console.error("Erro geral no import-db:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
