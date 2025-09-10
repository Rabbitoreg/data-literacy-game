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

// POST /api/statements/[statementId]/evaluations/bulk - Create/update multiple evaluations at once
export async function POST(request: Request, { params }: { params: { statementId: string } }) {
  try {
    const { statementId } = params
    const { evaluations } = await request.json()
    
    console.log('BULK API CALLED - statementId:', statementId)
    console.log('BULK API CALLED - evaluations:', evaluations)

    if (!Array.isArray(evaluations)) {
      return NextResponse.json({ 
        error: 'Evaluations must be an array' 
      }, { status: 400 })
    }

    // Validate each evaluation
    for (const evaluation of evaluations) {
      if (!evaluation.choice || typeof evaluation.isCorrect !== 'boolean' || typeof evaluation.points !== 'number') {
        return NextResponse.json({ 
          error: 'Each evaluation must have choice, isCorrect, and points' 
        }, { status: 400 })
      }

      if (!['true', 'false', 'unknown'].includes(evaluation.choice)) {
        return NextResponse.json({ 
          error: 'Choice must be true, false, or unknown' 
        }, { status: 400 })
      }
    }

    // Prepare data for upsert
    const evaluationData = evaluations.map(evaluation => ({
      statement_id: statementId,
      choice: evaluation.choice,
      is_correct: evaluation.isCorrect,
      points: evaluation.points,
      feedback: evaluation.feedback || ''
    }))

    // Get current statement to update metadata
    const { data: statement, error: fetchError } = await supabase
      .from('statements')
      .select('*')
      .eq('id', statementId)
      .single()

    if (fetchError || !statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    console.log('Current statement recommended_items:', statement.recommended_items)

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
    
    // Process each evaluation
    evaluations.forEach(evaluation => {
      const existingIndex = currentEvaluations.findIndex((e: any) => e.choice === evaluation.choice)
      
      const newEvaluation = {
        id: crypto.randomUUID(),
        statementId: statementId,
        choice: evaluation.choice,
        isCorrect: evaluation.isCorrect,
        points: evaluation.points,
        feedback: evaluation.feedback || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        currentEvaluations[existingIndex] = { ...currentEvaluations[existingIndex], ...newEvaluation, updatedAt: new Date().toISOString() }
      } else {
        currentEvaluations.push(newEvaluation)
      }
    })

    // Store evaluations as JSON string in recommended_items array
    const updatedItems = [...currentItems, JSON.stringify({ evaluations: currentEvaluations })]

    console.log('About to save updated items:', updatedItems)
    console.log('Statement ID for update:', statementId)
    console.log('Supabase client config check - URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase client config check - Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // First check if statement exists
    const { data: existingStatement, error: checkError } = await supabase
      .from('statements')
      .select('id, recommended_items')
      .eq('id', statementId)
      .single()
    
    console.log('Statement exists check:', { 
      existingStatement: existingStatement ? { id: existingStatement.id, hasRecommendedItems: !!existingStatement.recommended_items } : null, 
      checkError 
    })
    
    if (checkError || !existingStatement) {
      console.log('Statement not found:', statementId)
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }
    
    // Update statement - back to regular update since upsert has RLS issues
    console.log('Attempting database update...')
    const { data: updateData, error: updateError, count: updateCount } = await supabase
      .from('statements')
      .update({ recommended_items: updatedItems })
      .eq('id', statementId)
      .select('id, recommended_items')
    
    console.log('Raw update result:', { 
      updateData: updateData ? updateData.map(item => ({ id: item.id, hasRecommendedItems: !!item.recommended_items })) : null, 
      updateError, 
      updateCount,
      updateErrorDetails: updateError ? { message: updateError.message, details: updateError.details, hint: updateError.hint, code: updateError.code } : null
    })
    
    // Then fetch the updated record separately to verify persistence
    console.log('Verifying update with fresh fetch...')
    const { data: updatedData, error: fetchAfterError } = await supabase
      .from('statements')
      .select('id, recommended_items')
      .eq('id', statementId)
      .single()
    
    console.log('Fetch after update:', { 
      updatedData: updatedData ? { 
        id: updatedData.id, 
        hasRecommendedItems: !!updatedData.recommended_items,
        recommendedItemsLength: updatedData.recommended_items?.length,
        lastItemIsJSON: updatedData.recommended_items?.[updatedData.recommended_items.length - 1]?.startsWith?.('{')
      } : null, 
      fetchAfterError 
    })

    if (updateError) {
      console.log('Error bulk saving statement evaluations:', updateError)
      console.log('Updated items that failed to save:', updatedItems)
      return NextResponse.json({ error: 'Failed to save evaluations' }, { status: 500 })
    }

    return NextResponse.json({ evaluations: currentEvaluations })

  } catch (error) {
    console.error('Bulk statement evaluation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
