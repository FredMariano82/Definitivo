-- Adicionar campo para diferenciar profissionais do clube e externos
ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS tipo_vinculo TEXT DEFAULT 'clube' CHECK (tipo_vinculo IN ('clube', 'externo'));

-- Comentário para documentação
COMMENT ON COLUMN op_equipe.tipo_vinculo IS 'Define se o profissional é do efetivo fixo (clube) ou apoio externo';
