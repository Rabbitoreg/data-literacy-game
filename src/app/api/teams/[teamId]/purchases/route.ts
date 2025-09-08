import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/teams/[teamId]/purchases - Purchase an item
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId)
    const { item_id, statement_id } = await request.json()
    
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    if (!item_id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Get team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team:', teamError)
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', item_id)
      .single()

    if (itemError) {
      console.error('Error fetching item:', itemError)
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check if team has enough budget
    if (team.budget < item.cost) {
      return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 })
    }

    // Check if item already purchased
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('team_id', team.id)
      .eq('item_id', item_id)
      .single()

    if (existingPurchase) {
      return NextResponse.json({ error: 'Item already purchased' }, { status: 400 })
    }

    // Create purchase and update team budget in a transaction-like manner
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        team_id: team.id,
        item_id: item_id,
        statement_id: statement_id || null,
        cost: item.cost
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError)
      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
    }

    // Update team budget
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ budget: team.budget - item.cost })
      .eq('id', team.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team budget:', updateError)
      // Try to rollback the purchase
      await supabase.from('purchases').delete().eq('id', purchase.id)
      return NextResponse.json({ error: 'Failed to update team budget' }, { status: 500 })
    }

    return NextResponse.json({ 
      purchase,
      team: updatedTeam,
      item
    })

  } catch (error) {
    console.error('Purchase API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/teams/[teamId]/purchases - Get team's purchases
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId)
    
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    // Get team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team:', teamError)
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get purchases with item details
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        *,
        item:items!inner (
          id,
          name,
          description,
          cost,
          content,
          delivery_type,
          lead_time_minutes,
          observablehq_url
        )
      `)
      .eq('team_id', team.id)
      .order('purchased_at', { ascending: false })

    if (error) {
      console.error('Error fetching purchases:', error)
      return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
    }

    return NextResponse.json({ purchases: purchases || [] })

  } catch (error) {
    console.error('Purchases API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
