import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/items - Get all available items
export async function GET(request: NextRequest) {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .order('cost', { ascending: true })

    if (error) {
      console.error('Error fetching items:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    return NextResponse.json({ items: items || [] })

  } catch (error) {
    console.error('Items API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
