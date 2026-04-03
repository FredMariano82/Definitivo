CREATE TABLE IF NOT EXISTS public.chaves_movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave_id UUID REFERENCES public.chaves_inventario(id) ON DELETE SET NULL,
    numero TEXT NOT NULL,
    modelo TEXT NOT NULL,
    local TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('SAIDA', 'ENTRADA')),
    responsavel_nome TEXT,
    responsavel_setor TEXT,
    operador_nome TEXT,
    data_evento TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.chaves_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS simples (leitura/escrita para todos para este ambiente de controle interno)
DROP POLICY IF EXISTS "Permitir tudo para todos" ON public.chaves_movimentacoes;
CREATE POLICY "Permitir tudo para todos" ON public.chaves_movimentacoes FOR ALL USING (true) WITH CHECK (true);
