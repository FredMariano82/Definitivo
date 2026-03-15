const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const postosFixos = [
    { nome_posto: "42 - Angelina", nivel_criticidade: 3, is_active: true, exige_armamento: false },
    { nome_posto: "41 - Bico", nivel_criticidade: 3, is_active: true, exige_armamento: false },
    { nome_posto: "25 - Alceu (1)", nivel_criticidade: 3, is_active: true, exige_armamento: false },
    { nome_posto: "25 - Alceu (2)", nivel_criticidade: 3, is_active: true, exige_armamento: false },
    { nome_posto: "25 - Alceu (3)", nivel_criticidade: 3, is_active: true, exige_armamento: false },
    { nome_posto: "43 - Hungria", nivel_criticidade: 3, is_active: true, exige_armamento: false },
    { nome_posto: "51 - Chapeira", nivel_criticidade: 3, is_active: true, exige_armamento: false },
    { nome_posto: "44 - Funcionários", nivel_criticidade: 3, is_active: true, exige_armamento: false }
];

async function setupPostos() {
    console.log("Iniciando configuração de postos fixos...");
    
    for (const posto of postosFixos) {
        const { data, error } = await supabase
            .from('op_postos')
            .upsert(posto, { onConflict: 'nome_posto' })
            .select();
        
        if (error) {
            console.error(`Erro ao inserir posto ${posto.nome_posto}:`, error.message);
        } else {
            console.log(`Posto configurado: ${posto.nome_posto}`);
        }
    }
    
    console.log("Configuração concluída.");
}

setupPostos();
