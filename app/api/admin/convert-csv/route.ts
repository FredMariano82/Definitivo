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

function removeAccents(str: string) {
    if (typeof str !== 'string') return str;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        // Ler como Latin1 para evitar problemas de acento do CSV (comum em arquivos brasileiros)
        const decoder = new TextDecoder('iso-8859-1');
        const content = decoder.decode(buffer);

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
                    // Se for a coluna de nome (ajustar conforme o CSV real, geralmente coluna 2 ou 3)
                    // No script anterior era cols[2] (índice 2)
                    if (cellIndex === 2 || cellIndex === 0) { // Tentativa heurística
                         return toTitleCase(removeAccents(cell.trim()));
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
