import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in environment.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- Criando Módulo Operacional ---');

    // 1. op_postos
    console.log('Criando tabela op_postos...');
    const { error: errPostos } = await supabase.rpc('execute_sql', {
        query: `
            CREATE TABLE IF NOT EXISTS op_postos (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                nome_posto TEXT NOT NULL,
                exige_armamento BOOLEAN DEFAULT false,
                exige_cnh BOOLEAN DEFAULT false,
                nivel_criticidade INTEGER DEFAULT 3,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `
    });
    if (errPostos) {
        console.error('Erro op_postos via RPC (ignorando se rpc não existir, tentaremos DDL direta).', errPostos.message);
    }

    // 2. op_equipe
    console.log('Criando tabela op_equipe...');
    const { error: errEquipe } = await supabase.rpc('execute_sql', {
        query: `
            CREATE TABLE IF NOT EXISTS op_equipe (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                re TEXT UNIQUE,
                nome_completo TEXT NOT NULL,
                funcao TEXT NOT NULL,
                tipo_escala TEXT NOT NULL,
                data_base_calculo DATE,
                status_ativo BOOLEAN DEFAULT true,
                possui_porte_arma BOOLEAN DEFAULT false,
                possui_cnh BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `
    });

    // 3. op_escala_diaria
    console.log('Criando tabela op_escala_diaria...');
    const { error: errDiaria } = await supabase.rpc('execute_sql', {
        query: `
            CREATE TABLE IF NOT EXISTS op_escala_diaria (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
                data_plantao DATE NOT NULL,
                horario_inicio TIME NOT NULL,
                horario_fim TIME NOT NULL,
                status_dia TEXT DEFAULT 'Trabalhando',
                posto_id UUID REFERENCES op_postos(id) ON DELETE SET NULL,
                observacoes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `
    });

    // 4. op_rodizio_pausas
    console.log('Criando tabela op_rodizio_pausas...');
    const { error: errPausas } = await supabase.rpc('execute_sql', {
        query: `
            CREATE TABLE IF NOT EXISTS op_rodizio_pausas (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                escala_id UUID REFERENCES op_escala_diaria(id) ON DELETE CASCADE,
                tipo_pausa TEXT NOT NULL,
                horario_inicio TIME NOT NULL,
                horario_fim TIME NOT NULL,
                rendicionista_id UUID REFERENCES op_equipe(id) ON DELETE SET NULL,
                status_pausa TEXT DEFAULT 'Pendente',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `
    });

    console.log('Criação enviada. Verifique no dashboard do Supabase.');
}

run();
