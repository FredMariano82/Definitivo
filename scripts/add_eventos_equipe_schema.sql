-- Tabela para gerenciar o status individual de cada profissional em um evento
CREATE TABLE IF NOT EXISTS op_eventos_equipe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID REFERENCES op_eventos(id) ON DELETE CASCADE,
    colaborador_id UUID REFERENCES op_equipe(id) ON DELETE CASCADE,
    fase TEXT DEFAULT 'realizacao', -- 'montagem', 'realizacao', 'desmontagem'
    status TEXT DEFAULT 'PENDENTE', -- 'PENDENTE', 'CONVIDADO', 'ACEITO', 'RECUSADO'
    data_convite TIMESTAMP WITH TIME ZONE,
    data_resposta TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(evento_id, colaborador_id, fase)
);

-- Habilitar RLS
ALTER TABLE op_eventos_equipe ENABLE ROW LEVEL SECURITY;

-- Política de acesso total para usuários autenticados (simplificado por enquanto)
CREATE POLICY "Acesso total autenticado para op_eventos_equipe" 
ON op_eventos_equipe FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
