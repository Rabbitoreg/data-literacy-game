import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Session {
  id: string
  title: string
  facilitator_name: string
  max_teams: number
  status: 'setup' | 'active' | 'completed'
  current_statement_index: number
  data_source: 'sample' | 'csv'
  csv_filename?: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  session_id: string
  name: string
  members: string[]
  budget: number
  score: number
  current_decider_index: number
  status: 'setup' | 'ready' | 'active'
  created_at: string
  updated_at: string
}

export interface Statement {
  id: string
  text: string
  topic: string
  difficulty: number
  ambiguity: number
  truth_label: boolean | null
  reason_key: string
  recommended_items: string[]
  created_at: string
}

export interface Item {
  id: string
  name: string
  description: string
  cost: number
  delivery_type: 'instant' | 'timed' | 'observable_cell'
  lead_time_minutes: number
  content?: string
  observable_config?: {
    notebook_id: string
    cells: string[]
    mode: 'iframe' | 'runtime'
    height?: number
  }
  created_at: string
}

export interface Purchase {
  id: string
  team_id: string
  item_id: string
  statement_id: string
  cost: number
  status: 'pending' | 'delivered'
  purchased_at: string
  delivered_at?: string
}

export interface Decision {
  id: string
  team_id: string
  statement_id: string
  choice: 'true' | 'false' | 'unknown'
  rationale: string
  confidence: number
  decider_name: string
  is_correct?: boolean
  points_earned: number
  submitted_at: string
}

export interface Round {
  id: string
  team_id: string
  statement_id: string
  status: 'active' | 'completed' | 'recalled'
  started_at: string
  completed_at?: string
}

// Helper functions for database operations
export const db = {

  // Sessions
  async getSession(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async updateSession(id: string, updates: Partial<Session>) {
    const { data, error } = await supabase
      .from('sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Teams
  async createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('teams')
      .insert([team])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getTeamsBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at')
    
    if (error) throw error
    return data
  },

  async updateTeam(id: string, updates: Partial<Team>) {
    const { data, error } = await supabase
      .from('teams')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Statements
  async getStatements() {
    const { data, error } = await supabase
      .from('statements')
      .select('*')
      .order('id')
    
    if (error) throw error
    return data
  },

  // Items
  async getItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('cost')
    
    if (error) throw error
    return data
  },

  // Purchases
  async createPurchase(purchase: Omit<Purchase, 'id' | 'purchased_at'>) {
    const { data, error } = await supabase
      .from('purchases')
      .insert([{ ...purchase, purchased_at: new Date().toISOString() }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getPurchasesByTeam(teamId: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        items (*)
      `)
      .eq('team_id', teamId)
      .order('purchased_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Decisions
  async createDecision(decision: Omit<Decision, 'id' | 'submitted_at'>) {
    const { data, error } = await supabase
      .from('decisions')
      .insert([{ ...decision, submitted_at: new Date().toISOString() }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getDecisionsByTeam(teamId: string) {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('team_id', teamId)
      .order('submitted_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}
