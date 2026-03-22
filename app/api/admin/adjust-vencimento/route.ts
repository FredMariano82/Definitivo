import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

// Função para formatar nomes para Title Case
function toTitleCase(str: string) {
  if (!str) return ""
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Função para remover acentos básicos (opcional, mas útil para normalização)
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Converter para JSON para facilitar manipulação
    // Defino defval como vazio para evitar campos undefined
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

    // Processar cada linha
    const processedData = data.map((row: any) => {
      const newRow: any = {}

      // Iterar por todas as chaves (colunas)
      Object.keys(row).forEach((key, index) => {
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

        // 2. Ajustar Data na Coluna D (Index 3 no Excel clássico, mas no JSON depende do header)
        // Se não houver header, o xlsx usa chaves como 'A', 'B', 'C', 'D' se configurado.
        // Como sheet_to_json usa a primeira linha como header, vamos procurar pela 4ª chave
        const colKeys = Object.keys(row)
        if (key === colKeys[3] || key === "D") {
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
