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

      const purchasedItemIds = new Set(teamPurchases?.map(p => p.item_id) || [])

      // Filter items: show only those with no prerequisite OR whose prerequisite has been purchased
      availableItems = itemsWithCounts?.filter(item => {
        // If no prerequisite, item is always available
        if (!item.prerequisite_item_id) {
          return true
        }
        // If has prerequisite, check if team has purchased it
        return purchasedItemIds.has(item.prerequisite_item_id)
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
