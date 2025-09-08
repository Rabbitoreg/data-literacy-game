import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { db, supabase } from './supabase'
import type { WSEvent, GameState, TeamState } from '@/types/game'

export class GameSocketServer {
  private io: SocketIOServer
  private gameStates: Map<string, GameState> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://your-domain.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Join session/team
      socket.on('join_session', async (data: { sessionId: string, teamId?: string, role: 'team' | 'admin' }) => {
        try {
          socket.join(data.sessionId)
          socket.data.sessionId = data.sessionId
          socket.data.role = data.role

          if (data.teamId) {
            socket.join(`team_${data.teamId}`)
            socket.data.teamId = data.teamId
          }

          // Send current game state
          const gameState = await this.getGameState(data.sessionId)
          socket.emit('state:update', gameState)

          if (data.teamId) {
            const teamState = await this.getTeamState(data.teamId)
            socket.emit('team:state', teamState)
          }

          console.log(`Client ${socket.id} joined session ${data.sessionId} as ${data.role}`)
        } catch (error) {
          console.error('Error joining session:', error)
          socket.emit('error', { message: 'Failed to join session' })
        }
      })

      // Team setup
      socket.on('team:setup', async (data: { teamName: string, members: string[] }) => {
        try {
          const { teamId } = socket.data
          if (!teamId) return

          const shuffledMembers = [...data.members].sort(() => Math.random() - 0.5)
          
          await db.updateTeam(teamId, {
            name: data.teamName,
            members: shuffledMembers,
            status: 'ready'
          })

          const teamState = await this.getTeamState(teamId)
          this.io.to(`team_${teamId}`).emit('team:state', teamState)

          const gameState = await this.getGameState(socket.data.sessionId)
          this.io.to(socket.data.sessionId).emit('state:update', gameState)

        } catch (error) {
          console.error('Error setting up team:', error)
          socket.emit('error', { message: 'Failed to setup team' })
        }
      })

      // Purchase item
      socket.on('team:purchase', async (data: { itemId: string, statementId: string }) => {
        try {
          const { teamId, sessionId } = socket.data
          if (!teamId) return

          // Get team and item data
          const { data: teams } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single()

          const { data: items } = await supabase
            .from('items')
            .select('*')
            .eq('id', data.itemId)
            .single()
          
          if (!teams || !items) {
            socket.emit('error', { message: 'Team or item not found' })
            return
          }

          if (teams.budget < items.cost) {
            socket.emit('error', { message: 'Insufficient budget' })
            return
          }

          // Create purchase
          await db.createPurchase({
            team_id: teamId,
            item_id: data.itemId,
            statement_id: data.statementId,
            cost: items.cost,
            status: 'pending'
          })

          // Update team budget
          await db.updateTeam(teamId, {
            budget: teams.budget - items.cost
          })

          // Schedule delivery
          setTimeout(async () => {
            const { data: purchase } = await supabase
              .from('purchases')
              .update({ 
                status: 'delivered',
                delivered_at: new Date().toISOString()
              })
              .eq('team_id', teamId)
              .eq('item_id', data.itemId)
              .eq('statement_id', data.statementId)
              .select()
              .single()

            const teamState = await this.getTeamState(teamId)
            this.io.to(`team_${teamId}`).emit('team:state', teamState)
            this.io.to(`team_${teamId}`).emit('purchase:delivered', {
              purchaseId: purchase?.id,
              item: {
                id: items.id,
                name: items.name,
                content: items.content,
                observableConfig: items.observable_config
              }
            })
          }, items.lead_time_minutes * 60 * 1000)

          const teamState = await this.getTeamState(teamId)
          this.io.to(`team_${teamId}`).emit('team:state', teamState)

          const gameState = await this.getGameState(sessionId)
          this.io.to(sessionId).emit('state:update', gameState)

        } catch (error) {
          console.error('Error purchasing item:', error)
          socket.emit('error', { message: 'Failed to purchase item' })
        }
      })

      // Submit decision
      socket.on('team:decision', async (data: { 
        statementId: string, 
        choice: 'true' | 'false' | 'unknown', 
        rationale: string,
        confidence: number,
        deciderName: string
      }) => {
        try {
          const { teamId, sessionId } = socket.data
          if (!teamId) return

          const { data: statement } = await supabase
            .from('statements')
            .select('*')
            .eq('id', data.statementId)
            .single()
          
          if (!statement) {
            socket.emit('error', { message: 'Statement not found' })
            return
          }

          // Calculate points
          let pointsAwarded = 0
          const isCorrect = statement.truth_label === null 
            ? data.choice === 'unknown'
            : (data.choice === 'true') === statement.truth_label

          if (isCorrect) {
            pointsAwarded = statement.truth_label === null ? 70 : 100
          } else {
            pointsAwarded = -80
          }

          await db.createDecision({
            team_id: teamId,
            statement_id: data.statementId,
            choice: data.choice,
            rationale: data.rationale,
            confidence: data.confidence,
            decider_name: data.deciderName,
            points_earned: pointsAwarded
          })

          // Update team score and advance decider
          const { data: team } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single()

          if (team) {
            const members = team.members as string[]
            const newDeciderIndex = (team.current_decider_index + 1) % members.length

            await db.updateTeam(teamId, {
              score: team.score + pointsAwarded,
              current_decider_index: newDeciderIndex
            })
          }

          const teamState = await this.getTeamState(teamId)
          this.io.to(`team_${teamId}`).emit('team:state', teamState)

          const gameState = await this.getGameState(sessionId)
          this.io.to(sessionId).emit('state:update', gameState)

        } catch (error) {
          console.error('Error submitting decision:', error)
          socket.emit('error', { message: 'Failed to submit decision' })
        }
      })

