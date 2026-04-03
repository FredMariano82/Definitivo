-- Adicionando colunas para Inteligência Financeira e Detalhamento Operacional

-- 1. Detalhamento na tabela de eventos
ALTER TABLE op_eventos 
ADD COLUMN IF NOT EXISTS patrocinador TEXT DEFAULT 'Hagana',
ADD COLUMN IF NOT EXISTS responsavel_nome TEXT,
ADD COLUMN IF NOT EXISTS nivel_criticidade INTEGER DEFAULT 3;

-- 2. Classificação na tabela de equipe (necessário para cálculo Hagana)
ALTER TABLE op_equipe 
ADD COLUMN IF NOT EXISTS tipo_servico TEXT DEFAULT 'Vigilante/Operacional';

-- Comentários
COMMENT ON COLUMN op_eventos.patrocinador IS 'Patrocinador pagante: Paulão, Hagana ou OR';
COMMENT ON COLUMN op_eventos.nivel_criticidade IS '1: Crítico, 2: Atenção, 3: Normal';
COMMENT ON COLUMN op_equipe.tipo_servico IS 'Diferencia VSPP (Armado) de Vigilante/Operacional';
