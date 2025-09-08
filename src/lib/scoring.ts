import { Decision, Team, Statement } from '@/types/game'

export interface ScoringConfig {
  correctTrueFalse: number
  correctUnknown: number
  incorrect: number
  noAnswer: number
  efficiencyBonusPerUnused10: number
  efficiencyBonusPerUnused30s: number
  minAttemptsForBonus: number
  minPercentageForBonus: number
}

export const DEFAULT_SCORING: ScoringConfig = {
  correctTrueFalse: 100,
  correctUnknown: 70,
  incorrect: -80,
  noAnswer: -20,
  efficiencyBonusPerUnused10: 1,
  efficiencyBonusPerUnused30s: 1,
  minAttemptsForBonus: 12,
  minPercentageForBonus: 80
}

export class ScoringEngine {
  private config: ScoringConfig

  constructor(config: ScoringConfig = DEFAULT_SCORING) {
    this.config = config
  }

  calculateDecisionScore(
    choice: 'true' | 'false' | 'unknown',
    truthLabel: 'true' | 'false' | 'unknowable'
  ): number {
    // Handle 'unknowable' truth label mapping to 'unknown' choice
    const normalizedTruthLabel = truthLabel === 'unknowable' ? 'unknown' : truthLabel
    const correct = choice === normalizedTruthLabel
    
    if (correct) {
      return choice === 'unknown' ? this.config.correctUnknown : this.config.correctTrueFalse
    }
    
    return this.config.incorrect
  }

  calculateTeamScore(
    decisions: Decision[],
    team: Team,
    totalStatements: number,
    sessionDurationSeconds: number
  ): {
    baseScore: number
    efficiencyBonus: number
    totalScore: number
    breakdown: {
      correctAnswers: number
      incorrectAnswers: number
      unknownAnswers: number
      noAnswers: number
    }
  } {
    // Calculate base score from decisions
    let baseScore = 0
    let correctAnswers = 0
    let incorrectAnswers = 0
    let unknownAnswers = 0

    decisions.forEach(decision => {
      baseScore += decision.pointsAwarded
      
      if (decision.correct) {
        if (decision.choice === 'unknown') {
          unknownAnswers++
        } else {
          correctAnswers++
        }
      } else {
        incorrectAnswers++
      }
    })

    // Calculate penalty for unanswered statements
    const noAnswers = totalStatements - decisions.length
    baseScore += noAnswers * this.config.noAnswer

    // Calculate efficiency bonus
    let efficiencyBonus = 0
    const attemptedStatements = decisions.length
    const attemptPercentage = (attemptedStatements / totalStatements) * 100

    if (attemptedStatements >= this.config.minAttemptsForBonus || 
        attemptPercentage >= this.config.minPercentageForBonus) {
      
      // Budget efficiency bonus
      const unusedBudget = team.budgetRemaining
      const budgetBonus = Math.floor(unusedBudget / 10) * this.config.efficiencyBonusPerUnused10

      // Time efficiency bonus (if applicable)
      const unusedTime = team.timeRemaining
      const timeBonus = Math.floor(unusedTime / 30) * this.config.efficiencyBonusPerUnused30s

      efficiencyBonus = budgetBonus + timeBonus
    }

    return {
      baseScore,
      efficiencyBonus,
      totalScore: baseScore + efficiencyBonus,
      breakdown: {
        correctAnswers,
        incorrectAnswers,
        unknownAnswers,
        noAnswers
      }
    }
  }

  calculateLeaderboard(
    teams: Team[],
    decisions: Record<string, Decision[]>,
    totalStatements: number,
    sessionDurationSeconds: number
  ): Array<{
    team: Team
    score: ReturnType<typeof this.calculateTeamScore>
    rank: number
  }> {
    const teamScores = teams.map(team => ({
      team,
      score: this.calculateTeamScore(
        decisions[team.id] || [],
        team,
        totalStatements,
        sessionDurationSeconds
      ),
      rank: 0
    }))

    // Sort by total score (descending), then by completed statements (descending)
    teamScores.sort((a, b) => {
      if (b.score.totalScore !== a.score.totalScore) {
        return b.score.totalScore - a.score.totalScore
      }
      return b.team.completedStatements - a.team.completedStatements
    })

    // Assign ranks
    teamScores.forEach((teamScore, index) => {
      teamScore.rank = index + 1
    })

    return teamScores
  }
}

