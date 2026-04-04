-- Adiciona a coluna 'funcao' na tabela de usuarios para armazenar a nomenclatura operacional (Monitoramento, Admin, Gestor, etc)
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS funcao TEXT;

-- Garante que a coluna esteja disponível para todos
COMMENT ON COLUMN public.usuarios.funcao IS 'Nomenclatura operacional/função do usuário para exibição no sistema';
