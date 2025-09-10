import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Ensure we have the required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable - required for admin operations')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/statements/[statementId]/evaluations - Get all evaluations for a statement
export async function GET(
  request: NextRequest,
  { params }: { params: { statementId: string } }
) {
  try {
    const { statementId } = params
    console.log('Fetching evaluations for statement:', statementId)

    // First, let's test if we can access any table
    const { data: testData, error: testError } = await supabase
      .from('statements')
      .select('id')
      .limit(1)

    console.log('Test query result:', { testData, testError })

    // Use existing statements table to store evaluation data as JSON
    const { data: statement, error } = await supabase
      .from('statements')
      .select('*')
      .eq('id', statementId)
      .single()

    if (error || !statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    // Get evaluations from recommended_items field (repurpose as JSON storage)
    let evaluations = []
    try {
      // Try to parse recommended_items as JSON for evaluations
      if (statement.recommended_items && Array.isArray(statement.recommended_items) && statement.recommended_items.length > 0) {
        const lastItem = statement.recommended_items[statement.recommended_items.length - 1]
        if (typeof lastItem === 'string' && lastItem.startsWith('{')) {
          evaluations = JSON.parse(lastItem).evaluations || []
        }
      }
    } catch (e) {
      evaluations = []
    }

    console.log('Evaluations query result:', { 
      evaluations, 
      error: null, 
      recommended_items: statement.recommended_items,
      lastItem: statement.recommended_items?.[statement.recommended_items.length - 1],
      isLastItemJSON: statement.recommended_items?.[statement.recommended_items.length - 1]?.startsWith?.('{')
    })

    return NextResponse.json({ evaluations })

  } catch (error) {
    console.error('Statement evaluations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/statements/[statementId]/evaluations - Create or update evaluation for a choice
export async function POST(
  request: NextRequest,
  { params }: { params: { statementId: string } }
) {
  try {
    const { statementId } = params
    const { choice, isCorrect, points, feedback } = await request.json()


    if (!choice || typeof isCorrect !== 'boolean' || typeof points !== 'number') {
      return NextResponse.json({ 
        error: 'Choice, isCorrect, and points are required' 
      }, { status: 400 })
    }

    if (!['true', 'false', 'unknown'].includes(choice)) {
      return NextResponse.json({ 
        error: 'Choice must be true, false, or unknown' 
      }, { status: 400 })
    }

    // Get current statement to update metadata
    const { data: statement, error: fetchError } = await supabase
      .from('statements')
      .select('*')
      .eq('id', statementId)
      .single()

    if (fetchError || !statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    // Get current evaluations from recommended_items
    let currentEvaluations = []
    let currentItems = [...(statement.recommended_items || [])]
    
    try {
      if (currentItems.length > 0) {
        const lastItem = currentItems[currentItems.length - 1]
        if (typeof lastItem === 'string' && lastItem.startsWith('{')) {
          currentEvaluations = JSON.parse(lastItem).evaluations || []
          currentItems.pop() // Remove the JSON item
        }
      }
    } catch (e) {
      currentEvaluations = []
    }

    const existingIndex = currentEvaluations.findIndex((e: any) => e.choice === choice)
    
    const newEvaluation = {
      id: crypto.randomUUID(),
      statementId: statementId,
      choice,
      isCorrect: isCorrect,
      points,
      feedback: feedback || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      currentEvaluations[existingIndex] = { ...currentEvaluations[existingIndex], ...newEvaluation, updatedAt: new Date().toISOString() }
    } else {
      currentEvaluations.push(newEvaluation)
    }

    // Store evaluations as JSON string in recommended_items array
    const updatedItems = [...currentItems, JSON.stringify({ evaluations: currentEvaluations })]

    // Update statement
    const { data: evaluation, error } = await supabase
      .from('statements')
      .update({ recommended_items: updatedItems })
      .eq('id', statementId)
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating statement evaluation:', error)
      return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 })
    }

    return NextResponse.json({ evaluation })

  } catch (error) {
    console.error('Statement evaluation creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/statements/[statementId]/evaluations?choice=true - Delete specific evaluation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { statementId: string } }
) {
  try {
    const { statementId } = params
    const { searchParams } = new URL(request.url)
    const choice = searchParams.get('choice')

    if (!choice) {
      return NextResponse.json({ error: 'Choice parameter is required' }, { status: 400 })
    }

    // Get current statement to update metadata
    const { data: statement, error: fetchError } = await supabase
      .from('statements')
      .select('*')
      .eq('id', statementId)
      .single()

    if (fetchError || !statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    // Get current evaluations from recommended_items
    let currentEvaluations = []
    let currentItems = [...(statement.recommended_items || [])]
    
    try {
      if (currentItems.length > 0) {
        const lastItem = currentItems[currentItems.length - 1]
        if (typeof lastItem === 'string' && lastItem.startsWith('{')) {
          currentEvaluations = JSON.parse(lastItem).evaluations || []
          currentItems.pop() // Remove the JSON item
        }
      }
    } catch (e) {
      currentEvaluations = []
    }

    // Remove evaluation
    const filteredEvaluations = currentEvaluations.filter((e: any) => e.choice !== choice)

    // Store updated evaluations
    const updatedItems = [...currentItems, JSON.stringify({ evaluations: filteredEvaluations })]

    // Update statement
    const { error } = await supabase
      .from('statements')
      .update({ recommended_items: updatedItems })
      .eq('id', statementId)

    if (error) {
      console.error('Error deleting statement evaluation:', error)
      return NextResponse.json({ error: 'Failed to delete evaluation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Statement evaluation deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
