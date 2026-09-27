import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const chaveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** false quando o .env.local não tem VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. */
export const supabaseConfigurado = Boolean(url && chaveAnon);

// Só a chave pública (anon) vai para o front: o acesso aos dados é protegido pelas políticas RLS.
export const supabase = createClient<Database>(url || 'http://localhost', chaveAnon || 'chave-ausente', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
