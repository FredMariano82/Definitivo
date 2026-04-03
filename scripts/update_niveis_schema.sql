-- Adicionar nível na tabela de equipe
ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 3;

-- Comentário para documentação
COMMENT ON COLUMN op_equipe.nivel IS 'Nível de experiência/senioridade do profissional (1, 2, 3)';

-- Garantir que a tabela de eventos tenha o nível de criticidade (já parece existir, mas garantindo)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='op_eventos' AND column_name='nivel_criticidade') THEN
        ALTER TABLE op_eventos ADD COLUMN nivel_criticidade INTEGER DEFAULT 3;
    END IF;
END $$;
