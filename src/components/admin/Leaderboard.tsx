'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  DollarSign, 
  Target,
  Clock
} from 'lucide-react'
import { Team } from '@/types/game'
import { formatCurrency } from '@/lib/utils'

interface LeaderboardProps {
  teams: Team[]
  showDetailed?: boolean
}

interface TeamRankingProps {
  team: Team
  rank: number
  showDetailed: boolean
}

function TeamRanking({ team, rank, showDetailed }: TeamRankingProps) {
  const budgetUsed = 1000 - team.budgetRemaining
  const efficiency = team.completedStatements > 0 ? team.score / budgetUsed : 0
  const accuracy = team.completedStatements > 0 ? (team.score / (team.completedStatements * 100)) * 100 : 0

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Award className="h-5 w-5 text-amber-600" />
      default: return <div className="h-5 w-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</div>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-50 border-yellow-200'
      case 2: return 'bg-gray-50 border-gray-200'
      case 3: return 'bg-amber-50 border-amber-200'
      default: return 'bg-white border-gray-200'
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getRankColor(rank)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getRankIcon(rank)}
          <div>
            <h3 className="font-semibold text-lg">{team.name}</h3>
            <div className="text-sm text-gray-600">
              {team.members.length} members
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{team.score}</div>
          <div className="text-sm text-gray-600">points</div>
        </div>
      </div>

      {showDetailed && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{team.completedStatements}</div>
            <div className="text-xs text-gray-600">Statements</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold">{accuracy.toFixed(0)}%</div>
            <div className="text-xs text-gray-600">Accuracy</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(budgetUsed)}</div>
            <div className="text-xs text-gray-600">Spent</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold">{efficiency.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Efficiency</div>
          </div>
        </div>
      )}

      {!showDetailed && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{team.completedStatements} statements</span>
          <span>{formatCurrency(budgetUsed)} spent</span>
          <span>{accuracy.toFixed(0)}% accuracy</span>
        </div>
      )}
    </div>
  )
}

export function Leaderboard({ teams, showDetailed = false }: LeaderboardProps) {
  const sortedTeams = [...teams].sort((a, b) => {
    // Primary sort: Score (descending)
    if (b.score !== a.score) return b.score - a.score
    
    // Secondary sort: Completed statements (descending)
    if (b.completedStatements !== a.completedStatements) {
      return b.completedStatements - a.completedStatements
    }
    
    // Tertiary sort: Budget remaining (ascending - less spent is better)
    return b.budgetRemaining - a.budgetRemaining
  })

  const topTeam = sortedTeams[0]
  const avgScore = teams.length > 0 ? teams.reduce((sum, team) => sum + team.score, 0) / teams.length : 0
  const totalStatements = teams.reduce((sum, team) => sum + team.completedStatements, 0)
  const totalSpent = teams.reduce((sum, team) => sum + (1000 - team.budgetRemaining), 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Summary Stats */}
          {showDetailed && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
                <div className="text-sm text-gray-600">Active Teams</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{avgScore.toFixed(0)}</div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalStatements}</div>
                <div className="text-sm text-gray-600">Total Statements</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalSpent)}</div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
            </div>
          )}

          {/* Team Rankings */}
          <div className="space-y-3">
            {sortedTeams.map((team, index) => (
              <TeamRanking
                key={team.id}
                team={team}
                rank={index + 1}
                showDetailed={showDetailed}
              />
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No teams to display yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      {showDetailed && topTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Leading Team</span>
                </div>
                <div className="text-sm text-yellow-700">
                  <strong>{topTeam.name}</strong> is ahead with {topTeam.score} points
                  from {topTeam.completedStatements} statements.
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Accuracy Leaders</span>
                </div>
                <div className="text-sm text-blue-700">
                  Teams with highest accuracy are making strategic decisions
                  and using evidence effectively.
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Budget Efficiency</span>
                </div>
                <div className="text-sm text-green-700">
                  Average spend per team: {formatCurrency(totalSpent / teams.length)}
                  of $1,000 budget.
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Throughput</span>
                </div>
                <div className="text-sm text-purple-700">
                  Average {(totalStatements / teams.length).toFixed(1)} statements
                  completed per team.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
