-- ====================================================================
-- MÓDULO DE RONDA DOS DVRs (CFTV)
-- ====================================================================

-- 1. Tabela de Configuração dos DVRs
CREATE TABLE IF NOT EXISTS cftv_dvrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    localizacao TEXT,
    canais INTEGER DEFAULT 16,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Histórico de Rondas
CREATE TABLE IF NOT EXISTS cftv_rondas_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_ronda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operador_nome TEXT NOT NULL,
    dados_ronda JSONB NOT NULL, -- Estrutura: { "dvrId": { "canal": "cor" } }
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Segurança)
ALTER TABLE cftv_dvrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cftv_rondas_historico ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura de DVRs por todos autenticados') THEN
        CREATE POLICY "Leitura de DVRs por todos autenticados" ON cftv_dvrs FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Inserção de Rondas por todos autenticados') THEN
        CREATE POLICY "Inserção de Rondas por todos autenticados" ON cftv_rondas_historico FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura de Rondas por todos autenticados') THEN
        CREATE POLICY "Leitura de Rondas por todos autenticados" ON cftv_rondas_historico FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- 5. Carga Inicial de DVRs (Baseado na imagem fornecida)
INSERT INTO cftv_dvrs (nome) VALUES 
('After 1'), ('After 2'), ('Angelina 1'), ('Angelina 2'), 
('Almoxarifado'), ('Audio & Luz'), ('Bar da Piscina'), 
('Bar Do Tênis'), ('Beach Tênis'), ('Berçario Angelina'), 
('Bico'), ('Casa'), ('Central'), ('C.J 1'), ('C.J 2'), 
('Centro de Lutas'), ('Centro de música'), 
('Centro Civico 1 Sala Chefia Externa'), 
('Centro Civico 2 Sala Chefia Internas'), 
('Centro Civico 3 Entrada Alceu'), ('Chapeira'), 
('Diversos'), ('Espaço Hebra'), ('Fit Center 1'), 
('Fit Center 2'), ('Fisioterapia'), ('Fresto'), 
('Ginastica Artistica'),
('Hungria 1'), ('Hungria 2'), ('Locker Piscina'),
('Maternal 1 Rack Sala 07'), ('Maternal 2 Rack Sala 07'), 
('Maternal 3 Sala 05'), ('Merkas'), ('Mitzpe'), 
('Patrimonio'), ('Passarela Tênis'), ('Piscina'), 
('Poli Esportivo'), ('Presidencia'), ('Presidente'), 
('Refeitorio'), ('Tênis'), ('Tesouraria / Agenda'), ('T.I')
ON CONFLICT (nome) DO NOTHING;
