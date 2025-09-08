import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/teams - Get all teams (for admin monitoring)
export async function GET(request: NextRequest) {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        decisions (count),
        purchases (count)
      `)
      .order('team_number', { ascending: true })

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    return NextResponse.json({ teams: teams || [] })

  } catch (error) {
    console.error('Teams API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