      // Admin controls
      socket.on('admin:start_round', async (data: { duration: number }) => {
        try {
          const { sessionId } = socket.data
          if (!sessionId) return

          await db.updateSession(sessionId, {
            status: 'active'
          })

          this.io.to(sessionId).emit('macro_round:start', { duration: data.duration })

          // Set timer for round end
          const timer = setTimeout(() => {
            this.io.to(sessionId).emit('macro_round:recall')
          }, data.duration * 60 * 1000)

          this.timers.set(sessionId, timer)

          const gameState = await this.getGameState(sessionId)
          this.io.to(sessionId).emit('state:update', gameState)

        } catch (error) {
          console.error('Error starting round:', error)
          socket.emit('error', { message: 'Failed to start round' })
        }
      })

      socket.on('admin:broadcast', (data: { message: string }) => {
        const { sessionId } = socket.data
        if (sessionId) {
          this.io.to(sessionId).emit('broadcast', data)
        }
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  private async getGameState(sessionId: string): Promise<GameState> {
    const session = await db.getSession(sessionId)
    const teams = await db.getTeamsBySession(sessionId)
    const statements = await db.getStatements()
    const items = await db.getItems()

    return {
      session: {
        id: session.id,
        title: session.title,
        status: session.status as 'setup' | 'active' | 'completed',
        currentStatementIndex: session.current_statement_index,
        maxTeams: session.max_teams
      },
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        score: team.score,
        budgetRemaining: team.budget,
        status: team.status,
        memberCount: team.members.length,
        currentDecider: team.members[team.current_decider_index] || 'Unknown'
      })),
      statements: statements.map(stmt => ({
        id: stmt.id,
        text: stmt.text,
        topic: stmt.topic,
        difficulty: stmt.difficulty,
        ambiguity: stmt.ambiguity,
        recommendedItems: stmt.recommended_items
      })),
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        costMoney: item.cost,
        deliveryType: item.delivery_type,
        leadTimeMinutes: item.lead_time_minutes
      }))
    }
  }

  private async getTeamState(teamId: string): Promise<TeamState> {
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (!team) {
      throw new Error('Team not found')
    }

    const purchases = await db.getPurchasesByTeam(teamId)
    const decisions = await db.getDecisionsByTeam(teamId)
    const items = await db.getItems()

    const currentDecider = team.members[team.current_decider_index] || 'Unknown'

    return {
      team: {
        id: team.id,
        name: team.name,
        members: team.members,
        score: team.score,
        budgetRemaining: team.budget,
        currentDecider,
        status: team.status
      },
      purchases: purchases.map((p: any) => ({
        id: p.id,
        item: {
          id: p.items.id,
          name: p.items.name,
          content: p.items.content,
          observableConfig: p.items.observable_config
        },
        status: p.status,
        deliveredAt: p.delivered_at,
        purchasedAt: p.purchased_at
      })),
      decisions: decisions.map((d: any) => ({
        id: d.id,
        statementId: d.statement_id,
        choice: d.choice,
        rationale: d.rationale,
        confidence: d.confidence,
        deciderName: d.decider_name,
        pointsAwarded: d.points_earned,
        submittedAt: d.submitted_at
      })),
      availableItems: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        costMoney: item.cost,
        deliveryType: item.delivery_type,
        leadTimeMinutes: item.lead_time_minutes
      })),
      currentStatement: null,
      timeRemaining: null
    }
  }

  // Timer management
  startTimer(sessionId: string, duration: number) {
    const existingTimer = this.timers.get(sessionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    let timeLeft = duration
    const timer = setInterval(() => {
      timeLeft--
      this.io.to(sessionId).emit('timer:tick', { timeRemaining: timeLeft })
      
      if (timeLeft <= 0) {
        clearInterval(timer)
        this.timers.delete(sessionId)
        this.io.to(sessionId).emit('timer:end')
      }
    }, 1000)

    this.timers.set(sessionId, timer as any)
  }

  stopTimer(sessionId: string) {
    const timer = this.timers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(sessionId)
    }
  }
}

let gameSocketServer: GameSocketServer | null = null

export const initializeSocketServer = (server: HTTPServer) => {
  if (!gameSocketServer) {
    gameSocketServer = new GameSocketServer(server)
  }
  return gameSocketServer
}
