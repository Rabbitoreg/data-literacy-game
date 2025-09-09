import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/teams/[teamId]/decisions - Make a decision
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId)
    const { statementId, choice, rationale, confidence, deciderName } = await request.json()
    const statement_id = statementId
    
    console.log('Decision API - teamId:', teamId, 'statementId:', statement_id, 'choice:', choice)
    
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    if (!statement_id || !choice) {
      return NextResponse.json({ error: 'Statement ID and choice are required' }, { status: 400 })
    }

    if (!['true', 'false', 'unknown'].includes(choice.toLowerCase())) {
      return NextResponse.json({ error: 'Decision must be true, false, or unknown' }, { status: 400 })
    }

    // Get team (should exist from main route)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', teamId)
      .single()

    console.log('Team lookup result:', { team, teamError })

    if (teamError) {
      console.error('Error fetching team:', teamError)
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if decision already exists for this statement
    const { data: existingDecision } = await supabase
      .from('decisions')
      .select('*')
      .eq('team_id', team.id)
      .eq('statement_id', statement_id)
      .single()

    if (existingDecision) {
      return NextResponse.json({ error: 'Decision already made for this statement' }, { status: 400 })
    }

    // Create decision
    const { data: decision_record, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        team_id: team.id,
        statement_id: statement_id,
        choice: choice.toLowerCase(),
        rationale: rationale || 'Decision made via API',
        confidence: confidence || 50,
        decider_name: deciderName || 'Unknown'
      })
      .select()
      .single()

    if (decisionError) {
      console.error('Error creating decision:', decisionError)
      return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 })
    }

    return NextResponse.json({ decision: decision_record })

  } catch (error) {
    console.error('Decision API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/teams/[teamId]/decisions - Get team's decisions
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId)
    
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    // Get team (should exist from main route)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team:', teamError)
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get decisions
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('team_id', team.id)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching decisions:', error)
      return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 })
    }

    return NextResponse.json({ decisions: decisions || [] })

  } catch (error) {
    console.error('Decisions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
