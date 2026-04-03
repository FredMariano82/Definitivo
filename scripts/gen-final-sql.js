const fs = require('fs');
const Papa = require('papaparse');

const filePath = 'C:/Users/central_seguranca/.gemini/antigravity/scratch/ControledeChaves.csv';
const csvFile = fs.readFileSync(filePath, 'utf8');

const results = Papa.parse(csvFile, {
  header: true,
  skipEmptyLines: true
});

let sql = `-- 1. Criar a tabela de inventário de chaves
CREATE TABLE IF NOT EXISTS public.chaves_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL,
    modelo TEXT CHECK (modelo IN ('amarela', 'prata')),
    local TEXT NOT NULL,
    status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'emprestada', 'manutencao', 'extraviada')),
    responsavel_nome TEXT,
    responsavel_setor TEXT,
    operador_nome TEXT,
    data_emprestimo TIMESTAMPTZ,
    devolvido_por TEXT,
    data_devolucao TIMESTAMPTZ,
    obs TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.chaves_inventario ENABLE ROW LEVEL SECURITY;

-- 3. Criar política de acesso público
DROP POLICY IF EXISTS "Acesso público total" ON public.chaves_inventario;
CREATE POLICY "Acesso público total" ON public.chaves_inventario FOR ALL USING (true);

-- 4. Limpar dados para carga limpa
DELETE FROM public.chaves_inventario;

-- 5. Inserir todos os 298 registros do CSV
INSERT INTO public.chaves_inventario (numero, modelo, local, status, obs, responsavel_nome, responsavel_setor, operador_nome, data_emprestimo) VALUES
`;

const values = results.data.map(row => {
  const statusOriginal = (row['Status'] || '').toLowerCase();
  let statusFinal = 'disponivel';
  if (statusOriginal.includes('dispon')) statusFinal = 'disponivel';
  else if (statusOriginal.includes('emprest')) statusFinal = 'emprestada';
  else if (statusOriginal.includes('manuten')) statusFinal = 'manutencao';
  else if (statusOriginal.includes('extra')) statusFinal = 'extraviada';

  const escape = (val) => val ? `'${val.replace(/'/g, "''")}'` : 'NULL';
  
  return `(${escape(row['Número'] || row['Numero'])}, ${escape((row['Modelo'] || 'prata').toLowerCase())}, ${escape(row['Local'] || 'Desconhecido')}, ${escape(statusFinal)}, ${escape(row['OBS'] || '')}, ${escape(row['Responsável'])}, ${escape(row['Setor'])}, ${escape(row['Operador'])}, ${row['Data Empréstimo'] ? escape(new Date(row['Data Empréstimo']).toISOString()) : 'NULL'})`;
});

sql += values.join(',\n') + ';';

fs.writeFileSync('C:/Users/central_seguranca/.gemini/antigravity/brain/34ebb1bb-d24e-4997-9932-477c22987cb0/setup_chaves_final.sql', sql);
console.log("SQL Final gerado com sucesso!");
