import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/teams/[teamId] - Get team info
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId)
    
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    // Get or create team
    let { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', teamId)
      .single()

    // If team exists, recalculate score from decisions to ensure accuracy
    if (team && !error) {
      const { data: decisions } = await supabase
        .from('decisions')
        .select('points_earned')
        .eq('team_id', team.id)

      const totalScore = decisions?.reduce((sum, decision) => sum + (decision.points_earned || 0), 0) || 0
      
      // Update team score if it's different from calculated total
      if (team.score !== totalScore) {
        console.log(`Recalculating team ${teamId} score: ${team.score} -> ${totalScore}`)
        const { error: updateError } = await supabase
          .from('teams')
          .update({ score: totalScore })
          .eq('id', team.id)
        
        if (!updateError) {
          team.score = totalScore
        }
      }
    }

    if (error && error.code === 'PGRST116') {
      // Team doesn't exist, create it
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({
          team_number: teamId,
          budget: 1000,
          score: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating team:', createError)
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
      }

      team = newTeam
    } else if (error) {
      console.error('Error fetching team:', error)
      return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }

    // Get team's decisions and purchases
    const { data: decisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('team_id', team.id)

    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('team_id', team.id)

    return NextResponse.json({
      team,
      decisions: decisions || [],
      purchases: purchases || []
    })

  } catch (error) {
    console.error('Team API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/teams/[teamId] - Update team (budget, score, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId)
    const body = await request.json()
    
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    const { data: team, error } = await supabase
      .from('teams')
      .update(body)
      .eq('team_number', teamId)
      .select()
      .single()

    if (error) {
      console.error('Error updating team:', error)
      return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
    }

    return NextResponse.json({ team })

  } catch (error) {
    console.error('Team update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
