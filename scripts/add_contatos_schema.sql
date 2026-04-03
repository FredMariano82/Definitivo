-- Adicionar campos de contato à tabela de profissionais
ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS cel1 TEXT;
ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS cel2 TEXT;

-- Comentários para documentação
COMMENT ON COLUMN op_equipe.cel1 IS 'Contato principal do profissional';
COMMENT ON COLUMN op_equipe.cel2 IS 'Contato secundário ou de emergência';
