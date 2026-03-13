const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
    console.log("🚀 Restaurando Equipe Completa (Operacional v2)...")

    const equipe = [
        { re: "21338", nome_completo: "Aldo Cleiton", funcao: "Vspp Inspetor", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "24290", nome_completo: "Cauã Mantovani", funcao: "VSPP", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "21336", nome_completo: "Cláudio Tagavas de Souza", funcao: "VSPP Coordenador", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "67980", nome_completo: "David Silva", funcao: "Op. Monitoramento", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "22099", nome_completo: "Diego Santos", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "27307", nome_completo: "Diomisio Francisco do Amaral", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "21339", nome_completo: "Edson Araújo", funcao: "Vspp Inspetor", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "27128", nome_completo: "Edmar Viana", funcao: "VSPP", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "165461", nome_completo: "Fábio Santos", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "21638", nome_completo: "Francisco Clodoaldo de Oliveira", funcao: "VSPP", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "22029", nome_completo: "Gean de Souza Silva", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "21337", nome_completo: "Gilberto Lucas de Sales", funcao: "VSPP Coordenador", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "22700", nome_completo: "Guilherme Silva", funcao: "VSPP", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "21882", nome_completo: "Isabela Santana", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "23710", nome_completo: "Icaro Santana da Conceição", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "23843", nome_completo: "Jefferson Milanesi", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "23204", nome_completo: "Joanes Santos", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "27299", nome_completo: "José Alves", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "21785", nome_completo: "Jonathan Santos", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "22866", nome_completo: "Lindevaldo Martins da Silva", funcao: "VSPP", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "68317", nome_completo: "Luiz Fernando Martins", funcao: "Op. Monitoramento", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "56996", nome_completo: "Marcus Vinícius Mariano", funcao: "Op. Monitoramento", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "25552", nome_completo: "Marta Natalia Pessoa", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "23788", nome_completo: "Marcio Moreira", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "26583", nome_completo: "Nadja Edileusa de moras Candido", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "23181", nome_completo: "Rodrigo Santos", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "24231", nome_completo: "Rodrigo Santos Siqueira", funcao: "VSPP", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "50723", nome_completo: "Ruth Perez Pereira Sioji", funcao: "Assistente Administrativo", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "50770", nome_completo: "Suelen Prado", funcao: "Op. Monitoramento", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "50729", nome_completo: "Tatiana Araujo Rocha", funcao: "Assistente Administrativo", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "25527", nome_completo: "Thais da Silva Leme", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        { re: "21347", nome_completo: "Tiago de Lima Alexandre", funcao: "Vspp Inspetor", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "21348", nome_completo: "Thiago Guimarães", funcao: "Vspp Inspetor", tipo_escala: "12x36", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "16552", nome_completo: "Warlen Venturini Candido", funcao: "Vigilante", tipo_escala: "12x36", referencia_escala: "2026-03-01" },
        
        { re: "24867", nome_completo: "Carlos Alberto da Silva", funcao: "Vspp", tipo_escala: "5x1", referencia_escala: "2026-03-01", possui_porte_arma: true },
        { re: "22348", nome_completo: "Diego Nascimento", funcao: "Vigilante", tipo_escala: "5x1", referencia_escala: "2026-03-01" },
        { re: "25858", nome_completo: "Patrick Albuquerque", funcao: "VSPP", tipo_escala: "5x1", referencia_escala: "2026-03-01" },
        { re: "26157", nome_completo: "Willians Junior", funcao: "Vigilante", tipo_escala: "5x1", referencia_escala: "2026-03-01" },

        { re: "50710", nome_completo: "Marcus Vinícius de Oliveira Silva", funcao: "Técnico CFTV", tipo_escala: "5x2", referencia_escala: "2026-03-01" }
    ]

    console.log(`📦 Injetando ${equipe.length} colaboradores...`)
    
    // Limpar equipe atual antes de reinjetar (para evitar duplicidade no RE)
    await supabase.from('op_equipe').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { error } = await supabase.from('op_equipe').insert(equipe)
    
    if (error) {
        console.error("❌ Erro ao injetar equipe:", error.message)
    } else {
        console.log("✅ Equipe completa restaurada com sucesso!")
    }
}

seedData();
