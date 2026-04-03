-- Tabela: op_pausas (Persistência de Timers e Estado de Pausa)
CREATE TABLE IF NOT EXISTS op_pausas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
    tipo_pausa TEXT NOT NULL, -- 'Café', 'Refeição', 'Janta', 'Ceia'
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    segundos_duracao INTEGER NOT NULL, -- Duração total em segundos
    posto_anterior_id UUID REFERENCES op_postos(id) ON DELETE SET NULL,
    encerrada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE op_pausas ENABLE ROW LEVEL SECURITY;

-- Política de Acesso Total (Seguindo o padrão atual do sistema)
CREATE POLICY "Acesso Total Pausas" ON op_pausas FOR ALL USING (true) WITH CHECK (true);

-- Índice para performance de busca por colaborador ativo
CREATE INDEX IF NOT EXISTS idx_op_pausas_colaborador_ativa ON op_pausas(colaborador_id) WHERE (encerrada = false);
