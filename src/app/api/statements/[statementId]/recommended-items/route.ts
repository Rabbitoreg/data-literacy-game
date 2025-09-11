import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/statements/[statementId]/recommended-items - Update recommended items
export async function POST(
  request: NextRequest,
  { params }: { params: { statementId: string } }
) {
  try {
    const { recommended_items } = await request.json()
    const statementId = params.statementId

    if (!statementId) {
      return NextResponse.json({ error: 'Statement ID is required' }, { status: 400 })
    }

    // Get current statement to preserve existing evaluations
    const { data: statement } = await supabase
      .from('statements')
      .select('recommended_items')
      .eq('id', statementId)
      .single()

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    // Preserve existing evaluations (JSON objects) and update item IDs
    const currentItems = statement.recommended_items || []
    const evaluationsJson = currentItems.find((item: string) => item.startsWith('{'))
    
    let newRecommendedItems = [...recommended_items]
    if (evaluationsJson) {
      newRecommendedItems.push(evaluationsJson)
    }

    // Update the statement
    const { error } = await supabase
      .from('statements')
      .update({ recommended_items: newRecommendedItems })
      .eq('id', statementId)

    if (error) {
      console.error('Error updating recommended items:', error)
      return NextResponse.json({ error: 'Failed to update recommended items' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Recommended items updated successfully',
      recommended_items: newRecommendedItems
    })

  } catch (error) {
    console.error('Recommended items API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
