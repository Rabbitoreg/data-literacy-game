import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { name } = await request.json()
    const teamId = params.teamId

    if (!name || !teamId) {
      return NextResponse.json({ error: 'Name and team ID required' }, { status: 400 })
    }

    // Get current team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', parseInt(teamId))
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Add member to team if not already present
    const currentMembers = team.members || []
    if (!currentMembers.includes(name)) {
      const updatedMembers = [...currentMembers, name]
      
      const { error: updateError } = await supabase
        .from('teams')
        .update({ 
          members: updatedMembers,
          // Initialize decider order if empty
          deciderorder: team.deciderorder?.length ? team.deciderorder : updatedMembers
        })
        .eq('id', team.id)

      if (updateError) {
        console.error('Error updating team:', updateError)
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
