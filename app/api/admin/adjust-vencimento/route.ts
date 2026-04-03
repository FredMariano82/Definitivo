import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

// Função para formatar nomes para Title Case preservando acentos e lidando com preposições
function toTitleCase(str: string) {
  if (!str) return ""
  const prepositions = ["da", "de", "do", "das", "dos", "e"]
  return str
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Se for preposição no meio do nome, mantém minúscula
      if (prepositions.includes(word) && index !== 0) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
}

// Função para somar 6 meses com segurança
function add6Months(dateStr: any) {
    if (!dateStr) return null;
    
    let date: Date;
    
    // Tenta converter de string DD/MM/YYYY
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number);
        date = new Date(year, month - 1, day);
    } else if (typeof dateStr === 'number') {
        // Data serial do Excel
        const parsed = XLSX.SSF.parse_date_code(dateStr);
        date = new Date(parsed.y, parsed.m - 1, parsed.d);
    } else {
        date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return dateStr; // Retorna original se falhar

    const currentMonth = date.getMonth();
    date.setMonth(date.getMonth() + 6);
    
    // Ajuste para meses com menos dias (ex: 31 de agosto + 6 meses não deve ser 2 de março)
    if (date.getMonth() !== (currentMonth + 6) % 12) {
        date.setDate(0);
    }

    // Retorna no formato DD/MM/YYYY
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as Blob

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })
    
    // HEURÍSTICA À PROVA DE FALHAS PARA ENCONTRAR A ABA CORRETA
    let targetSheetName = workbook.SheetNames[0];
    let maxScore = -1;
    let maxRows = -1;

    for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const jsonPreview = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        
        let score = 0;
        const rowCount = jsonPreview.length;
        
        // Analisa as primeiras 10 linhas em busca de palavras-chave típicas de cabeçalho
        const rowsToCheck = Math.min(10, rowCount);
        for (let i = 0; i < rowsToCheck; i++) {
            const row: any = jsonPreview[i];
            if (Array.isArray(row)) {
                const rowStr = row.join(" ").toLowerCase();
                if (rowStr.includes("checagem")) score += 10;
                if (rowStr.includes("nome")) score += 5;
                if (rowStr.includes("rg") || rowStr.includes("cpf")) score += 5;
                if (rowStr.includes("prestador") || rowStr.includes("colaborador")) score += 5;
            }
        }

        // Se encontrou palavras-chave, prefere esta aba
        if (score > maxScore) {
            maxScore = score;
            targetSheetName = name;
        } 
        // Desempate: se nenhuma tem palavras-chave (score 0), pega a que tem mais linhas
        else if (score === 0 && maxScore === 0 && rowCount > maxRows) {
            maxRows = rowCount;
            targetSheetName = name;
        }
    }

    const worksheet = workbook.Sheets[targetSheetName]

    // Converter para JSON para facilitar manipulação
    // Defino defval como vazio para evitar campos undefined
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

    // Processar cada linha
    const processedData = data.map((row: any) => {
      const newRow: any = {}

      // Iterar por todas as chaves (colunas)
      Object.keys(row).forEach((key) => {
        let val = row[key]

        // 1. Limpar formatação e nomes (Assumindo que nomes estão em colunas com 'nome' ou similar)
        if (typeof val === "string") {
            // Se a coluna parece conter nomes (Ex: Nome, Prestador, Funcionario)
            if (key.toLowerCase().includes("nome") || key.toLowerCase().includes("prestador")) {
                val = toTitleCase(val.trim())
            } else {
                val = val.trim()
            }
        }

        // 2. Ajustar Data na Coluna de Checagem independentemente da posição
        if (key.toLowerCase().includes("checagem")) {
            val = add6Months(val)
        }

        newRow[key] = val
      })

      return newRow
    })

    // Gerar novo Workbook (limpo)
    const newWorksheet = XLSX.utils.json_to_sheet(processedData)
    const newWorkbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Ajustado")

    const outputBuffer = XLSX.write(newWorkbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Ajustado_Vencimento_6Meses.xlsx"',
      },
    })
  } catch (error: any) {
    console.error("Erro no ajuste de vencimento:", error)
    return NextResponse.json({ error: "Falha ao processar arquivo: " + error.message }, { status: 500 })
  }
}
