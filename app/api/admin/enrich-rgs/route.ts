import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import https from 'https';

const ID_CONTROL_URL = "192.168.100.20";
const ID_CONTROL_PORT = 30443;
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "123456789";

async function request(options: any, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

function normalizar(str: string) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
}

export async function POST(req: NextRequest) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        // 1. Login na API ID Control
        const login = await request({
            hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: '/api/login/', method: 'POST',
            headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
        }, { username: ID_CONTROL_USER, password: ID_CONTROL_PASS });

        const token = (login.data?.accessToken || login.data?.token || "").replace(/[\r\n]/g, '').trim();
        if (!token) {
            return NextResponse.json({ error: 'Falha na autenticação com ID Control.' }, { status: 500 });
        }

        // 2. Ler o arquivo
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (data.length <= 1) {
            return NextResponse.json({ error: 'Arquivo vazio ou sem dados.' }, { status: 400 });
        }

        // Tenta localizar a coluna de Nomes
        const headers = data[0];
        let nomeColIndex = -1;
        for(let i=0; i<headers.length; i++) {
            const h = String(headers[i] || "").toLowerCase();
            if (h.includes("nome") || h.includes("prestador") || h.includes("funcionario") || h.includes("pessoa")) {
                nomeColIndex = i;
                break;
            }
        }
        
        // Se não achou por nome, assume a primeira coluna (0)
        if (nomeColIndex === -1) {
            console.log("⚠️ Coluna de nome não identificada pelo header. Usando coluna 0.");
            nomeColIndex = 0;
        } else {
            console.log(`✅ Coluna de nome identificada no índice ${nomeColIndex} (${headers[nomeColIndex]})`);
        }

        // Adicionar header "RG_ENCONTRADO" se não existir
        let rgColIndex = headers.indexOf('RG_ENCONTRADO');
        if (rgColIndex === -1) {
            rgColIndex = headers.length;
            headers.push('RG_ENCONTRADO');
        }

        // 3. Cruzamento de dados (Busca por Nome)
        console.log(`🚀 Iniciando enriquecimento para ${data.length - 1} linhas...`);
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const nomeOriginal = row[nomeColIndex];
            if (!nomeOriginal) {
                row[rgColIndex] = "Sem nome";
                continue;
            }

            const nomeParaBusca = String(nomeOriginal).trim();
            
            try {
                // Busca na API (aumentado length para 50 para maior precisão)
                const searchUrl = `/api/user/list?idType=0&deleted=false&start=0&length=50&search%5Bvalue%5D=${encodeURIComponent(nomeParaBusca)}&search%5Bregex%5D=false&filterCol=name&inactive=0&blacklist=0`;
                const res = await request({
                    hostname: ID_CONTROL_URL, port: ID_CONTROL_PORT, path: searchUrl, method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    rejectUnauthorized: false
                });

                const items = res.data?.data || res.data?.content || [];
                const normNomeOriginal = normalizar(nomeParaBusca);
                
                // Lógica de match idêntica ao script manual de sucesso
                const match = items.find((u: any) => {
                    const nUser = normalizar(u.name);
                    return nUser === normNomeOriginal || nUser.includes(normNomeOriginal) || normNomeOriginal.includes(nUser);
                });

                if (match) {
                    const rgValue = match.rg || match.document;
                    row[rgColIndex] = rgValue ? rgValue : "Encontrado, mas sem RG";
                    console.log(`   ✅ [${i}/${data.length-1}] ${nomeParaBusca} -> ${row[rgColIndex]}`);
                } else {
                    row[rgColIndex] = "Não localizado";
                    console.log(`   ❌ [${i}/${data.length-1}] ${nomeParaBusca} -> Não localizado`);
                }
            } catch (err: any) {
                console.error(`   🛑 Erro na linha ${i} (${nomeParaBusca}):`, err.message);
                row[rgColIndex] = "Erro na busca";
            }
            
            // Throttling ligeiramente ajustado
            if (i % 20 === 0) await new Promise(r => setTimeout(r, 50));
        }

        console.log("✨ Enriquecimento concluído com sucesso via Painel.");

        // 4. Devolver arquivo atualizado
        const newWorksheet = XLSX.utils.aoa_to_sheet(data);
        workbook.Sheets[sheetName] = newWorksheet;
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="enriquecido_RGs_${new Date().getTime()}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error: any) {
        console.error('Erro no enriquecimento:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
