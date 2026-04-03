-- Tabela: op_equipe (Cadastro de Colaboradores)
CREATE TABLE IF NOT EXISTS op_equipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    re TEXT UNIQUE NOT NULL,
    nome_completo TEXT NOT NULL,
    funcao TEXT NOT NULL DEFAULT 'Vigilante',
    tipo_escala TEXT NOT NULL DEFAULT '12x36', -- '12x36', '5x1', '5x2'
    referencia_escala DATE NOT NULL DEFAULT CURRENT_DATE, -- Data de início para o cálculo
    status_ativo BOOLEAN DEFAULT true,
    possui_porte_arma BOOLEAN DEFAULT false,
    possui_cnh BOOLEAN DEFAULT false,
    data_reciclagem DATE,
    data_inicio_ferias DATE,
    data_fim_ferias DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela: op_postos (Locais de Trabalho)
CREATE TABLE IF NOT EXISTS op_postos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_posto TEXT NOT NULL,
    exige_armamento BOOLEAN DEFAULT false,
    exige_cnh BOOLEAN DEFAULT false,
    nivel_criticidade INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela: op_escala_diaria (Exceções e Registros Ponto)
-- Esta tabela guarda apenas as MUDANÇAS na escala teórica (Faltas, Folgas extras, etc)
CREATE TABLE IF NOT EXISTS op_escala_diaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
    data_plantao DATE NOT NULL,
    status_dia TEXT NOT NULL DEFAULT 'Trabalhando', -- 'Trabalhando', 'Folga', 'Falta', 'Atestado'
    posto_id UUID REFERENCES op_postos(id) ON DELETE SET NULL,
    horario_inicio TIME DEFAULT '08:00',
    horario_fim TIME DEFAULT '20:00',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(colaborador_id, data_plantao)
);

-- Configurando RLS
ALTER TABLE op_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE op_postos ENABLE ROW LEVEL SECURITY;
ALTER TABLE op_escala_diaria ENABLE ROW LEVEL SECURITY;

-- Políticas Simples para Testagem
CREATE POLICY "Acesso Total Equipe" ON op_equipe FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Postos" ON op_postos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Escala" ON op_escala_diaria FOR ALL USING (true) WITH CHECK (true);
