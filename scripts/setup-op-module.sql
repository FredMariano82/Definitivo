-- Tabela: op_equipe
CREATE TABLE op_equipe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    re TEXT,
    nome_completo TEXT NOT NULL,
    funcao TEXT NOT NULL,
    tipo_escala TEXT NOT NULL,
    data_base_calculo DATE,
    status_ativo BOOLEAN DEFAULT true,
    possui_porte_arma BOOLEAN DEFAULT false,
    possui_cnh BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela: op_postos
CREATE TABLE op_postos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_posto TEXT NOT NULL,
    exige_armamento BOOLEAN DEFAULT false,
    exige_cnh BOOLEAN DEFAULT false,
    nivel_criticidade INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela: op_escala_diaria
CREATE TABLE op_escala_diaria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
    data_plantao DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    status_dia TEXT NOT NULL, -- "Trabalhando", "Folga", "Falta", "Férias"
    posto_id UUID REFERENCES op_postos(id) ON DELETE SET NULL,
    tipo_plantao TEXT DEFAULT 'Normal', -- "Normal", "FT (Folga Trabalhada)", etc
    evento_id UUID,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela: op_rodizio_pausas (Para o Elástico de Rendições em breve)
CREATE TABLE op_rodizio_pausas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escala_diaria_id UUID REFERENCES op_escala_diaria(id) ON DELETE CASCADE,
    posto_rendido_id UUID REFERENCES op_postos(id) ON DELETE CASCADE,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    tipo_pausa TEXT NOT NULL, -- "Almoço", "Janta", "Café", "Banheiro"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Configurando RLS (Permitindo acesso anônimo/autenticado temporariamente para testes)
ALTER TABLE op_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE op_postos ENABLE ROW LEVEL SECURITY;
ALTER TABLE op_escala_diaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE op_rodizio_pausas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de equipe" ON op_equipe FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de equipe" ON op_equipe FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir deleção de equipe" ON op_equipe FOR DELETE USING (true);

CREATE POLICY "Permitir leitura de postos" ON op_postos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de postos" ON op_postos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir deleção de postos" ON op_postos FOR DELETE USING (true);

CREATE POLICY "Permitir leitura de escala" ON op_escala_diaria FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de escala" ON op_escala_diaria FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir deleção de escala" ON op_escala_diaria FOR DELETE USING (true);

CREATE POLICY "Permitir update de escala" ON op_escala_diaria FOR UPDATE USING (true);
CREATE POLICY "Permitir leitura de rodizio" ON op_rodizio_pausas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de rodizio" ON op_rodizio_pausas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir deleção de rodizio" ON op_rodizio_pausas FOR DELETE USING (true);

-- Restrição de Unicidade
ALTER TABLE op_escala_diaria DROP CONSTRAINT IF EXISTS unique_colab_date;
ALTER TABLE op_escala_diaria ADD CONSTRAINT unique_colab_date UNIQUE (colaborador_id, data_plantao);
