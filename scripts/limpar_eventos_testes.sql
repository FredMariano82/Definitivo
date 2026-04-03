-- LIMPEZA DE EVENTOS PARA TESTES (CUIDADO: APAGA TUDO)
-- O cascade apagará automaticamente os convites e financeiro vinculados
TRUNCATE TABLE op_eventos RESTART IDENTITY CASCADE;

-- Caso o truncate não tenha limpado tabelas sem FK direta
DELETE FROM op_eventos_equipe;
DELETE FROM op_financeiro_eventos;
DELETE FROM op_postos WHERE nome_posto LIKE 'MONTAGEM:%' OR nome_posto LIKE 'EVENTO:%' OR nome_posto LIKE 'DESMONTAGEM:%';
