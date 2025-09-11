'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Trophy, 
  Activity,
  RefreshCw,
  Settings
} from 'lucide-react'

interface Team {
  id: string
  team_number: number
  budget: number
  score: number
  created_at: string
}

interface TeamWithStats extends Team {
  decisions_count: number
  purchases_count: number
}

interface Statement {
  id: string
  text: string
}

interface DecisionData {
  id: string
  team_number: number
  choice: 'true' | 'false' | 'unknown'
  confidence: number
  rationale: string
  evidence_items: string[]
  points_earned: number
}

interface StatementDecisions {
  statement: Statement
  decisions: DecisionData[]
  agreement_score: number
}

export default function AdminPage() {
  const [teams, setTeams] = useState<TeamWithStats[]>([])
  const [statementDecisions, setStatementDecisions] = useState<StatementDecisions[]>([])
  const [loading, setLoading] = useState(true)
  const [statementsLoading, setStatementsLoading] = useState(false)

  // Load teams data
  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load teams:', error)
      setLoading(false)
    }
  }

  // Load statement decisions data
  const loadStatementDecisions = async () => {
    setStatementsLoading(true)
    try {
      const response = await fetch('/api/admin/statement-decisions')
      if (response.ok) {
        const data = await response.json()
        setStatementDecisions(data.statements || [])
      }
    } catch (error) {
      console.error('Failed to load statement decisions:', error)
    }
    setStatementsLoading(false)
  }

  useEffect(() => {
    loadTeams()
    // Refresh teams every 10 seconds
    const interval = setInterval(loadTeams, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const totalDecisions = teams.reduce((sum, team) => sum + team.decisions_count, 0)
  const totalSpent = teams.reduce((sum, team) => sum + (1000 - team.budget), 0)
  const avgScore = teams.length > 0 ? (teams.reduce((sum, team) => sum + team.score, 0) / teams.length).toFixed(0) : '0'
  const avgDecisions = teams.length > 0 ? (totalDecisions / teams.length).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Facilitator Dashboard
              </h1>
              <p className="text-gray-600">Data Decisions: Pilot Pursuit</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={loadTeams}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Badge variant="outline">
                Teams: {teams.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Game Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button className="w-full" variant="default">
                    Start Round 1
                  </Button>
                  <Button className="w-full" variant="default">
                    Start Round 2
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Use the refresh button above to get the latest team data.</p>
                  <p className="mt-2">Teams are automatically updated every 10 seconds.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-9">
            <Tabs defaultValue="teams" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="teams" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teams ({teams.length})
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="statements" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Statement View
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="teams">
                <div className="grid gap-4">
                  {teams.map((team) => (
                    <Card key={team.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-lg px-3 py-1">
                              Team {team.team_number}
                            </Badge>
                            <div className="text-sm text-gray-600">
                              Created: {new Date(team.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-green-600">${team.budget}</div>
                              <div className="text-gray-500">Budget</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-blue-600">{team.score}</div>
                              <div className="text-gray-500">Score</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-purple-600">{team.decisions_count}</div>
                              <div className="text-gray-500">Decisions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-orange-600">{team.purchases_count}</div>
                              <div className="text-gray-500">Purchases</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {teams.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No teams have joined yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="leaderboard">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Team Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {teams
                        .sort((a, b) => b.score - a.score)
                        .map((team, index) => (
                          <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant={index === 0 ? "default" : "outline"}>
                                #{index + 1}
                              </Badge>
                              <span className="font-medium">Team {team.team_number}</span>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-center">
                                <div className="font-semibold">{team.score}</div>
                                <div className="text-gray-500">Score</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold">{team.decisions_count}</div>
                                <div className="text-gray-500">Decisions</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold">${1000 - team.budget}</div>
                                <div className="text-gray-500">Spent</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {teams.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No teams to display yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="grid gap-6">
                  {/* Game Analytics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Game Analytics
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {totalDecisions}
                          </div>
                          <div className="text-sm text-blue-700">Total Decisions</div>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            ${totalSpent}
                          </div>
                          <div className="text-sm text-green-700">Total Spent</div>
                        </div>
                        
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {avgScore}
                          </div>
                          <div className="text-sm text-purple-700">Avg Score</div>
                        </div>
                        
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {avgDecisions}
                          </div>
                          <div className="text-sm text-orange-700">Avg Decisions</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Performance Overview</CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      {teams.length > 0 ? (
                        <div className="space-y-4">
                          {teams.map((team) => (
                            <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="font-medium">Team {team.team_number}</div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>Score: <span className="font-semibold">{team.score}</span></div>
                                <div>Budget: <span className="font-semibold">${team.budget}</span></div>
                                <div>Decisions: <span className="font-semibold">{team.decisions_count}</span></div>
                                <div>Purchases: <span className="font-semibold">{team.purchases_count}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No team data available yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
