-- Adicionar novos campos à tabela op_eventos
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS local_detalhado TEXT;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS publico_estimado TEXT;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS foto_evento TEXT;

-- Campos de Montagem
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS montagem_inicio_data DATE;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS montagem_inicio_hora TEXT;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS montagem_fim_data DATE;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS montagem_fim_hora TEXT;

-- Campos do Evento (Renomeando para clareza ou usando novos)
-- Já existem data_inicio e data_fim, mas vamos usar os específicos para o evento real
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS evento_inicio_data DATE;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS evento_inicio_hora TEXT;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS evento_fim_data DATE;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS evento_fim_hora TEXT;

-- Campos de Desmontagem
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS desmontagem_inicio_data DATE;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS desmontagem_inicio_hora TEXT;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS desmontagem_fim_data DATE;
ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS desmontagem_fim_hora TEXT;
