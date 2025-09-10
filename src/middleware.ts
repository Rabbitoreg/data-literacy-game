import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check if this is an admin route (except login)
  if (req.nextUrl.pathname.startsWith('/admin') && req.nextUrl.pathname !== '/admin/login') {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // Redirect to admin login if not authenticated
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*']
}
