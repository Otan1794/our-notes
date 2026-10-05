import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Server-side Supabase instance for Server Components / Server Actions.
 * Reads the user's session from cookies so RLS policies see the
 * correct auth.uid(). Never import the service-role key here for
 * request-scoped work — only the anon key + user session.
 *
 * NOTE: as of Next.js 15+, `cookies()` returns a Promise, so this
 * factory is async — every call site must `await createClient()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component with no writable cookie store;
            // safe to ignore because proxy.ts refreshes the session
          }
        }
      }
    }
  );
}
