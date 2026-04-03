-- SCRIPT DE MANUTENÇÃO: LIMPEZA E PROTEÇÃO DE DUPLICADOS
-- Tabela: prestadores (Campo: doc1/RG)

-- PASSO 1: LIMPAR DUPLICADOS EXISTENTES
-- (Mantém apenas o registro mais antigo de cada RG)
DELETE FROM prestadores
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY doc1 
                   ORDER BY (CASE WHEN checagem = 'aprovada' AND liberacao = 'ok' THEN 0 ELSE 1 END) ASC, criado_em ASC 
               ) as num_linha
        FROM prestadores
    ) t
    WHERE t.num_linha > 1
);

-- PASSO 2: BLOQUEAR DUPLICADOS NO FUTURO
-- (Cria uma regra de "Chave Única" no RG)
-- IMPORTANTE: Só execute o comando abaixo se o Passo 1 terminar com sucesso
-- ALTER TABLE prestadores ADD CONSTRAINT unique_rg UNIQUE (doc1);
