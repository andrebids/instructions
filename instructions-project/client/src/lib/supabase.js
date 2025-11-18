import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para React
 * Configurado conforme o guia oficial: https://supabase.com/docs/guides/getting-started/quickstarts/react
 * 
 * IMPORTANTE: Use VITE_SUPABASE_PUBLISHABLE_KEY (anon key) no frontend, NUNCA a service_role key
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase não configurado: VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não estão definidos');
  console.warn('   Configure essas variáveis no arquivo .env.local');
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Usar cookies para sessão (compatível com Auth.js)
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase;

