-- ============================================================
-- Migration: Enable Row Level Security (RLS) on public tables
-- ============================================================
-- 
-- Esta migration habilita RLS nas seguintes tabelas:
-- - tasks
-- - observations
-- - orders
-- - order_items
-- - SequelizeMeta
-- 
-- IMPORTANTE: Como o acesso a essas tabelas é feito através do backend
-- (usando service_role key), as políticas RLS bloqueiam acesso público
-- via PostgREST para prevenir acesso não autorizado direto ao Supabase.
-- 
-- INSTRUÇÕES:
-- 1. Copie e cole este SQL no Supabase SQL Editor
-- 2. Execute o script completo
-- 3. Verifique os avisos do Database Linter desaparecerem
-- 
-- ============================================================

-- Habilitar RLS na tabela tasks
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    
    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Block public access to tasks" ON public.tasks;
    
    -- Criar política de bloqueio
    CREATE POLICY "Block public access to tasks"
    ON public.tasks
    FOR ALL
    USING (false);
    
    RAISE NOTICE '✅ RLS habilitado em tasks';
  ELSE
    RAISE NOTICE '⚠️  Tabela tasks não existe, pulando...';
  END IF;
END $$;

-- Habilitar RLS na tabela observations
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'observations') THEN
    ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
    
    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Block public access to observations" ON public.observations;
    
    -- Criar política de bloqueio
    CREATE POLICY "Block public access to observations"
    ON public.observations
    FOR ALL
    USING (false);
    
    RAISE NOTICE '✅ RLS habilitado em observations';
  ELSE
    RAISE NOTICE '⚠️  Tabela observations não existe, pulando...';
  END IF;
END $$;

-- Habilitar RLS na tabela orders
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    
    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Block public access to orders" ON public.orders;
    
    -- Criar política de bloqueio
    CREATE POLICY "Block public access to orders"
    ON public.orders
    FOR ALL
    USING (false);
    
    RAISE NOTICE '✅ RLS habilitado em orders';
  ELSE
    RAISE NOTICE '⚠️  Tabela orders não existe, pulando...';
  END IF;
END $$;

-- Habilitar RLS na tabela order_items
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    
    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Block public access to order_items" ON public.order_items;
    
    -- Criar política de bloqueio
    CREATE POLICY "Block public access to order_items"
    ON public.order_items
    FOR ALL
    USING (false);
    
    RAISE NOTICE '✅ RLS habilitado em order_items';
  ELSE
    RAISE NOTICE '⚠️  Tabela order_items não existe, pulando...';
  END IF;
END $$;

-- Habilitar RLS na tabela SequelizeMeta
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeMeta') THEN
    ALTER TABLE public."SequelizeMeta" ENABLE ROW LEVEL SECURITY;
    
    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Block public access to SequelizeMeta" ON public."SequelizeMeta";
    
    -- Criar política de bloqueio
    CREATE POLICY "Block public access to SequelizeMeta"
    ON public."SequelizeMeta"
    FOR ALL
    USING (false);
    
    RAISE NOTICE '✅ RLS habilitado em SequelizeMeta';
  ELSE
    RAISE NOTICE '⚠️  Tabela SequelizeMeta não existe, pulando...';
  END IF;
END $$;

-- ============================================================
-- Verificação final
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tasks', 'observations', 'orders', 'order_items', 'SequelizeMeta')
ORDER BY tablename;

