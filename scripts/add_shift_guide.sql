-- Tabela: op_guia_turno (Regras e Sugestões Operacionais)
CREATE TABLE IF NOT EXISTS op_guia_turno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno TEXT NOT NULL, -- 'Dia' ou 'Noite'
    horario_alvo TIME NOT NULL, -- Ex: '11:00', '18:00'
    titulo TEXT NOT NULL,
    instrucao TEXT NOT NULL,
    posto_referencia_id UUID REFERENCES op_postos(id) ON DELETE SET NULL,
    postos_sugeridos TEXT[] DEFAULT '{}', -- Nomes dos postos para facilitar busca caso UUID mude
    cor_alerta TEXT DEFAULT 'amber', -- amber, blue, emerald, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE op_guia_turno ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Total Guia" ON op_guia_turno;
CREATE POLICY "Acesso Total Guia" ON op_guia_turno FOR ALL USING (true) WITH CHECK (true);

-- Seed das Regras informadas pelo usuário
DELETE FROM op_guia_turno;

-- TURNO DIA
INSERT INTO op_guia_turno (turno, horario_alvo, titulo, instrucao, postos_sugeridos, cor_alerta) VALUES
('Dia', '11:00', 'Rendições de Almoço (11h)', 'Os profissionais que chegam agora devem render o Almoço dos postos 41 e 43.', ARRAY['41 - Bico', '43 - Hungria'], 'amber'),
('Dia', '11:30', 'Retorno do Almoço (11h)', 'Após o retorno do 41 e 43, os rendicionistas devem assumir a 42 e um dos postos 25.', ARRAY['42 - Angelina', '25 - Alceu (1)', '25 - Alceu (2)', '25 - Alceu (3)'], 'blue'),
('Dia', '12:00', 'Rendições de Almoço (12h)', 'Os profissionais que chegam agora devem render o Almoço dos postos 56 e 57.', ARRAY['56 - Raio X Estacionamento', '57 - Raio X Alceu'], 'amber'),
('Dia', '12:30', 'Fechamento Chapeira', 'A Chapeira (51) fecha para almoço. O profissional da 51 deve almoçar e depois render a 44.', ARRAY['44 - Funcionários', '51 - Chapeira'], 'emerald'),
('Dia', '14:00', 'Giro de Café (Tarde)', 'Equipe que almoçou às 11h inicia o café. Manter 2 na 42 e 2 na 43 enquanto o coringa auxilia.', ARRAY['42 - Angelina', '43 - Hungria', '41 - Bico', '44 - Funcionários'], 'emerald');

-- TURNO NOITE
INSERT INTO op_guia_turno (turno, horario_alvo, titulo, instrucao, postos_sugeridos, cor_alerta) VALUES
('Noite', '18:00', 'Entrada e Rendições (18h)', 'Gean rende a 42, John rende a 57. Fábio assume a 43 até as 20h.', ARRAY['42 - Angelina', '57 - Raio X Alceu', '43 - Hungria'], 'amber'),
('Noite', '20:00', 'Fechamento e Loop Noturno', 'A 43 fecha. Fábio (43) rende a Marta (44) para o café. Início do loop 43/44.', ARRAY['44 - Funcionários', '43 - Hungria'], 'blue');
