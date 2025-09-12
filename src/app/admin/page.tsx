'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import StatementEvaluationManager from '@/components/admin/StatementEvaluationManager'
import { 
  RefreshCw, 
  Users, 
  Settings, 
  FileText, 
  ArrowLeft,
  Activity,
  Trophy,
  Play,
  AlertTriangle
} from 'lucide-react'

interface Team {
  id: string
  team_number: number
  budget: number
  score: number
  created_at: string
  team_nickname?: string
}

interface Decision {
  id: string
  statement_id: string
  choice: string
  confidence: number
  submitted_at: string
}

interface Purchase {
  id: string
  item_id: string
  cost: number
  purchased_at: string
}

interface TeamData {
  team: Team
  decisions: Decision[]
  purchases: Purchase[]
}

interface Statement {
  id: string
  text: string
  topic: string
  truthLabel: string
}

interface DecisionData {
  id: string
  team_number: number
  choice: 'true' | 'false' | 'unknown'
  confidence: number
  rationale: string
  decider_name: string
  points_earned: number
  submitted_at: string
  team_nickname?: string
  evidence_items?: string[]
}

interface StatementDecisions {
  statement: Statement
  decisions: DecisionData[]
  agreement_score: number
}

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsData, setTeamsData] = useState<TeamData[]>([])
  const [statements, setStatements] = useState<Statement[]>([])
  const [statementDecisions, setStatementDecisions] = useState<StatementDecisions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [statementsLoading, setStatementsLoading] = useState(true)
  const [statementViewLoading, setStatementViewLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null)
  const [showStartNewGame, setShowStartNewGame] = useState(false)
  const [newGameTeams, setNewGameTeams] = useState<number | string>(8)
  const [startingNewGame, setStartingNewGame] = useState(false)

  // Fetch all teams data
  const startNewGame = async () => {
    try {
      setStartingNewGame(true)
      const response = await fetch('/api/admin/start-new-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxTeams: typeof newGameTeams === 'string' ? parseInt(newGameTeams) || 2 : newGameTeams })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message}`)
        setShowStartNewGame(false)
        await fetchTeamsData() // Refresh data
        // Force page reload to clear any cached config
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error starting new game:', error)
      alert('❌ Failed to start new game')
    } finally {
      setStartingNewGame(false)
    }
  }

  const fetchTeamsData = async () => {
    try {
      setLoading(true)
      
      // Get max teams from config first
      const configResponse = await fetch('/api/admin/config', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const config = await configResponse.json()
      console.log('Admin page config response:', config)
      const maxTeams = parseInt(config.maxTeams) || parseInt(config.max_teams) || 2
      console.log('Admin page maxTeams:', maxTeams)
      
      // Get list of teams based on config
      const teamPromises = []
      for (let i = 1; i <= maxTeams; i++) {
        teamPromises.push(fetch(`/api/teams/${i}`))
      }
      
      const responses = await Promise.all(teamPromises)
      const teamsDataArray = []
      
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json()
          teamsDataArray.push(data)
        }
      }
      
      setTeamsData(teamsDataArray)
      const now = new Date()
      setLastUpdate(now.toLocaleString())
    } catch (error) {
      setError('Failed to fetch teams data')
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch statements data
  const fetchStatements = async () => {
    try {
      setStatementsLoading(true)
      const response = await fetch('/api/statements')
      if (response.ok) {
        const data = await response.json()
        setStatements(data.statements || [])
      }
    } catch (error) {
      console.error('Error fetching statements:', error)
    } finally {
      setStatementsLoading(false)
    }
  }

  // Fetch statement decisions data
  const fetchStatementDecisions = async () => {
    try {
      setStatementViewLoading(true)
      const response = await fetch('/api/admin/statement-decisions')
      if (response.ok) {
        const data = await response.json()
        setStatementDecisions(data.statements || [])
      }
    } catch (error) {
      console.error('Error fetching statement decisions:', error)
    } finally {
      setStatementViewLoading(false)
    }
  }

  // Initial load and polling
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  useEffect(() => {
    // Check authentication
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      } else {
        // No session, redirect to login
        router.push('/admin/login')
        return
      }
    }
    getUser()
    fetchTeamsData()
    fetchStatements()
  }, [])


  const totalTeams = teamsData.length
  const totalDecisions = teamsData.reduce((sum, team) => sum + team.decisions.length, 0)
  const totalPurchases = teamsData.reduce((sum, team) => sum + team.purchases.length, 0)
  const averageScore = totalTeams > 0 
    ? Math.round(teamsData.reduce((sum, team) => sum + team.team.score, 0) / totalTeams)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Game Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor team progress and manage game configuration
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Button 
              onClick={fetchTeamsData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {lastUpdate ? `Refresh Data (Last: ${lastUpdate})` : 'Refresh Data'}
            </Button>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main
            </Button>
          </div>
        </div>

        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Monitoring
            </TabsTrigger>
            <TabsTrigger value="statement-view" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Statement View
            </TabsTrigger>
            <TabsTrigger value="statements" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Statement Scoring
            </TabsTrigger>
            <TabsTrigger value="game-control" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Game Control
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="mt-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeams}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Decisions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDecisions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPurchases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}</div>
            </CardContent>
          </Card>
        </div>

        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading teams...</p>
              </div>
            ) : teamsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active teams found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamsData.map((teamData) => (
                  <Card key={teamData.team.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          Team {teamData.team.team_number}{teamData.team.team_nickname ? ` - ${teamData.team.team_nickname}` : ''}
                        </CardTitle>
                        <Badge variant="outline">
                          ${teamData.team.budget}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="font-semibold">{teamData.team.score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Decisions:</span>
                          <span>{teamData.decisions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Purchases:</span>
                          <span>{teamData.purchases.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Spent:</span>
                          <span>${teamData.purchases.reduce((sum, p) => sum + p.cost, 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="statement-view" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Statement Analysis</h2>
                  <p className="text-gray-600">View team decisions and agreement patterns across all statements</p>
                </div>
                <Button onClick={fetchStatementDecisions} disabled={statementViewLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${statementViewLoading ? 'animate-spin' : ''}`} />
                  Load Statement Data
                </Button>
              </div>

              {statementViewLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading statement decisions...</p>
                </div>
              ) : statementDecisions.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No statement data available</p>
                    <p className="text-sm">Click "Load Statement Data" to fetch the latest decisions</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {statementDecisions.map((statementData) => {
                    const choiceCounts = {
                      true: statementData.decisions.filter(d => d.choice === 'true').length,
                      false: statementData.decisions.filter(d => d.choice === 'false').length,
                      unknown: statementData.decisions.filter(d => d.choice === 'unknown').length
                    }
                    
                    const totalDecisions = statementData.decisions.length
                    const avgConfidence = totalDecisions > 0 
                      ? Math.round(statementData.decisions.reduce((sum, d) => sum + d.confidence, 0) / totalDecisions)
                      : 0

                    return (
                      <Card key={statementData.statement.id} className="overflow-hidden">
                        <CardHeader className="bg-gray-800 text-white border-b">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2 text-white">{statementData.statement.text}</CardTitle>
                              <div className="flex items-center gap-4 text-sm text-gray-300">
                                <span>Topic: {statementData.statement.topic}</span>
                                <span>Teams Responded: {totalDecisions}</span>
                                <span>Avg Confidence: {avgConfidence}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={statementData.agreement_score > 0.7 ? 'default' : statementData.agreement_score > 0.4 ? 'secondary' : 'destructive'}>
                                {statementData.agreement_score > 0.7 ? 'High Agreement' : 
                                 statementData.agreement_score > 0.4 ? 'Mixed Views' : 'High Disagreement'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-6">
                          {/* Choice Distribution */}
                          <div className="mb-6">
                            <h4 className="font-semibold mb-3">Choice Distribution</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{choiceCounts.true}</div>
                                <div className="text-sm text-green-700">TRUE</div>
                                <div className="text-xs text-gray-500">
                                  {totalDecisions > 0 ? Math.round((choiceCounts.true / totalDecisions) * 100) : 0}%
                                </div>
                              </div>
                              <div className="text-center p-4 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{choiceCounts.false}</div>
                                <div className="text-sm text-red-700">FALSE</div>
                                <div className="text-xs text-gray-500">
                                  {totalDecisions > 0 ? Math.round((choiceCounts.false / totalDecisions) * 100) : 0}%
                                </div>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-600">{choiceCounts.unknown}</div>
                                <div className="text-sm text-gray-700">UNKNOWN</div>
                                <div className="text-xs text-gray-500">
                                  {totalDecisions > 0 ? Math.round((choiceCounts.unknown / totalDecisions) * 100) : 0}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Team Decisions */}
                          <div>
                            <h4 className="font-semibold mb-3">Team Decisions</h4>
                            <div className="space-y-3">
                              {statementData.decisions.map((decision) => (
                                <div key={decision.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline">Team {decision.team_number}{decision.team_nickname ? ` - ${decision.team_nickname}` : ''}</Badge>
                                    <Badge variant={decision.choice === 'true' ? 'default' : decision.choice === 'false' ? 'destructive' : 'secondary'}>
                                      {decision.choice.toUpperCase()}
                                    </Badge>
                                    <span className="text-sm text-gray-600">{decision.confidence}% confident</span>
                                    <span className={`text-sm font-semibold ${
                                      decision.points_earned > 0 ? 'text-green-600' : 
                                      decision.points_earned < 0 ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                      {decision.points_earned > 0 ? '+' : ''}{decision.points_earned} pts
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    {decision.evidence_items && decision.evidence_items.length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {decision.evidence_items.length} evidence
                                      </Badge>
                                    )}
                                    <span>by {decision.decider_name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="statements" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Statement Scoring Configuration
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Configure scoring rules for each statement. Click on a statement to set up multiple correct answers with different point values.
                </p>
              </CardHeader>
              <CardContent>
                {statementsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading statements...</p>
                  </div>
                ) : statements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No statements found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statements.map((statement) => (
                      <Card key={statement.id} className="border hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedStatement(statement)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-2">{statement.text}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{statement.topic}</Badge>
                                <Badge variant="secondary">Legacy: {statement.truthLabel}</Badge>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Configure Scoring
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="game-control" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Game Control Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Start New Game</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This will permanently delete all current game data including team members, decisions, purchases, and scores.
                      </p>
                    </div>
                  </div>
                </div>

                {!showStartNewGame ? (
                  <Button 
                    onClick={() => setShowStartNewGame(true)}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <Play className="w-4 h-4" />
                    Start New Game
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold">Configure New Game</h4>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Number of Teams (1-20)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={newGameTeams}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '') {
                            setNewGameTeams('')
                          } else {
                            const num = parseInt(value)
                            if (!isNaN(num) && num >= 1 && num <= 20) {
                              setNewGameTeams(num)
                            }
                          }
                        }}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={startNewGame}
                        disabled={startingNewGame}
                        className="flex items-center gap-2"
                      >
                        {startingNewGame ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Starting New Game...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Confirm Start New Game
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowStartNewGame(false)}
                        disabled={startingNewGame}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Statement Evaluation Manager Modal */}
        {selectedStatement && (
          <StatementEvaluationManager
            statement={selectedStatement}
            onClose={() => setSelectedStatement(null)}
          />
        )}
      </div>
    </div>
  )
}
