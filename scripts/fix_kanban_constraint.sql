-- 1. Remover a restrição antiga (o nome costuma seguir esse padrão no Postgres)
ALTER TABLE kanban_tarefas 
DROP CONSTRAINT IF EXISTS kanban_tarefas_categoria_check;

-- 2. Adicionar a nova restrição incluindo 'eventos'
ALTER TABLE kanban_tarefas 
ADD CONSTRAINT kanban_tarefas_categoria_check 
CHECK (categoria IN ('imagem', 'os', 'ocorrencia', 'autorizacao_chaves', 'achados_perdidos', 'eventos'));

-- 3. Garantir que as permissões de RLS permitam a inserção pelo sistema/anon
-- (Apenas se houver problemas de permissão, mas o erro 400 indica restrição de valor)
