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
    console.log("Iniciando injeção de dados básicos...")

    // 1. Injetar Postos
    const postosIniciais = [
        { nome_posto: "25 - Entrada Principal", nivel_criticidade: 1, exige_armamento: true, exige_cnh: false },
        { nome_posto: "41 - Entrada Veículos Sócios", nivel_criticidade: 1, exige_armamento: true, exige_cnh: false },
        { nome_posto: "42 - Entrada Colégio Alef", nivel_criticidade: 2, exige_armamento: false, exige_cnh: false },
        { nome_posto: "43 - Entrada Hungria (Teatros)", nivel_criticidade: 2, exige_armamento: false, exige_cnh: false },
        { nome_posto: "51 - Chapeira / Eclusa Mat.", nivel_criticidade: 2, exige_armamento: false, exige_cnh: false },
        { nome_posto: "56 - Revista Eclusa Principal", nivel_criticidade: 2, exige_armamento: false, exige_cnh: false },
        { nome_posto: "57 - Revista Eclusa Estac.", nivel_criticidade: 2, exige_armamento: false, exige_cnh: false },
        { nome_posto: "44 - Entrada Func/Prestadores", nivel_criticidade: 3, exige_armamento: false, exige_cnh: false }
    ]

    console.log("Injetando postos...")
    for (const posto of postosIniciais) {
        const { error } = await supabase.from('op_postos').insert([posto])
        if (error) console.error(`Erro Posto ${posto.nome_posto}:`, error.message)
    }

    // 2. Injetar Equipe (baseado na planilha)
    const equipe = [
        { re: "21338", nome_completo: "Aldo Cleiton", funcao: "Vspp Inspetor", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "24290", nome_completo: "Cauã Mantovani", funcao: "VSPP", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "24867", nome_completo: "Carlos Alberto da Silva", funcao: "Vspp", tipo_escala: "5x1", possui_porte_arma: true, possui_cnh: false },
        { re: "21336", nome_completo: "Cláudio Tagavas de Souza", funcao: "VSPP Coordenador", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "67980", nome_completo: "David Silva", funcao: "Op. Monitoramento", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "22348", nome_completo: "Diego Nascimento", funcao: "Vigilante", tipo_escala: "5x1", possui_porte_arma: false, possui_cnh: false },
        { re: "22099", nome_completo: "Diego Santos", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "27307", nome_completo: "Diomisio Francisco do Amaral", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "21339", nome_completo: "Edson Araújo", funcao: "Vspp Inspetor", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "27128", nome_completo: "Edmar Viana", funcao: "VSPP", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "165461", nome_completo: "Fábio Santos", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "21638", nome_completo: "Francisco Clodoaldo de Oliveira", funcao: "VSPP", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "22029", nome_completo: "Gean de Souza Silva", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "21337", nome_completo: "Gilberto Lucas de Sales", funcao: "VSPP Coordenador", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "22700", nome_completo: "Guilherme Silva", funcao: "VSPP", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "21882", nome_completo: "Isabela Santana", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "23710", nome_completo: "Icaro Santana da Conceição", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "23843", nome_completo: "Jefferson Milanesi", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "23204", nome_completo: "Joanes Santos", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "27299", nome_completo: "José Alves", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "21785", nome_completo: "Jonathan Santos", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "22866", nome_completo: "Lindevaldo Martins da Silva", funcao: "VSPP", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "68317", nome_completo: "Luiz Fernando Martins", funcao: "Op. Monitoramento", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "56996", nome_completo: "Marcus Vinícius Mariano", funcao: "Op. Monitoramento", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "50710", nome_completo: "Marcus Vinícius de Oliveira Silva", funcao: "Técnico CFTV", tipo_escala: "5x2", possui_porte_arma: false, possui_cnh: false },
        { re: "25552", nome_completo: "Marta Natalia Pessoa", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "23788", nome_completo: "Marcio Moreira", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "26583", nome_completo: "Nadja Edileusa de moras Candido", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "25858", nome_completo: "Patrick Albuquerque", funcao: "VSPP", tipo_escala: "5x1", possui_porte_arma: true, possui_cnh: false },
        { re: "23181", nome_completo: "Rodrigo Santos", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "24231", nome_completo: "Rodrigo Santos Siqueira", funcao: "VSPP", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "50723", nome_completo: "Ruth Perez Pereira Sioji", funcao: "Assistente Administrativo", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "50770", nome_completo: "Suelen Prado", funcao: "Op. Monitoramento", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "50729", nome_completo: "Tatiana Araujo Rocha", funcao: "Assistente Administrativo", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "25527", nome_completo: "Thais da Silva Leme", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "21347", nome_completo: "Tiago de Lima Alexandre", funcao: "Vspp Inspetor", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "21348", nome_completo: "Thiago Guimarães", funcao: "Vspp Inspetor", tipo_escala: "12x36", possui_porte_arma: true, possui_cnh: false },
        { re: "16552", nome_completo: "Warlen Venturini Candido", funcao: "Vigilante", tipo_escala: "12x36", possui_porte_arma: false, possui_cnh: false },
        { re: "26157", nome_completo: "Willians Junior", funcao: "Vigilante folguista 5x1", tipo_escala: "5x1", possui_porte_arma: false, possui_cnh: false }
    ]

    console.log("Injetando equipe...")
    for (const membro of equipe) {
        const { error } = await supabase.from('op_equipe').insert([membro])
        if (error) console.error(`Erro Membro ${membro.nome_completo}:`, error.message)
    }

    console.log("Processo Finalizado!")
}

seedData();
