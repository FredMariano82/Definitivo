-- Script para adicionar o status 'avariada' ao controle de chaves

-- 1. Atualizar a trava (CHECK constraint) na tabela de inventário
ALTER TABLE public.chaves_inventario 
DROP CONSTRAINT IF EXISTS chaves_inventario_status_check;

ALTER TABLE public.chaves_inventario 
ADD CONSTRAINT chaves_inventario_status_check 
CHECK (status IN ('disponivel', 'emprestada', 'manutencao', 'extraviada', 'nao_devolvida', 'avariada'));

-- 2. Atualizar o comentário da coluna
COMMENT ON COLUMN chaves_inventario.status IS 'Status da chave: disponivel, emprestada, manutencao, extraviada, nao_devolvida ou avariada';

-- 3. Garantir que a tabela de histórico aceite a nova descrição em 'tipo' (caso haja trava)
ALTER TABLE public.chaves_movimentacoes 
DROP CONSTRAINT IF EXISTS chaves_movimentacoes_tipo_check;

-- 4. Adicionar coluna 'obs' ao histórico se não existir
ALTER TABLE public.chaves_movimentacoes 
ADD COLUMN IF NOT EXISTS obs TEXT;
