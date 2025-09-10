'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Team {
  id: string
  team_number: number
  budget: number
  score: number
  members: string[]
  created_at: string
}

export default function HomePage() {
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [playerTeams, setPlayerTeams] = useState<Team[]>([])
  const [playerSearched, setPlayerSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showTeamSelection, setShowTeamSelection] = useState(false)

  const searchForPlayer = async () => {
    if (!playerName.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/players/search?name=${encodeURIComponent(playerName.trim())}`)
      if (response.ok) {
        const data = await response.json()
        setPlayerTeams(data.teams || [])
        setPlayerSearched(true)
        if (data.teams && data.teams.length === 0) {
          setShowTeamSelection(true)
        }
      }
    } catch (error) {
      console.error('Error searching for player:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const joinExistingTeam = (teamNumber: number) => {
    router.push(`/play?team=${teamNumber}&name=${encodeURIComponent(playerName.trim())}`)
  }

  const selectTeam = (teamNumber: number) => {
    setSelectedTeam(teamNumber)
    setShowNameInput(true)
  }

  const joinTeam = () => {
    if (selectedTeam && playerName.trim()) {
      router.push(`/play?team=${selectedTeam}&name=${encodeURIComponent(playerName.trim())}`)
    }
  }

  const startOver = () => {
    setPlayerName('')
    setPlayerTeams([])
    setPlayerSearched(false)
    setShowTeamSelection(false)
    setSelectedTeam(null)
    setShowNameInput(false)
  }

  const goToAdmin = () => {
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Data Decisions: Pilot Pursuit
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            A multiplayer data literacy game for teams
          </p>
          <div className="flex justify-center gap-2 mb-6">
            <Badge variant="secondary">60 minutes</Badge>
            <Badge variant="secondary">Team-based</Badge>
            <Badge variant="secondary">Real-time decisions</Badge>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Player Identification */}
          <Card>
            <CardHeader>
              <CardTitle>
                {!playerSearched ? "Enter Your Name" : playerTeams.length > 0 ? "Welcome Back!" : "Join a Team"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!playerSearched ? (
                // Step 1: Player name input and search
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="playerName">Your Name</Label>
                    <Input
                      id="playerName"
                      type="text"
                      placeholder="Enter your name to continue"
                      value={playerName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
                      className="mt-1"
                      onKeyPress={(e) => e.key === 'Enter' && searchForPlayer()}
                    />
                  </div>
                  <div className="text-center">
                    <Button 
                      onClick={searchForPlayer}
                      size="lg"
                      className="w-full md:w-auto"
                      disabled={!playerName.trim() || isSearching}
                    >
                      {isSearching ? 'Searching...' : 'Continue'}
                    </Button>
                  </div>
                </div>
              ) : playerTeams.length > 0 ? (
                // Step 2a: Show existing teams for returning player
                <div className="space-y-4">
                  <p className="text-gray-600 text-center">
                    Welcome back, <strong>{playerName}</strong>! You're a member of:
                  </p>
                  <div className="grid gap-3">
                    {playerTeams.map((team) => (
                      <div key={team.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Team {team.team_number}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Budget: ${team.budget}</span>
                              <span>Score: {team.score}</span>
                              <span>Members: {team.members.length}</span>
                            </div>
                          </div>
                          <Button onClick={() => joinExistingTeam(team.team_number)}>
                            Continue Playing
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center pt-4 border-t">
                    <Button variant="outline" onClick={startOver}>
                      Not you? Start over
                    </Button>
                  </div>
                </div>
              ) : showTeamSelection ? (
                // Step 2b: Show team selection for new player
                <div className="space-y-4">
                  <p className="text-gray-600 text-center">
                    Welcome, <strong>{playerName}</strong>! Choose a team to join:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((teamNumber) => (
                      <Button
                        key={teamNumber}
                        variant={selectedTeam === teamNumber ? "default" : "outline"}
                        className="h-16 text-lg"
                        onClick={() => selectTeam(teamNumber)}
                      >
                        Team {teamNumber}
                      </Button>
                    ))}
                  </div>
                  
                  {selectedTeam && (
                    <div className="text-center">
                      <Button 
                        onClick={joinTeam}
                        size="lg"
                        className="w-full md:w-auto"
                      >
                        Join Team {selectedTeam} & Start Playing
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-center pt-4 border-t">
                    <Button variant="outline" onClick={startOver}>
                      Change name
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Admin Access */}
          <Card>
            <CardHeader>
              <CardTitle>Facilitator Access</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Monitor all teams and control the game flow
              </p>
              <Button onClick={goToAdmin} variant="secondary">
                Go to Admin Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Game Overview */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Choose Team</h3>
                  <p className="text-sm text-gray-600">
                    Select your team and start with $1000 budget
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Make Decisions</h3>
                  <p className="text-sm text-gray-600">
                    Evaluate statements as True/False/Unknown and purchase insights
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Score Points</h3>
                  <p className="text-sm text-gray-600">
                    Earn points for correct decisions and strategic purchases
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
