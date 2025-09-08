'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)

  const joinTeam = (teamNumber: number) => {
    router.push(`/play?team=${teamNumber}`)
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
          {/* Team Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((teamNumber) => (
                  <Button
                    key={teamNumber}
                    variant={selectedTeam === teamNumber ? "default" : "outline"}
                    className="h-16 text-lg"
                    onClick={() => setSelectedTeam(teamNumber)}
                  >
                    Team {teamNumber}
                  </Button>
                ))}
              </div>
              
              {selectedTeam && (
                <div className="text-center">
                  <Button 
                    onClick={() => joinTeam(selectedTeam)}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    Join Team {selectedTeam} & Start Playing
                  </Button>
                </div>
              )}
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
