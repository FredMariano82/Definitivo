-- Adicionando colunas de controle de equipe
ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS data_reciclagem DATE;
ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS data_inicio_ferias DATE;
ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS data_fim_ferias DATE;
ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS referencia_escala DATE;
