import { NextRequest, NextResponse } from 'next/server'
import { db, supabase } from '@/lib/supabase'
import { DataProcessor } from '@/lib/data-processor'
import { nanoid } from 'nanoid'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const body = await request.json()
    const { 
      title, 
      mode = 'practice', 
      maxTeams = 20,
      useCSVData = false,
      statementsCSV,
      itemsCSV 
    } = body

    console.log('Creating session with ID:', sessionId)
    console.log('Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })

    // Create session - let Supabase generate UUID, then update our sessionId
    const { data: session, error } = await supabase
      .from('sessions')
      .insert([{
        title,
        facilitator_name: 'Admin',
        max_teams: maxTeams,
        status: 'setup',
        current_statement_index: 0,
        data_source: useCSVData ? 'csv' : 'sample'
      }])
      .select()
      .single()

    if (error) {
      console.error('Session creation error:', error)
      throw new Error(`Session creation failed: ${error.message}`)
    }

    console.log('Session created successfully:', session)

    // Store the mapping between frontend ID and database UUID in session storage
    // For now, we'll use the database UUID as the session ID going forward
    const actualSessionId = session.id

    // Get sample data counts
    const { data: statements } = await supabase.from('statements').select('id')
    const { data: items } = await supabase.from('items').select('id')

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        // Use the database UUID as the session ID
        id: actualSessionId
      },
      statementsCount: statements?.length || 0,
      itemsCount: items?.length || 0
    })

  } catch (error) {
    console.error('Session setup error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup session',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    const session = await db.getSession(sessionId)
    const teams = await db.getTeamsBySession(sessionId)
    const statements = await db.getStatements()
    const items = await db.getItems()

    return NextResponse.json({
      session,
      statementsCount: statements.length,
      itemsCount: items.length,
      teamsCount: teams.length
    })

  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
