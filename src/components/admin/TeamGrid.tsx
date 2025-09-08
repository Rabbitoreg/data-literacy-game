'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  DollarSign, 
  Target, 
  Clock, 
  AlertTriangle,
  Eye,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import { Team } from '@/types/game'
import { formatCurrency } from '@/lib/utils'

interface TeamGridProps {
  teams: Team[]
  onViewTeam: (teamId: string) => void
}

interface TeamTileProps {
  team: Team
  onView: () => void
}

function TeamTile({ team, onView }: TeamTileProps) {
  const budgetUsed = 1000 - team.budgetRemaining
  const budgetPercentage = (budgetUsed / 1000) * 100
  const isStalled = team.completedStatements === 0 && team.budgetRemaining < 1000
  const accuracy = team.score > 0 ? Math.min(100, (team.score / (team.completedStatements * 100)) * 100) : 0

  return (
    <Card className={`hover:shadow-md transition-shadow ${isStalled ? 'border-orange-300 bg-orange-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
        
        {isStalled && (
          <div className="flex items-center gap-1 text-orange-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Team may be stalled
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{team.completedStatements}</div>
            <div className="text-xs text-gray-600">Statements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{team.score}</div>
            <div className="text-xs text-gray-600">Score</div>
          </div>
        </div>

        {/* Budget Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Budget Used</span>
            <span>{formatCurrency(budgetUsed)} / $1,000</span>
          </div>
          <Progress value={budgetPercentage} className="h-2" />
        </div>

        {/* Accuracy */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Accuracy</span>
            <span>{accuracy.toFixed(0)}%</span>
          </div>
          <Progress value={accuracy} className="h-2" />
        </div>

        {/* Team Members */}
        <div>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <Users className="h-4 w-4" />
            Members ({team.members.length})
          </div>
          <div className="text-xs text-gray-500">
            Current Decider: {team.deciderOrder[team.deciderPointer]}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-1">
          {team.completedStatements > 0 && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
          
          {budgetUsed > 500 && (
            <Badge variant="outline" className="text-xs bg-orange-50">
              <DollarSign className="h-3 w-3 mr-1" />
              High Spend
            </Badge>
          )}
          
          {accuracy > 80 && team.completedStatements > 2 && (
            <Badge variant="outline" className="text-xs bg-green-50">
              <TrendingUp className="h-3 w-3 mr-1" />
              High Accuracy
            </Badge>
          )}
        </div>

        {/* Last Action */}
        <div className="text-xs text-gray-500 border-t pt-2">
          Last action: 2 minutes ago
        </div>
      </CardContent>
    </Card>
  )
}

export function TeamGrid({ teams, onViewTeam }: TeamGridProps) {
  const sortedTeams = [...teams].sort((a, b) => {
    // Sort by score descending, then by completed statements
    if (b.score !== a.score) return b.score - a.score
    return b.completedStatements - a.completedStatements
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Team Overview</h2>
        <div className="text-sm text-gray-600">
          {teams.length} teams active
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedTeams.map((team) => (
          <TeamTile
            key={team.id}
            team={team}
            onView={() => onViewTeam(team.id)}
          />
        ))}
      </div>
      
      {teams.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No teams have joined yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
