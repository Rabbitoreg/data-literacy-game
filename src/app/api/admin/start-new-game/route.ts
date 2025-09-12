import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public'
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'admin-api'
      }
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { maxTeams } = await request.json()

    if (!maxTeams || maxTeams < 1 || maxTeams > 20) {
      return NextResponse.json({ error: 'Invalid number of teams (1-20 allowed)' }, { status: 400 })
    }

    console.log(`Starting new game with ${maxTeams} teams (type: ${typeof maxTeams})`)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Expected project ID: ddbwslrralhuuncgcppp')
    console.log('Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'YES' : 'NO')
    
    // Execute deletions using a more reliable approach
    try {
      // Check database connection info
      const { data: dbInfo } = await supabase.rpc('version')
      console.log('Database version:', dbInfo)
      
      // 1. Get all existing teams first to see what we're working with
      const { data: existingTeams } = await supabase.from('teams').select('id, team_number')
      console.log('Existing teams before deletion:', existingTeams)
      
      // 2. Try direct SQL deletion instead of Supabase client methods
      if (existingTeams && existingTeams.length > 0) {
        console.log('Attempting direct SQL deletion...')
        const { data: sqlResult, error: sqlError } = await supabase
          .rpc('exec', { 
            sql: 'DELETE FROM teams WHERE team_number >= 1 RETURNING team_number;' 
          })
        
        if (sqlError) {
          console.error('SQL deletion error:', sqlError)
          // Fallback to individual deletions
          for (const team of existingTeams) {
            const { error } = await supabase.from('teams').delete().eq('id', team.id)
            if (error) {
              console.error(`Error deleting team ${team.team_number}:`, error)
            } else {
              console.log(`Successfully deleted team ${team.team_number} (ID: ${team.id})`)
            }
          }
        } else {
          console.log('SQL deletion result:', sqlResult)
        }
      }
      
      // Verify deletion worked
      const { data: remainingTeams } = await supabase.from('teams').select('id, team_number')
      console.log('Teams remaining after deletion:', remainingTeams)
      
      // 3. Clear other data using similar approach
      const { data: decisions } = await supabase.from('decisions').select('id')
      if (decisions && decisions.length > 0) {
        for (const decision of decisions) {
          await supabase.from('decisions').delete().eq('id', decision.id)
        }
      }
      
      const { data: purchases } = await supabase.from('purchases').select('id')
      if (purchases && purchases.length > 0) {
        for (const purchase of purchases) {
          await supabase.from('purchases').delete().eq('id', purchase.id)
        }
      }
      
      const { data: hintPurchases } = await supabase.from('hint_purchases').select('id')
      if (hintPurchases && hintPurchases.length > 0) {
        for (const hint of hintPurchases) {
          await supabase.from('hint_purchases').delete().eq('id', hint.id)
        }
      }
      
      console.log(`Creating ${maxTeams} new teams...`)
      
      // 4. Create new teams
      const teamsToCreate = []
      for (let i = 1; i <= maxTeams; i++) {
        teamsToCreate.push({
          team_number: i,
          members: [],
          deciderorder: [],
          budget: 1000,
          score: 0
        })
      }
      
      const { error: createError } = await supabase.from('teams').insert(teamsToCreate)
      if (createError) {
        console.error('Error creating teams:', createError)
        return NextResponse.json({ error: 'Failed to create teams' }, { status: 500 })
      }
      
      // Final verification - check total team count
      const { count: finalCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
      console.log(`Final team count in database: ${finalCount}`)
      
      // Wait a moment and check again to see if there's a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      const { count: delayedCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
      console.log(`Team count after 1 second delay: ${delayedCount}`)
      
      // 4. Update game configuration
      await supabase.from('game_config').upsert([
        { key: 'max_teams', value: maxTeams.toString() },
        { key: 'game_active', value: 'true' }
      ])
      
      console.log(`Game reset completed - created ${maxTeams} teams`)
      
      return NextResponse.json({ 
        success: true, 
        message: `New game started with ${maxTeams} teams`,
        teamsCreated: maxTeams,
        finalCount: finalCount,
        delayedCount: delayedCount
      })
      
    } catch (sqlError) {
      console.error('SQL execution error:', sqlError)
      return NextResponse.json({ error: 'Failed to execute reset operations' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error starting new game:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
