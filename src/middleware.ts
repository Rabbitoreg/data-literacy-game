import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // TEMPORARY: Bypass authentication due to RLS issue on auth.users table
  // TODO: Re-enable authentication once Supabase RLS issue is resolved
  
  // Check if this is an admin route (except login)
  if (req.nextUrl.pathname.startsWith('/admin') && req.nextUrl.pathname !== '/admin/login') {
    // For now, allow all admin access without authentication
    // In production, you would want proper authentication
    console.log('Admin access granted (authentication bypassed due to RLS issue)')
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*']
}