export class TeamRotationManager {
  static advanceDecider(team: Team): { newPointer: number; newDecider: string } {
    const newPointer = (team.deciderPointer + 1) % team.deciderOrder.length
    const newDecider = team.deciderOrder[newPointer]
    
    return { newPointer, newDecider }
  }

  static skipDecider(team: Team): { newPointer: number; newDecider: string } {
    // Same as advance - skip just means move to next person
    return this.advanceDecider(team)
  }

  static getCurrentDecider(team: Team): string {
    if (team.deciderOrder.length === 0) return ''
    return team.deciderOrder[team.deciderPointer]
  }

  static getNextDecider(team: Team): string {
    if (team.deciderOrder.length === 0) return ''
    const nextPointer = (team.deciderPointer + 1) % team.deciderOrder.length
    return team.deciderOrder[nextPointer]
  }

  static shuffleDeciderOrder(members: string[]): string[] {
    const shuffled = [...members]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  static validateDeciderOrder(members: string[], deciderOrder: string[]): boolean {
    if (members.length !== deciderOrder.length) return false
    
    const memberSet = new Set(members)
    const deciderSet = new Set(deciderOrder)
    
    return memberSet.size === deciderSet.size && 
           [...memberSet].every(member => deciderSet.has(member))
  }
}

export interface GameAnalytics {
  sessionStats: {
    totalTeams: number
    totalStatements: number
    totalDecisions: number
    avgScore: number
    avgAccuracy: number
    avgThroughput: number
  }
  teamPerformance: Array<{
    teamId: string
    teamName: string
    score: number
    accuracy: number
    throughput: number
    budgetEfficiency: number
  }>
  statementAnalytics: Array<{
    statementId: string
    statementText: string
    correctAnswers: number
    incorrectAnswers: number
    unknownAnswers: number
    avgTimeToDecision: number
    mostPurchasedItems: string[]
  }>
  itemAnalytics: Array<{
    itemId: string
    itemName: string
    purchaseCount: number
    avgDeliveryTime: number
    successRate: number // % of teams that got correct answer after purchasing
  }>
}

export class AnalyticsEngine {
  static generateGameAnalytics(
    teams: Team[],
    statements: Statement[],
    decisions: Decision[],
    // purchases: Purchase[]
  ): GameAnalytics {
    const totalDecisions = decisions.length
    const totalScore = teams.reduce((sum, team) => sum + team.score, 0)
    const avgScore = teams.length > 0 ? totalScore / teams.length : 0

    // Calculate accuracy
    const correctDecisions = decisions.filter(d => d.correct).length
    const avgAccuracy = totalDecisions > 0 ? (correctDecisions / totalDecisions) * 100 : 0

    // Calculate throughput
    const totalStatements = teams.reduce((sum, team) => sum + team.completedStatements, 0)
    const avgThroughput = teams.length > 0 ? totalStatements / teams.length : 0

    const teamPerformance = teams.map(team => {
      const teamDecisions = decisions.filter(d => d.teamId === team.id)
      const teamCorrect = teamDecisions.filter(d => d.correct).length
      const teamAccuracy = teamDecisions.length > 0 ? (teamCorrect / teamDecisions.length) * 100 : 0
      const budgetUsed = 1000 - team.budgetRemaining
      const budgetEfficiency = budgetUsed > 0 ? team.score / budgetUsed : 0

      return {
        teamId: team.id,
        teamName: team.name,
        score: team.score,
        accuracy: teamAccuracy,
        throughput: team.completedStatements,
        budgetEfficiency
      }
    })

    const statementAnalytics = statements.map(statement => {
      const statementDecisions = decisions.filter(d => d.statementId === statement.id)
      const correct = statementDecisions.filter(d => d.choice === statement.truthLabel).length
      const incorrect = statementDecisions.filter(d => d.choice !== statement.truthLabel && d.choice !== 'unknown').length
      const unknown = statementDecisions.filter(d => d.choice === 'unknown').length

      return {
        statementId: statement.id,
        statementText: statement.text,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        unknownAnswers: unknown,
        avgTimeToDecision: 0, // Would need timestamp analysis
        mostPurchasedItems: statement.recommendedItems.slice(0, 3)
      }
    })

    return {
      sessionStats: {
        totalTeams: teams.length,
        totalStatements: statements.length,
        totalDecisions,
        avgScore,
        avgAccuracy,
        avgThroughput
      },
      teamPerformance,
      statementAnalytics,
      itemAnalytics: [] // Would need purchase data
    }
  }
}
