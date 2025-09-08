import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/statements - Get all statements
export async function GET(request: NextRequest) {
  try {
    const { data: statements, error } = await supabase
      .from('statements')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching statements:', error)
      return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 })
    }

    return NextResponse.json({ statements: statements || [] })

  } catch (error) {
    console.error('Statements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
