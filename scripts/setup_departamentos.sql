CREATE TABLE IF NOT EXISTS departamentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e permitir leitura pública para o front-end
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública de departamentos" ON departamentos FOR SELECT USING (true);

-- Inserir os departamentos
INSERT INTO departamentos (nome) VALUES 
('After School'),
('Agenda'),
('Atelie de Artes'),
('Banco Safra'),
('CHAVERIM'),
('CK'),
('Compras'),
('Comunicação'),
('Concessões'),
('Cultura Judaica'),
('Danças'),
('Daniel Whatsap'),
('Espaço Bebê'),
('Grandes Festas'),
('Esportivo'),
('Festival Carmel'),
('Hebraikeinu'),
('Hadventure'),
('Informatica'),
('Brinquedoteca'),
('Juventude'),
('Marketing'),
('Maternal'),
('Musica'),
('Depto.Médico'),
('Patrimônio'),
('Presidência'),
('RH'),
('Segurança'),
('Renovação'),
('Social'),
('60 Mais'),
('Teatro')
ON CONFLICT (nome) DO NOTHING;
