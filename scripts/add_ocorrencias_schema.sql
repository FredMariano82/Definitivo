-- Tabela: op_ocorrencias (Histórico de Prontuário)
CREATE TABLE IF NOT EXISTS op_ocorrencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- 'Falta', 'Atestado', 'Troca', 'Folga Extra'
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    motivo TEXT,
    registrado_por TEXT, -- Nome do operador que registrou
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE op_ocorrencias ENABLE ROW LEVEL SECURITY;

-- Política de Acesso Total
CREATE POLICY "Acesso Total Ocorrencias" ON op_ocorrencias FOR ALL USING (true) WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE op_ocorrencias IS 'Armazena o histórico de ocorrências e justificativas dos profissionais (Prontuário).';
