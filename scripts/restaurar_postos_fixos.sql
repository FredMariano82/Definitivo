-- =======================================================
-- SCRIPT DE RESET TOTAL E RESTAURAÇÃO DE POSTOS FIXOS
-- FINALIDADE: Limpar sujeira e deixar apenas os 10 oficiais
-- =======================================================

-- 1. Limpar alocações órfãs (opcional, por segurança)
DELETE FROM op_alocacoes;

-- 2. LIMPEZA TOTAL (Nuke)
-- Apaga absolutamente tudo para não sobrar nomes em maiúsculas ou duplicados
DELETE FROM op_postos;

-- 3. INSERÇÃO LIMPA (Os 10 Postos Oficiais)
INSERT INTO op_postos (id, nome_posto, nivel_criticidade, exige_armamento)
VALUES 
    (gen_random_uuid(), '42 - Angelina', 1, false),
    (gen_random_uuid(), '41 - Bico', 1, false),
    (gen_random_uuid(), '25 - Alceu (1)', 2, false),
    (gen_random_uuid(), '25 - Alceu (2)', 2, false),
    (gen_random_uuid(), '25 - Alceu (3)', 2, false),
    (gen_random_uuid(), '43 - Hungria', 1, false),
    (gen_random_uuid(), '51 - Chapeira', 3, false),
    (gen_random_uuid(), '44 - Funcionários', 2, false),
    (gen_random_uuid(), '57 - Raio X Alceu', 2, false),
    (gen_random_uuid(), '56 - Raio X Estacionamento', 2, false);

-- 4. Verificação final
-- SELECT * FROM op_postos ORDER BY nome_posto;
