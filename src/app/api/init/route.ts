import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    // Insert sample statements
    const statements = [
      {
        id: 'stmt_1',
        text: 'The pilot program increased sales by more than 15% in all regions.',
        topic: 'Sales Performance',
        difficulty: 3,
        ambiguity: 4,
        truth_label: false,
        reason_key: 'Regional variation exists',
        recommended_items: ['regional_breakdown', 'performance_metrics']
      },
      {
        id: 'stmt_2', 
        text: 'Training completion rates were consistently above 80% across all participant groups.',
        topic: 'Training Effectiveness',
        difficulty: 2,
        ambiguity: 3,
        truth_label: true,
        reason_key: 'High engagement recorded',
        recommended_items: ['training_data', 'completion_rates']
      }
    ]

    const { error: stmtError } = await supabase
      .from('statements')
      .upsert(statements)

    // Insert sample items
    const items = [
      {
        id: 'regional_breakdown',
        name: 'Regional Performance Breakdown',
        description: 'Detailed sales data by region and time period',
        cost: 150,
        delivery_type: 'instant',
        lead_time_minutes: 0,
        content: 'North: +12%, South: +18%, East: +8%, West: +22%'
      },
      {
        id: 'training_data',
        name: 'Training Completion Data',
        description: 'Complete training metrics and participant feedback',
        cost: 100,
        delivery_type: 'instant', 
        lead_time_minutes: 0,
        content: 'Average completion: 87%, Satisfaction: 4.2/5'
      }
    ]

    const { error: itemError } = await supabase
      .from('items')
      .upsert(items)

    return NextResponse.json({
      success: true,
      message: 'Database initialized with sample data',
      statements_error: stmtError?.message,
      items_error: itemError?.message
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
