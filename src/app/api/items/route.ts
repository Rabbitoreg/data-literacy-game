import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/items - Get available items with purchase counts, filtered by team prerequisites
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    // Get all items with purchase counts and prerequisite info
    const { data: itemsWithCounts, error } = await supabase
      .from('items')
      .select(`
        *,
        purchases:purchases(count)
      `)
      .order('cost', { ascending: true })

    if (error) {
      console.error('Error fetching items:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    let availableItems = itemsWithCounts || []

    // If teamId is provided, filter items based on prerequisites
    if (teamId) {
      // Get items purchased by this team
      const { data: teamPurchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('item_id')
        .eq('team_id', teamId)

      if (purchasesError) {
        console.error('Error fetching team purchases:', purchasesError)
        return NextResponse.json({ error: 'Failed to fetch team purchases' }, { status: 500 })
      }

      // Get statements answered by this team
      const { data: teamDecisions, error: decisionsError } = await supabase
        .from('decisions')
        .select('statement_id')
        .eq('team_id', teamId)

      if (decisionsError) {
        console.error('Error fetching team decisions:', decisionsError)
        return NextResponse.json({ error: 'Failed to fetch team decisions' }, { status: 500 })
      }

      const purchasedItemIds = new Set(teamPurchases?.map(p => p.item_id) || [])
      const answeredStatementIds = new Set(teamDecisions?.map(d => d.statement_id) || [])

      // Filter items: show only those where ALL prerequisites are met (AND logic)
      availableItems = itemsWithCounts?.filter(item => {
        // Check item prerequisite
        const itemPrereqMet = !item.prerequisite_item_id || purchasedItemIds.has(item.prerequisite_item_id)
        
        // Check statement prerequisite
        const statementPrereqMet = !item.prerequisite_statement_id || answeredStatementIds.has(item.prerequisite_statement_id)
        
        // Both prerequisites must be met (AND logic)
        return itemPrereqMet && statementPrereqMet
      }) || []
    }

    // Transform the data to include purchase_count
    const items = availableItems.map(item => ({
      ...item,
      purchase_count: item.purchases?.[0]?.count || 0
    }))

    return NextResponse.json({ items })

  } catch (error) {
    console.error('Items API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
