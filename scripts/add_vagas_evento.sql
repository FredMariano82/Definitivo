-- Adicionar campo de vagas necessárias na tabela de eventos
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS vagas_necessarias INTEGER DEFAULT 0;

-- Atualizar comentários para clareza
COMMENT ON COLUMN op_eventos.vagas_necessarias IS 'Quantidade de profissionais necessários para o evento';
