-- Adiciona colunas para controle de entrada e saída na Portaria
ALTER TABLE IF EXISTS public.prestadores 
ADD COLUMN IF NOT EXISTS horario_entrada TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS horario_saida TIMESTAMP WITH TIME ZONE;

-- Adiciona colunas para identificar quem registrou o check-in/out
ALTER TABLE IF EXISTS public.prestadores
ADD COLUMN IF NOT EXISTS registrado_por_entrada TEXT,
ADD COLUMN IF NOT EXISTS registrado_por_saida TEXT;

COMMENT ON COLUMN public.prestadores.horario_entrada IS 'Horário de entrada registrado pela Portaria';
COMMENT ON COLUMN public.prestadores.horario_saida IS 'Horário de saída registrado pela Portaria';
