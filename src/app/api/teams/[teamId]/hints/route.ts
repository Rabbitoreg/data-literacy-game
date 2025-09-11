import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/teams/[teamId]/hints - Get team's purchased hints
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId)
    
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    // Get team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team:', teamError)
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get purchased hints
    const { data: hints, error } = await supabase
      .from('hint_purchases')
      .select('*')
      .eq('team_id', team.id)
      .order('purchased_at', { ascending: false })

    if (error) {
      console.error('Error fetching hints:', error)
      return NextResponse.json({ error: 'Failed to fetch hints' }, { status: 500 })
    }

    return NextResponse.json({ hints: hints || [] })

  } catch (error) {
    console.error('Hints API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
