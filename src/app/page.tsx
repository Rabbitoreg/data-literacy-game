'use client'

import React, { useState, useEffect } from 'react'
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
  team_nickname?: string
}

interface TeamResponse {
  team: Team
  decisions: any[]
  purchases: any[]
}

export default function HomePage() {
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [showTeamSelection, setShowTeamSelection] = useState(false)
  const [maxTeams, setMaxTeams] = useState(8)
  const [playerTeams, setPlayerTeams] = useState<Team[]>([])
  const [playerSearched, setPlayerSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [allTeams, setAllTeams] = useState<TeamResponse[]>([])

  // Fetch max teams configuration and all teams on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/admin/config', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        if (response.ok) {
          const config = await response.json()
          console.log('Config response:', config)
          setMaxTeams(config.max_teams || 8)
        }
      } catch (error) {
        console.error('Error fetching config:', error)
      }
    }

    const fetchAllTeams = async () => {
      try {
        const teamPromises = Array.from({ length: 10 }, (_, i) => 
          fetch(`/api/teams/${i + 1}`).then(res => res.ok ? res.json() : null)
        )
        const teams = await Promise.all(teamPromises)
        const validTeams = teams.filter(team => team !== null)
        console.log('Fetched teams for selection:', validTeams)
        console.log('Sample team structure:', validTeams[0])
        console.log('maxTeams config:', maxTeams)
        setAllTeams(validTeams)
      } catch (error) {
        console.error('Error fetching teams:', error)
      }
    }
    
    fetchConfig()
    fetchAllTeams()
  }, [])

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
            Data Literacy in Action: There You Go!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            There You Go! (TYG), the number one travel company in Ottland, has just finished its sales pilot. The data is in. The results are up. They need you to make decisions!
          </p>
          <div className="flex justify-center gap-2 mb-6">
            <Badge variant="secondary">True, False, or Unknown?</Badge>
            <Badge variant="secondary">Team-based</Badge>
            <Badge variant="secondary">Real-time decisions</Badge>
          </div>
          
          {/* Hero GIF */}
          <div className="flex justify-center mb-8">
            <img 
              src="/land.gif" 
              alt="Data Literacy Game Demo"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </div>

        <div className="grid gap-8">
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
                    Select your team and start with $1,000 budget. Buy evidence if needed.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Make Decisions</h3>
                  <p className="text-sm text-gray-600">
                    Read, interpret, and argue with data as a team to evaluate statements as True/False/Unknown. 
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Practice Data Literacy</h3>
                  <p className="text-sm text-gray-600">
                    Yes, you earn points for correct decisions but more importantly you practice speaking data, the language of impact in Ottland.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Identification */}
          <Card>
            <CardHeader>
              <CardTitle>
                {!playerSearched ? "Welcome to TYG! Enter Your Name" : playerTeams.length > 0 ? "Welcome Back!" : "You're hired! Join a Team:"}
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
                            <h3 className="font-semibold">Team {team.team_number}{team.team_nickname ? ` - ${team.team_nickname}` : ''}</h3>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Array.from({ length: maxTeams }, (_, i) => i + 1).map((teamNumber) => {
                      console.log(`Rendering button for team ${teamNumber}, maxTeams is ${maxTeams}`)
                      const teamData = allTeams.find(t => t.team?.team_number === teamNumber)
                      const team = teamData?.team
                      console.log(`Looking for team ${teamNumber} in:`, allTeams.map(t => ({ id: t.team?.id, team_number: t.team?.team_number, team_nickname: t.team?.team_nickname })))
                      const displayName = team?.team_nickname ? `Team ${teamNumber} - ${team.team_nickname}` : `Team ${teamNumber}`
                      console.log(`Team ${teamNumber}:`, { team, displayName, hasNickname: !!team?.team_nickname })
                      return (
                        <Button
                          key={teamNumber}
                          variant={selectedTeam === teamNumber ? "default" : "outline"}
                          className="h-20 text-sm px-2 py-2 whitespace-normal break-words"
                          onClick={() => selectTeam(teamNumber)}
                        >
                          {displayName}
                        </Button>
                      )
                    })}
                  </div>
                  
                  {selectedTeam && (
                    <div className="text-center">
                      <Button 
                        onClick={joinTeam}
                        size="lg"
                        className="w-full md:w-auto"
                      >
                        Join Team {selectedTeam} & Start Working at TYG
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
              <CardTitle>TYG CEO Access Only</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Login required! Watch the teams resolve the data literacy challenge.
              </p>
              <Button onClick={goToAdmin} variant="secondary">
                Enter the Boardroom
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
