'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { Leaderboard } from '@/components/admin/Leaderboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Users, 
  Target, 
  Clock, 
  DollarSign,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { RechartsWidget } from '@/components/charts/RechartsWidget'
import type { GameState } from '@/types/game'
import { formatCurrency, formatTime } from '@/lib/utils'

export default function PlenaryPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [macroTimer, setMacroTimer] = useState<{
    remaining: number;
    isActive: boolean;
    phase: 'setup' | 'round1' | 'round2' | 'debrief1' | 'final';
  }>({ 
    remaining: 0, 
    isActive: false, 
    phase: 'setup'
  })

  useEffect(() => {
    if (!sessionId) return

    const newSocket = io('http://localhost:3001')
    setSocket(newSocket)

    newSocket.emit('join_session', { 
      sessionId, 
      role: 'plenary' 
    })

    newSocket.on('state:update', (state: GameState) => {
      setGameState(state)
    })

    newSocket.on('macro_round:start', (data: { round: number; duration: number }) => {
      setMacroTimer(prev => ({
        ...prev,
        remaining: data.duration,
        isActive: true,
        phase: data.round === 1 ? 'round1' : 'round2'
      }))
    })

    newSocket.on('timer:tick', (data: { remaining: number }) => {
      setMacroTimer(prev => ({ ...prev, remaining: data.remaining }))
    })

    newSocket.on('macro_round:recall', () => {
      setMacroTimer(prev => ({ ...prev, isActive: false }))
    })

    return () => {
      newSocket.disconnect()
    }
  }, [sessionId])

  if (!sessionId || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading plenary display...</p>
        </div>
      </div>
    )
  }

  const totalStatements = gameState.teams.reduce((sum, team) => sum + team.completedStatements, 0)
  const totalSpent = gameState.teams.reduce((sum, team) => sum + (1000 - team.budgetRemaining), 0)
  const avgScore = gameState.teams.length > 0 ? 
    gameState.teams.reduce((sum, team) => sum + team.score, 0) / gameState.teams.length : 0

  // Generate chart data
  const teamScoreData = gameState.teams
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(team => ({
      team: team.name.length > 12 ? team.name.substring(0, 12) + '...' : team.name,
      score: team.score,
      statements: team.completedStatements
    }))

  const spendingData = gameState.teams.map(team => ({
    team: team.name.length > 12 ? team.name.substring(0, 12) + '...' : team.name,
    spent: 1000 - team.budgetRemaining,
    score: team.score
  }))

  const phaseLabels = {
    setup: 'Setup Phase',
    round1: 'Round 1 - Active',
    debrief1: 'Debrief 1',
    round2: 'Round 2 - Active',
    final: 'Final Debrief'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black bg-opacity-30 border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Data Decisions: Pilot Pursuit
              </h1>
              <p className="text-xl text-blue-200">{gameState.session.title}</p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-mono font-bold mb-1">
                {formatTime(macroTimer.remaining)}
              </div>
              <div className="text-lg text-blue-200">
                {phaseLabels[macroTimer.phase]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Stats */}
          <div className="col-span-4 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-300" />
                  <div className="text-3xl font-bold">{gameState.teams.length}</div>
                  <div className="text-sm text-blue-200">Active Teams</div>
                </CardContent>
              </Card>

              <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-300" />
                  <div className="text-3xl font-bold">{totalStatements}</div>
                  <div className="text-sm text-green-200">Total Statements</div>
                </CardContent>
              </Card>

              <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-300" />
                  <div className="text-3xl font-bold">{avgScore.toFixed(0)}</div>
                  <div className="text-sm text-purple-200">Avg Score</div>
                </CardContent>
              </Card>

              <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-300" />
                  <div className="text-3xl font-bold">{formatCurrency(totalSpent)}</div>
                  <div className="text-sm text-yellow-200">Total Spent</div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Indicators */}
            <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
              <CardHeader>
                <CardTitle className="text-white">Session Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Round Progress</span>
                    <span>{gameState.session.currentRound} / {gameState.session.totalRounds}</span>
                  </div>
                  <Progress 
                    value={(gameState.session.currentRound / gameState.session.totalRounds) * 100} 
                    className="bg-white bg-opacity-20"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Avg Team Progress</span>
                    <span>
                      {gameState.teams.length > 0 
                        ? (totalStatements / gameState.teams.length).toFixed(1)
                        : 0
                      } statements
                    </span>
                  </div>
                  <Progress 
                    value={gameState.teams.length > 0 
                      ? Math.min(100, (totalStatements / gameState.teams.length / gameState.availableStatements.length) * 100)
                      : 0
                    } 
                    className="bg-white bg-opacity-20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Leaderboard */}
          <div className="col-span-5">
            <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-2xl">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  Live Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gameState.teams
                    .sort((a, b) => {
                      if (b.score !== a.score) return b.score - a.score
                      return b.completedStatements - a.completedStatements
                    })
                    .slice(0, 8)
                    .map((team, index) => {
                      const rank = index + 1
                      const getRankColor = (rank: number) => {
                        switch (rank) {
                          case 1: return 'bg-yellow-500 bg-opacity-20 border-yellow-400'
                          case 2: return 'bg-gray-400 bg-opacity-20 border-gray-300'
                          case 3: return 'bg-amber-600 bg-opacity-20 border-amber-500'
                          default: return 'bg-white bg-opacity-10 border-white border-opacity-20'
                        }
                      }

                      return (
                        <div 
                          key={team.id}
                          className={`p-4 rounded-lg border ${getRankColor(rank)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl font-bold w-8">
                                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                              </div>
                              <div>
                                <div className="font-bold text-lg">{team.name}</div>
                                <div className="text-sm opacity-80">
                                  {team.completedStatements} statements • {formatCurrency(1000 - team.budgetRemaining)} spent
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{team.score}</div>
                              <div className="text-sm opacity-80">points</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Charts */}
          <div className="col-span-3 space-y-6">
            {teamScoreData.length > 0 && (
              <div className="bg-white rounded-lg">
                <RechartsWidget
                  type="bar"
                  data={teamScoreData}
                  xKey="team"
                  yKey="score"
                  title="Team Scores"
                />
              </div>
            )}

            {spendingData.length > 0 && (
              <div className="bg-white rounded-lg">
                <RechartsWidget
                  type="area"
                  data={spendingData.slice(0, 6)}
                  xKey="team"
                  yKey="spent"
                  title="Budget Usage"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-green-500 bg-opacity-20 border-green-400 border-opacity-50">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-3 text-green-300" />
              <div className="text-lg font-semibold mb-2">Top Performers</div>
              <div className="text-sm opacity-90">
                Leading teams are balancing accuracy with strategic spending
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500 bg-opacity-20 border-blue-400 border-opacity-50">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-3 text-blue-300" />
              <div className="text-lg font-semibold mb-2">Data Analysis</div>
              <div className="text-sm opacity-90">
                Teams are using evidence effectively to make informed decisions
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500 bg-opacity-20 border-purple-400 border-opacity-50">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-3 text-purple-300" />
              <div className="text-lg font-semibold mb-2">Learning Goals</div>
              <div className="text-sm opacity-90">
                Strong evidence-based reasoning and "Unknown" usage
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
