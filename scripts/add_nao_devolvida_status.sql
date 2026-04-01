-- 1. Atualizar a trava (CHECK constraint) da tabela de inventário
ALTER TABLE public.chaves_inventario 
DROP CONSTRAINT IF EXISTS chaves_inventario_status_check;

ALTER TABLE public.chaves_inventario 
ADD CONSTRAINT chaves_inventario_status_check 
CHECK (status IN ('disponivel', 'emprestada', 'manutencao', 'extraviada', 'nao_devolvida'));

-- 2. Garantir que o campo 'tipo' no histórico aceite a nova descrição (se houver trava)
-- Geralmente não há trava no histórico para permitir flexibilidade, mas por segurança:
ALTER TABLE public.chaves_movimentacoes 
DROP CONSTRAINT IF EXISTS chaves_movimentacoes_tipo_check;

-- Comentário para registro no banco
COMMENT ON COLUMN chaves_inventario.status IS 'Status da chave: disponivel, emprestada, manutencao, extraviada ou nao_devolvida';
