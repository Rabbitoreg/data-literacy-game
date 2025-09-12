import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/players/search?name=playerName - Search for existing player by name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerName = searchParams.get('name')

    if (!playerName || !playerName.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 })
    }

    // Search for teams that have this player in their members array
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, team_number, budget, score, members, created_at, team_nickname')
      .contains('members', [playerName.trim()])
      .order('team_number', { ascending: true })

    if (error) {
      console.error('Error searching for player:', error)
      return NextResponse.json({ error: 'Failed to search for player' }, { status: 500 })
    }

    console.log('Player search results:', {
      playerName: playerName.trim(),
      teams: teams || [],
      teamsWithNicknames: teams?.filter(t => t.team_nickname) || []
    })

    return NextResponse.json({ 
      playerName: playerName.trim(),
      teams: teams || [],
      found: (teams || []).length > 0
    })

  } catch (error) {
    console.error('Player search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
