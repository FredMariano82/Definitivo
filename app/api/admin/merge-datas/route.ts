import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

function normalizar(str: any) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
}

function somar6Meses(dataOrigem: any) {
  if (!dataOrigem) return ""
  try {
    let dataObj: Date
    if (dataOrigem instanceof Date) {
      dataObj = dataOrigem
    } else if (typeof dataOrigem === 'string') {
      const partes = dataOrigem.split(/[\/\-]/)
      if (partes.length === 3) {
        if (partes[0].length === 4) dataObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
        else dataObj = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]))
      } else {
        dataObj = new Date(dataOrigem)
      }
    } else {
      return dataOrigem
    }

    if (isNaN(dataObj.getTime())) return dataOrigem
    
    // Somar 6 meses
    const novaData = new Date(dataObj)
    novaData.setMonth(novaData.getMonth() + 6)
    
    // Formatar como DD/MM/YYYY para manter o padrão visual do usuário
    const dia = String(novaData.getDate()).padStart(2, '0')
    const mes = String(novaData.getMonth() + 1).padStart(2, '0')
    const ano = novaData.getFullYear()
    return `${dia}/${mes}/${ano}`
  } catch (e) {
    return dataOrigem
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const rawFile1 = formData.get("file1") as Blob 
    const rawFile2 = formData.get("file2") as Blob 

    if (!rawFile1 || !rawFile2) {
      return NextResponse.json({ error: "Ambos os arquivos são necessários." }, { status: 400 })
    }

    const wb1 = XLSX.read(await rawFile1.arrayBuffer(), { type: "buffer", cellDates: true })
    const wb2 = XLSX.read(await rawFile2.arrayBuffer(), { type: "buffer", cellDates: true })

    const findBestData = (wb: XLSX.WorkBook) => {
        for (const name of wb.SheetNames) {
            if (normalizar(name).includes("resumo")) continue
            const sheetData: any[] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" })
            if (sheetData.length === 0) continue
            const keys = Object.keys(sheetData[0]).map(k => normalizar(k))
            if (keys.some(k => k.includes("nome") || k.includes("prest") || k.includes("pesso") || k.includes("usuario"))) return sheetData
        }
        return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" })
    }

    const data1 = findBestData(wb1)
    const data2 = findBestData(wb2)

    const n1 = data1.length > 0 ? Object.keys(data1[0]).map(k => normalizar(k)) : []
    const n2 = data2.length > 0 ? Object.keys(data2[0]).map(k => normalizar(k)) : []

    const temDatasID = (keys: string[]) => keys.some(k => k.includes("data") && (k.includes("ini") || k.includes("fim")))

    let dataADM: any[] = []
    let dataID: any[] = []

    if (temDatasID(n1) && !temDatasID(n2)) { dataID = data1; dataADM = data2 }
    else if (temDatasID(n2) && !temDatasID(n1)) { dataID = data2; dataADM = data1 }
    else { dataADM = data1; dataID = data2 }

    // Mapa ID Control
    const mapaID = new Map()
    dataID.forEach((row: any) => {
      let nome = "", dIni = "", dFin = ""
      Object.keys(row).forEach(key => {
        const kn = normalizar(key)
        if ((kn.includes("nome") || kn.includes("usuario") || kn.includes("prest")) && !nome) nome = row[key]
        if (kn.includes("data") && kn.includes("ini")) dIni = row[key]
        if (kn.includes("data") && kn.includes("fin")) dFin = row[key]
      })
      if (nome) mapaID.set(normalizar(nome), { dIni, dFin })
    })

    // Processamento da ADM: Cruzamento + Soma de 6 Meses
    const resultado = dataADM.map((row: any) => {
      let nomeADM = ""
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'string') row[key] = row[key].trim()
        const kn = normalizar(key)
        
        // 1. Identificar Nome
        if ((kn.includes("nome") || kn.includes("prest") || kn.includes("usuario")) && !nomeADM) nomeADM = row[key]
        
        // 2. SE FOR COLUNA CHECAGEM, SOMAR 6 MESES
        if (kn === "checagem") {
            row[key] = somar6Meses(row[key])
        }
      })

      // 3. Cruzar com ID CONTROL
      if (nomeADM) {
        const match = mapaID.get(normalizar(nomeADM))
        if (match) {
          if (match.dIni) row["DATA INICIAL"] = match.dIni
          if (match.dFin) row["DATA FINAL"] = match.dFin
        }
      }
      return row
    })

    const newWs = XLSX.utils.json_to_sheet(resultado)
    const newWb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(newWb, newWs, "ADM_Final")
    const out = XLSX.write(newWb, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Planilha_Sincronizada_Full.xlsx"',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
