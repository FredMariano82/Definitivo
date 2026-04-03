-- AJUSTE DE SCHEMA: Tabela op_alocacoes
-- Adicionando colunas necessárias para o funcionamento do Painel Tático V2

ALTER TABLE op_alocacoes ADD COLUMN IF NOT EXISTS horario_alocacao TIME DEFAULT CURRENT_TIME;

-- Garantir que a restrição de unicidade está correta para o UPSERT (um colaborador por dia)
-- Se já existir, não faz nada. Se não, cria.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'op_alocacoes_colaborador_id_data_alocacao_key') THEN
        ALTER TABLE op_alocacoes ADD CONSTRAINT op_alocacoes_colaborador_id_data_alocacao_key UNIQUE (colaborador_id, data_alocacao);
    END IF;
END $$;
