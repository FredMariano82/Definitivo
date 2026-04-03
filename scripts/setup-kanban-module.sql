-- Tabela: kanban_tarefas (Criação caso não exista, e Adição de Colunas caso exista)
CREATE TABLE IF NOT EXISTS kanban_tarefas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL CHECK (status IN ('entrada', 'fazendo', 'aguardando', 'historico')),
    categoria TEXT NOT NULL CHECK (categoria IN ('imagem', 'os', 'ocorrencia', 'autorizacao_chaves', 'achados_perdidos', 'eventos')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_name TEXT, 
    updated_by_name TEXT,
    dados_especificos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Adicionando colunas de metadados caso a tabela JÁ EXISTA
ALTER TABLE kanban_tarefas 
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Atualizando constraint de categoria para JÁ EXISTENTES
ALTER TABLE kanban_tarefas DROP CONSTRAINT IF EXISTS kanban_tarefas_categoria_check;
ALTER TABLE kanban_tarefas ADD CONSTRAINT kanban_tarefas_categoria_check CHECK (categoria IN ('imagem', 'os', 'ocorrencia', 'autorizacao_chaves', 'achados_perdidos', 'eventos'));

-- Função para atualizar o trigger de updated_at
CREATE OR REPLACE FUNCTION update_kanban_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_kanban_tarefas_updated_at
    BEFORE UPDATE ON kanban_tarefas
    FOR EACH ROW
    EXECUTE FUNCTION update_kanban_updated_at_column();

-- Configurando RLS (Permitindo acesso anônimo/autenticado temporariamente para testes)
ALTER TABLE kanban_tarefas ENABLE ROW LEVEL SECURITY;

-- Remove políticas anteriores caso existam para evitar conflitos ao rodar novamente
DROP POLICY IF EXISTS "Permitir leitura de kanban_tarefas" ON kanban_tarefas;
DROP POLICY IF EXISTS "Permitir inserção de kanban_tarefas" ON kanban_tarefas;
DROP POLICY IF EXISTS "Permitir deleção de kanban_tarefas" ON kanban_tarefas;
DROP POLICY IF EXISTS "Permitir atualização de kanban_tarefas" ON kanban_tarefas;

-- Recria políticas
CREATE POLICY "Permitir leitura de kanban_tarefas" ON kanban_tarefas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de kanban_tarefas" ON kanban_tarefas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir deleção de kanban_tarefas" ON kanban_tarefas FOR DELETE USING (true);
CREATE POLICY "Permitir atualização de kanban_tarefas" ON kanban_tarefas FOR UPDATE USING (true);
