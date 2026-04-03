import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

function toTitleCase(str: string) {
    if (!str || typeof str !== 'string') return str;
    const particles = ['de', 'da', 'do', 'das', 'dos', 'e'];
    return str.toLowerCase().split(' ').map((word, index) => {
        if (word.length === 0) return word;
        if (index > 0 && particles.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        
        // --- LÓGICA DE DETECÇÃO AUTOMÁTICA DE ENCODING ---
        // 1. Tentar ler como UTF-8
        let decoder = new TextDecoder('utf-8', { fatal: true });
        let content = "";
        
        try {
            content = decoder.decode(buffer);
        } catch (e) {
            // 2. Se falhar (caracteres inválidos para UTF-8), usar ISO-8859-1 (Latin1)
            console.log("⚠️ Encoding UTF-8 falhou, tentando ISO-8859-1...");
            decoder = new TextDecoder('iso-8859-1');
            content = decoder.decode(buffer);
        }

        // Se o conteúdo ainda contiver caracteres de erro , tentar o fallback mesmo sem erro fatal
        if (content.includes('\uFFFD')) {
            console.log("⚠️ Caractere de erro  detectado em UTF-8, forçando ISO-8859-1...");
            decoder = new TextDecoder('iso-8859-1');
            content = decoder.decode(buffer);
        }

        // Parser simples de CSV (considerando vírgula como delimitador padrão)
        const lines = content.split(/\r?\n/);
        const data: any[][] = [];

        lines.forEach((line, index) => {
            if (!line.trim()) return;
            
            // Parser básico que lida com aspas (baseado no restore_and_fix.js)
            const row: string[] = [];
            let cur = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    row.push(cur);
                    cur = '';
                } else {
                    cur += char;
                }
            }
            row.push(cur);

            // Se for a primeira linha (header), mantemos os nomes das colunas originais
            if (index === 0) {
                data.push(row);
            } else {
                // Formatação para as linhas de dados
                const formattedRow = row.map((cell, cellIndex) => {
                    // Se for a coluna de nome (heurística para colunas textuais longas)
                    if (cell.trim().length > 3 && !cell.includes('@') && isNaN(Number(cell))) {
                         return toTitleCase(cell.trim());
                    }
                    return cell.trim().replace(/"/g, '');
                });
                data.push(formattedRow);
            }
        });

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="convertido_${file.name.replace('.csv', '')}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error: any) {
        console.error('Erro na conversão:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
