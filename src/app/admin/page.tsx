'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Trophy, 
  Activity,
  RefreshCw
} from 'lucide-react'

interface Team {
  id: string
  team_number: number
  budget: number
  score: number
  created_at: string
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

export default function AdminPage() {
  const [teamsData, setTeamsData] = useState<TeamData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Fetch all teams data
  const fetchTeamsData = async () => {
    try {
      setLoading(true)
      // Get list of teams (1-10 for now)
      const teamPromises = []
      for (let i = 1; i <= 10; i++) {
        teamPromises.push(
          fetch(`/api/teams/${i}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        )
      }
      
      const results = await Promise.all(teamPromises)
      const validTeams = results.filter(Boolean)
      
      setTeamsData(validTeams)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial load and polling
  useEffect(() => {
    fetchTeamsData()
    
    // Poll every 10 seconds
    const interval = setInterval(fetchTeamsData, 10000)
    
    return () => clearInterval(interval)
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
            Monitor team progress and game statistics
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Button 
              onClick={fetchTeamsData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate}
              </span>
            )}
          </div>
        </div>

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
                          Team {teamData.team.team_number}
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
      </div>
    </div>
  )
}
