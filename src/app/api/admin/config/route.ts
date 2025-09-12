import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('game_config')
      .select('*')
    
    if (error) {
      console.error('Error fetching config:', error)
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
    }

    // Convert to key-value object
    const config = data.reduce((acc: any, item: any) => {
      acc[item.key] = item.value
      return acc
    }, {})

    const response = NextResponse.json(config)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error in config GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json()
    
    const upsertData = Object.entries(updates).map(([key, value]) => ({
      key,
      value: String(value)
    }))

    const { error } = await supabase
      .from('game_config')
      .upsert(upsertData)
    
    if (error) {
      console.error('Error updating config:', error)
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in config POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
