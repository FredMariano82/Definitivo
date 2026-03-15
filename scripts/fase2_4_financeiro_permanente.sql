-- Tabela para consolidação de históricos financeiros de eventos
-- Esta tabela garante que, mesmo que um card do Kanban seja deletado, o histórico de pagamentos permaneça.

CREATE TABLE IF NOT EXISTS op_financeiro_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES op_eventos(id) ON DELETE CASCADE,
    fase TEXT NOT NULL, -- 'MONTAGEM', 'EVENTO', 'DESMONTAGEM'
    data_referencia DATE NOT NULL,
    valor_devido DECIMAL(10, 2) NOT NULL,
    status_pagamento TEXT DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para performance de filtros
CREATE INDEX IF NOT EXISTS idx_fin_colaborador ON op_financeiro_eventos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_fin_evento ON op_financeiro_eventos(evento_id);
CREATE INDEX IF NOT EXISTS idx_fin_data ON op_financeiro_eventos(data_referencia);

COMMENT ON TABLE op_financeiro_eventos IS 'Registros permanentes de valores a pagar aos profissionais por fase de evento.';
