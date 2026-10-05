import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Runs before every page request (Next 16 calls this file "proxy"; it was
 * "middleware" before). Its two jobs:
 *   1. Keep the Supabase session alive: refresh an expired access token and
 *      pass the new cookies on to both the page and the browser.
 *   2. Send signed-out visitors to /login, and signed-in ones away from it.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Write to the request too, so the page rendering right after this
          // sees the refreshed token instead of the old expired one.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  // getUser() asks Supabase whether the session is really valid (and
  // refreshes it if needed). getSession() only reads the cookie, which is
  // how a stale cookie used to get through and crash the dashboard.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith('/login');
  const isCallbackRoute = path.startsWith('/auth/callback');

  // A redirect is a new response, so carry over any refreshed cookies.
  function redirectTo(pathname: string) {
    const redirect = NextResponse.redirect(new URL(pathname, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!user && !isAuthRoute && !isCallbackRoute) return redirectTo('/login');
  if (user && isAuthRoute) return redirectTo('/dashboard');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
