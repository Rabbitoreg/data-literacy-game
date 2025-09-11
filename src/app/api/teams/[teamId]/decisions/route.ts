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
    const { statementId, choice, rationale, confidence, deciderName, evidence_items } = await request.json()
    const statement_id = statementId
    
    // Processing decision submission
    
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

    // Get statement and check for evaluations in recommended_items
    const { data: statement, error: statementError } = await supabase
      .from('statements')
      .select('*')
      .eq('id', statement_id)
      .single()
    
    // Statement lookup completed

    let isCorrect = false
    let pointsAwarded = 0
    let feedback = ''
    let confidenceBoost = 0

    if (statement) {
      // Check if correct evidence items were used (10% confidence boost)
      console.log('Evidence check - evidence_items:', evidence_items)
      console.log('Evidence check - statement.recommended_items:', statement.recommended_items)
      
      if (evidence_items && evidence_items.length > 0 && statement.recommended_items) {
        const recommendedItems = statement.recommended_items.filter((item: string) => !item.startsWith('{'))
        console.log('Evidence check - filtered recommendedItems:', recommendedItems)
        
        // Check for exact matches
        const hasCorrectEvidence = evidence_items.some((item: string) => recommendedItems.includes(item))
        console.log('Evidence check - hasCorrectEvidence (exact):', hasCorrectEvidence)
        
        // Debug: show what we're comparing
        console.log('Evidence check - comparing:', { evidence_items, recommendedItems })
        
        if (hasCorrectEvidence) {
          confidenceBoost = 10
          console.log(`Evidence boost applied: +${confidenceBoost}% confidence for using correct evidence`)
        } else {
          console.log('No evidence boost - no matching items found')
        }
      } else {
        console.log('No evidence boost - missing evidence_items or recommended_items')
      }

      // Check for evaluations stored in recommended_items as JSON
      let evaluations = []
      try {
        if (statement.recommended_items && Array.isArray(statement.recommended_items) && statement.recommended_items.length > 0) {
          const lastItem = statement.recommended_items[statement.recommended_items.length - 1]
          if (typeof lastItem === 'string' && lastItem.startsWith('{')) {
            evaluations = JSON.parse(lastItem).evaluations || []
          }
        }
      } catch (e) {
        evaluations = []
      }

      // Find evaluation for this choice
      const evaluation = evaluations.find((e: any) => e.choice === choice.toLowerCase())
      
      // Calculate base points and apply confidence multiplier (with evidence boost)
      let basePoints = 0
      if (evaluation) {
        isCorrect = evaluation.isCorrect
        basePoints = evaluation.points
        feedback = evaluation.feedback
      } else {
        // Legacy fallback: check against statement's truthLabel
        const normalizedTruthLabel = statement.truthLabel === 'unknowable' ? 'unknown' : statement.truthLabel
        isCorrect = choice.toLowerCase() === normalizedTruthLabel
        basePoints = isCorrect ? (choice.toLowerCase() === 'unknown' ? 70 : 100) : -80
        feedback = isCorrect ? 'Correct answer!' : 'Incorrect answer.'
      }
      
      // Apply confidence multiplier with evidence boost: final score = base points * ((confidence + boost) / 100)
      const effectiveConfidence = Math.min(100, confidence + confidenceBoost)
      pointsAwarded = Math.round(basePoints * (effectiveConfidence / 100))
      
      console.log(`Points calculation: basePoints=${basePoints}, confidence=${confidence}, confidenceBoost=${confidenceBoost}, effectiveConfidence=${effectiveConfidence}, pointsAwarded=${pointsAwarded}`)
      
      if (confidenceBoost > 0) {
        feedback += ` Evidence bonus: +${confidenceBoost}% confidence boost for using recommended evidence.`
      }
    }

    // Create decision with evaluation results
    const { data: decision_record, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        team_id: team.id,
        statement_id: statement_id,
        choice: choice.toLowerCase(),
        rationale: rationale || 'Decision made via API',
        confidence: confidence || 50,
        decider_name: deciderName || 'Unknown',
        is_correct: isCorrect,
        points_earned: pointsAwarded,
        evidence_items: evidence_items || []
      })
      .select()
      .single()

    if (decisionError) {
      console.error('Error creating decision:', decisionError)
      return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 })
    }

    // Update team's total score by adding the points earned
    const newTotalScore = (team.score || 0) + pointsAwarded
    const { error: scoreUpdateError } = await supabase
      .from('teams')
      .update({ score: newTotalScore })
      .eq('id', team.id)

    if (scoreUpdateError) {
      console.error('Error updating team score:', scoreUpdateError)
      // Don't fail the request, just log the error
    }

    console.log(`Team ${teamId} score updated: ${team.score || 0} + ${pointsAwarded} = ${newTotalScore}`)

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
