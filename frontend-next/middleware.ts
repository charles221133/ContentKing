import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow health check and site-down page to always load
  if (pathname.startsWith('/api/health') || pathname.startsWith('/site-down')) {
    return NextResponse.next();
  }

  // Use safer origin calculation
  const host = request.headers.get('host');
  const origin = host ? `http://${host}` : 'http://localhost:3000';

  // Add timeout to health check fetch
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${origin}/api/health`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      // Health check failed, redirect to /site-down
      return NextResponse.redirect(`${origin}/site-down`);
    }
  } catch {
    clearTimeout(timeout);
    // Network or other error, redirect to /site-down
    return NextResponse.redirect(`${origin}/site-down`);
  }

  // If user is not logged in and is trying to access a protected route, redirect to login
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/humor-experimentation') || pathname.startsWith('/publish') || pathname.startsWith('/settings') || pathname === '/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is logged in and tries to access login/signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // if user is logged in and at the root, redirect to dashboard
  if (user && pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - site-down (site-down page)
     * - api/health (health check)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|site-down|api/health).*)',
  ],
} 