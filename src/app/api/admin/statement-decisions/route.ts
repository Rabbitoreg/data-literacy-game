import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Fetch all statements
    const { data: statements, error: statementsError } = await supabase
      .from('statements')
      .select('id, text, topic, truth_label')
      .order('id')

    if (statementsError) {
      console.error('Error fetching statements:', statementsError)
      return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 })
    }

    // Fetch all decisions with team and user information
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select(`
        id,
        statement_id,
        choice,
        confidence,
        rationale,
        evidence_items,
        points_earned,
        decider_name,
        teams!inner(team_number)
      `)
      .order('statement_id, teams(team_number)')

    if (decisionsError) {
      console.error('Error fetching decisions:', decisionsError)
      return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 })
    }

    // Group decisions by statement and calculate agreement scores
    const statementDecisions = statements.map((statement: any) => {
      const statementDecisionsList = decisions?.filter((d: any) => d.statement_id === statement.id) || []
      
      // Calculate agreement score based on choice distribution
      const choiceCounts = {
        true: statementDecisionsList.filter(d => d.choice === 'true').length,
        false: statementDecisionsList.filter(d => d.choice === 'false').length,
        unknown: statementDecisionsList.filter(d => d.choice === 'unknown').length
      }
      
      const totalDecisions = statementDecisionsList.length
      let agreementScore = 0
      
      if (totalDecisions > 0) {
        // Calculate agreement as the proportion of the most common choice
        const maxCount = Math.max(choiceCounts.true, choiceCounts.false, choiceCounts.unknown)
        agreementScore = maxCount / totalDecisions
      }

      return {
        statement: {
          id: statement.id,
          text: statement.text,
          topic: statement.topic,
          truthLabel: statement.truth_label
        },
        decisions: statementDecisionsList.map((decision: any) => ({
          id: decision.id,
          team_number: decision.teams.team_number,
          choice: decision.choice,
          confidence: decision.confidence,
          rationale: decision.rationale,
          evidence_items: decision.evidence_items || [],
          points_earned: decision.points_earned || 0,
          decider_name: decision.decider_name || 'Unknown'
        })),
        agreement_score: agreementScore
      }
    })

    // Filter out statements with no decisions for cleaner display
    const statementsWithDecisions = statementDecisions.filter(s => s.decisions.length > 0)

    return NextResponse.json({
      statements: statementsWithDecisions,
      total_statements: statements.length,
      statements_with_decisions: statementsWithDecisions.length
    })

  } catch (error) {
    console.error('Error in statement-decisions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
