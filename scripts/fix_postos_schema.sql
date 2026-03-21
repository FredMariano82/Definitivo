-- Script corrigido para garantir que todos os postos existam com os nomes exatos
-- Primeiro, garantir que nome_posto seja único para que o ON CONFLICT funcione
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'op_postos_nome_posto_key') THEN
        ALTER TABLE op_postos ADD CONSTRAINT op_postos_nome_posto_key UNIQUE (nome_posto);
    END IF;
END $$;

INSERT INTO op_postos (nome_posto)
SELECT unnest(ARRAY[
    '42 - Angelina', 
    '41 - Bico', 
    '25 - Alceu (1)', 
    '25 - Alceu (2)', 
    '25 - Alceu (3)', 
    '56 - Raio X Estacionamento', 
    '57 - Raio X Alceu', 
    '51 - Chapeira', 
    '43 - Hungria', 
    '44 - Funcionários', 
    '30 - Monitoramento', 
    'RENDICIONISTA'
])
ON CONFLICT (nome_posto) DO NOTHING;

-- Verifica se a política de acesso à tabela de postos está ok
ALTER TABLE op_postos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Total Postos" ON op_postos;
CREATE POLICY "Acesso Total Postos" ON op_postos FOR ALL USING (true) WITH CHECK (true);
