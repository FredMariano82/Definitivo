const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
    console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const dvrs = [
    { nome: 'After 1' },
    { nome: 'After 2' },
    { nome: 'Angelina 1' },
    { nome: 'Angelina 2' },
    { nome: 'Almoxarifado' },
    { nome: 'Audio & Luz' },
    { nome: 'Bar da Piscina' },
    { nome: 'Bar Do Tênis' },
    { nome: 'Beach Tênis' },
    { nome: 'Berçario Angelina' },
    { nome: 'Bico' },
    { nome: 'Casa' },
    { nome: 'Central' },
    { nome: 'C.J 1' },
    { nome: 'C.J 2' },
    { nome: 'Centro de Lutas' },
    { nome: 'Centro de música' },
    { nome: 'Centro Civico 1 Sala Chefia Externa' },
    { nome: 'Centro Civico 2 Sala Chefia Internas' },
    { nome: 'Centro Civico 3 Entrada Alceu' },
    { nome: 'Chapeira' },
    { nome: 'Diversos' },
    { nome: 'Espaço Hebra' },
    { nome: 'Fit Center 1' },
    { nome: 'Fit Center 2' },
    { nome: 'Fisioterapia' },
    { nome: 'Fresto' },
    { nome: 'Ginastica Artistica' },
    { nome: 'Hungria 1' },
    { nome: 'Hungria 2' },
    { nome: 'Locker Piscina' },
    { nome: 'Maternal 1 Rack Sala 07' },
    { nome: 'Maternal 2 Rack Sala 07' },
    { nome: 'Maternal 3 Sala 05' },
    { nome: 'Merkas' },
    { nome: 'Mitzpe' },
    { nome: 'Patrimonio' },
    { nome: 'Passarela Tênis' },
    { nome: 'Piscina' },
    { nome: 'Poli Esportivo' },
    { nome: 'Presidencia' },
    { nome: 'Presidente' },
    { nome: 'Refeitorio' },
    { nome: 'Tênis' },
    { nome: 'Tesouraria / Agenda' },
    { nome: 'T.I' }
];

async function seedDvrs() {
    console.log('🌱 Populando lista de DVRs...');
    
    const { error } = await supabase
        .from('cftv_dvrs')
        .upsert(dvrs, { onConflict: 'nome' });

    if (error) {
        console.error('❌ Erro ao popular DVRs:', error.message);
        if (error.code === '42P01') {
            console.error('DICA: A tabela "cftv_dvrs" ainda não existe. Execute o script SQL no seu Dashboard do Supabase primeiro.');
        }
    } else {
        console.log('✅ Lista de DVRs populada com sucesso!');
    }
}

seedDvrs();
