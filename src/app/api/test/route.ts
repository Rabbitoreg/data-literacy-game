import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'API and database working',
      timestamp: new Date().toISOString(),
      teams_count: data?.length || 0
    })
  } catch (err) {
    return NextResponse.json({ 
      error: 'Connection error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
