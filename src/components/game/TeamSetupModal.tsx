'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Shuffle, Users, ArrowRight } from 'lucide-react'
import { shuffleArray } from '@/lib/utils'

interface TeamSetupModalProps {
  onSetupComplete: (teamName: string, members: string[]) => void
  isVisible: boolean
}

export function TeamSetupModal({ onSetupComplete, isVisible }: TeamSetupModalProps) {
  const [teamName, setTeamName] = useState('')
  const [membersText, setMembersText] = useState('')
  const [members, setMembers] = useState<string[]>([])
  const [deciderOrder, setDeciderOrder] = useState<string[]>([])

  const parseMembers = (text: string) => {
    const parsed = text
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)
    
    setMembers(parsed)
    setDeciderOrder(shuffleArray(parsed))
  }

  const handleMembersChange = (text: string) => {
    setMembersText(text)
    parseMembers(text)
  }

  const reshuffleOrder = () => {
    setDeciderOrder(shuffleArray([...members]))
  }

  const handleSubmit = () => {
    if (teamName.trim() && members.length > 0) {
      onSetupComplete(teamName.trim(), members)
    }
  }

  const isValid = teamName.trim().length > 0 && members.length > 0

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Setup
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="teamName" className="text-sm font-medium mb-2 block">
              Team Name:
            </Label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
            />
          </div>

          <div>
            <Label htmlFor="members" className="text-sm font-medium mb-2 block">
              Team Members (comma-separated):
            </Label>
            <Textarea
              id="members"
              value={membersText}
              onChange={(e) => handleMembersChange(e.target.value)}
              placeholder="Alice, Bob, Charlie, Diana..."
              className="min-h-[100px]"
            />
            <div className="text-xs text-gray-500 mt-1">
              {members.length} member{members.length !== 1 ? 's' : ''} detected
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">
                  Decider Rotation Order:
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reshuffleOrder}
                  className="flex items-center gap-1"
                >
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex flex-wrap gap-2">
                  {deciderOrder.map((member, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {index + 1}. {member}
                      </div>
                      {index < deciderOrder.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  The first person will be the decider for the first statement, then it rotates.
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Each statement has one designated <strong>Decider</strong></li>
              <li>• The Decider makes the final True/False/Unknown choice</li>
              <li>• All team members can contribute to discussion and rationale</li>
              <li>• The Decider role rotates automatically after each statement</li>
              <li>• Team leads can skip a decider if needed</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              size="lg"
              className="px-8"
            >
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
