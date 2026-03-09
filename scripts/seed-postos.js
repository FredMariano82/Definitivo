const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedPostos() {
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

    for (const posto of postosIniciais) {
        const { data, error } = await supabase
            .from('op_postos')
            .insert([posto])
            .select()

        if (error) {
            console.error(`Erro ao inserir ${posto.nome_posto}:`, error.message)
        } else {
            console.log(`Sucesso: Posto ${posto.nome_posto} criado.`)
        }
    }
}

seedPostos()
