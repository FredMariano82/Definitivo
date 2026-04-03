-- Adicionando colunas de controle de fases e equipes na tabela op_eventos
ALTER TABLE op_eventos 
ADD COLUMN IF NOT EXISTS has_montagem BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_realizacao BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_desmontagem BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS equipe_montagem UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipe_realizacao UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipe_desmontagem UUID[] DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN op_eventos.equipe_montagem IS 'Array de IDs da equipe para a fase de montagem';
COMMENT ON COLUMN op_eventos.equipe_realizacao IS 'Array de IDs da equipe para a fase de realização (evento)';
COMMENT ON COLUMN op_eventos.equipe_desmontagem IS 'Array de IDs da equipe para a fase de desmontagem';
