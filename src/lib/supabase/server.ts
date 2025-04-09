import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Função para criar um cliente Supabase do lado do servidor
// Aceita cookieStore como argumento
export const createClient = (cookieStore: ReadonlyRequestCookies) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // O middleware pode definir cookies antes do cookieStore estar pronto
            // Ignorar este erro nesse caso específico
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
             // O middleware pode definir cookies antes do cookieStore estar pronto
            // Ignorar este erro nesse caso específico
          }
        },
      },
    }
  );
}; 