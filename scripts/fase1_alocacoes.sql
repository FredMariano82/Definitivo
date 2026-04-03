-- Tabela: op_alocacoes (Estado atual das alocações por dia/turno)
CREATE TABLE IF NOT EXISTS op_alocacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
    posto_id UUID REFERENCES op_postos(id) ON DELETE SET NULL,
    evento_id UUID REFERENCES op_eventos(id) ON DELETE SET NULL,
    data_alocacao DATE NOT NULL DEFAULT CURRENT_DATE,
    turno TEXT NOT NULL DEFAULT '06-18', -- '06-18' ou '18-06'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(colaborador_id, data_alocacao)
);

-- Tabela: op_alocacoes_log (Histórico de movimentações)
CREATE TABLE IF NOT EXISTS op_alocacoes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
    posto_id UUID REFERENCES op_postos(id) ON DELETE SET NULL,
    evento_id UUID REFERENCES op_eventos(id) ON DELETE SET NULL,
    data_alocacao DATE NOT NULL,
    turno TEXT NOT NULL,
    tipo_acao TEXT NOT NULL, -- 'entrada', 'saida', 'troca'
    usuario_responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE op_alocacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE op_alocacoes_log ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Acesso Total Alocacoes" ON op_alocacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Alocacoes Log" ON op_alocacoes_log FOR ALL USING (true) WITH CHECK (true);
