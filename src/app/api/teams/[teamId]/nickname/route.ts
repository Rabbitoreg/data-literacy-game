import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// PUT /api/teams/[teamId]/nickname - Update team nickname
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { nickname } = await request.json()
    const teamId = params.teamId

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Valid nickname is required' }, { status: 400 })
    }

    // Update team nickname
    const { data: team, error } = await supabase
      .from('teams')
      .update({ team_nickname: nickname.trim() })
      .eq('id', teamId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating team nickname:', error)
      return NextResponse.json({ error: 'Failed to update team nickname' }, { status: 500 })
    }

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ team })

  } catch (error) {
    console.error('Team nickname API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
