-- Script para limpeza completa de eventos e dados relacionados
-- Use com cautela: isso apagará todos os registros de eventos e financeiros associados.

-- 1. Limpar históricos financeiros
DELETE FROM op_financeiro_eventos;

-- 2. Limpar tarefas do Kanban que sejam de eventos
DELETE FROM kanban_tarefas WHERE categoria = 'eventos';

-- 3. Limpar postos que foram criados automaticamente para eventos
-- (Postos de eventos geralmente seguem o padrão 'MONTAGEM:', 'EVENTO:' ou 'DESMONTAGEM:')
DELETE FROM op_postos WHERE nome_posto LIKE 'MONTAGEM:%' OR nome_posto LIKE 'EVENTO:%' OR nome_posto LIKE 'DESMONTAGEM:%';

-- 4. Limpar a tabela mestre de eventos
DELETE FROM op_eventos;

-- 5. Caso existam alocações vinculadas a esses postos de eventos, limpá-las também
DELETE FROM op_alocacoes WHERE posto_id NOT IN (SELECT id FROM op_postos);

COMMIT;
