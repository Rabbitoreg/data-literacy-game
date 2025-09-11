import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/teams/[teamId]/purchase-hint - Purchase a hint for a statement
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId)
    const body = await request.json()
    const { statementId } = body
    
    console.log('Purchase hint request:', { teamId, body, statementId })
    
    if (isNaN(teamId)) {
      console.log('Invalid team ID:', params.teamId)
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    if (!statementId) {
      console.log('Missing statement ID in request body:', body)
      return NextResponse.json({ error: 'Statement ID is required' }, { status: 400 })
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

    // Check if team has enough budget
    if ((team.budget ?? 0) < 10) {
      return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 })
    }

    // Check if hint already purchased for this statement
    const { data: existingHint } = await supabase
      .from('hint_purchases')
      .select('*')
      .eq('team_id', team.id)
      .eq('statement_id', statementId)
      .single()

    if (existingHint) {
      return NextResponse.json({ error: 'Hint already purchased for this statement' }, { status: 400 })
    }

    // Create hint purchase record
    const { error: hintError } = await supabase
      .from('hint_purchases')
      .insert({
        team_id: team.id,
        statement_id: statementId,
        cost: 10
      })

    if (hintError) {
      console.error('Error creating hint purchase:', hintError)
      return NextResponse.json({ error: 'Failed to purchase hint' }, { status: 500 })
    }

    // Update team budget
    const newBudget = (team.budget ?? 0) - 10
    const { error: budgetError } = await supabase
      .from('teams')
      .update({ budget: newBudget })
      .eq('id', team.id)

    if (budgetError) {
      console.error('Error updating team budget:', budgetError)
      return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
    }

    console.log(`Team ${teamId} purchased hint for statement ${statementId}. Budget: ${team.budget} -> ${newBudget}`)

    return NextResponse.json({ 
      success: true, 
      newBudget,
      message: 'Hint purchased successfully' 
    })

  } catch (error) {
    console.error('Purchase hint API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
