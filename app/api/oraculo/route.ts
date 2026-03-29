import { NextResponse } from 'next/server'

// O Estatuto Social será injetado como contexto aqui. 
// Em uma versão futura (RAG), isso viria do banco de dados vetorial.
const ESTATUTO_CONTEXT = `
ESTATUTO SOCIAL DA ASSOCIAÇÃO BRASILEIRA A HEBRAICA DE SÃO PAULO (RESUMO OPERACIONAL)
- Objeto: Associação civil sem fins lucrativos, cultural, esportiva e social.
- Sócios: Categorias de Titulares, Dependentes, Convidados, etc.
- Governança: Assembléia Geral, Conselho Deliberativo e Diretoria Executiva.
- Eleições: Realizadas a cada 3 anos para o Conselho.
- Deveres: Respeitar as normas, pagar mensalidades, zelar pelo patrimônio.
- (O sistema usará esse contexto para responder dúvidas dos funcionários)
`

export async function POST(req: Request) {
    try {
        const { message } = await req.json()
        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
            return NextResponse.json({ 
                reply: "⚠️ O Oráculo ainda não foi configurado com uma Chave de API (GEMINI_API_KEY). Por favor, adicione a chave ao arquivo .env para começar a conversar." 
            })
        }

        // Chamada direta para a API do Gemini via Fetch (evita dependências pesadas)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Você é o Oráculo IA, um assistente inteligente do sistema de segurança e gestão. 
                        Use o contexto abaixo para responder perguntas de funcionários de forma profissional, clara e prestativa.
                        Se não souber a resposta com base no contexto, diga que não encontrou essa informação específica no Estatuto e sugira consultar a diretoria.
                        
                        CONTEXTO:
                        ${ESTATUTO_CONTEXT}
                        
                        PERGUNTA DO FUNCIONÁRIO:
                        ${message}`
                    }]
                }]
            })
        })

        const data = await response.json()
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar essa resposta no momento."

        return NextResponse.json({ reply })
    } catch (error) {
        console.error("Erro API Oráculo:", error)
        return NextResponse.json({ reply: "Erro técnico na comunicação com o Oráculo." }, { status: 500 })
    }
}
