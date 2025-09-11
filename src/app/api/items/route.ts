import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/items - Get all available items with purchase counts
export async function GET(request: NextRequest) {
  try {
    // Get items with purchase counts
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

    // Transform the data to include purchase_count
    const items = (itemsWithCounts || []).map(item => ({
      ...item,
      purchase_count: item.purchases?.[0]?.count || 0
    }))

    return NextResponse.json({ items })

  } catch (error) {
    console.error('Items API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
