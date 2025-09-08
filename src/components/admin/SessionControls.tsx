'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Play, 
  Pause, 
  Square, 
  Users, 
  MessageSquare, 
  Clock, 
  Plus,
  RotateCcw,
  Lock
} from 'lucide-react'
import { GameSession } from '@/types/game'
import { formatTime } from '@/lib/utils'

interface SessionControlsProps {
  session: GameSession
  onStartRound: (round: number, duration: number) => void
  onRecallTeams: () => void
  onLockSubmissions: () => void
  onBroadcast: (message: string) => void
  onExtendTime: (minutes: number) => void
  currentTimer: {
    remaining: number
    isActive: boolean
    phase: string
  }
}

export function SessionControls({
  session,
  onStartRound,
  onRecallTeams,
  onLockSubmissions,
  onBroadcast,
  onExtendTime,
  currentTimer
}: SessionControlsProps) {
  const [broadcastMessage, setBroadcastMessage] = useState('')
  
  const handleBroadcast = () => {
    if (broadcastMessage.trim()) {
      onBroadcast(broadcastMessage.trim())
      setBroadcastMessage('')
    }
  }

  const getPhaseLabel = (phase: string) => {
    const labels = {
      setup: 'Setup Phase',
      round1: 'Round 1 Active',
      debrief1: 'Debrief 1',
      round2: 'Round 2 Active',
      final: 'Final Debrief'
    }
    return labels[phase as keyof typeof labels] || phase
  }

  const getStatusColor = (status: string) => {
    const colors = {
      setup: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Session Control</span>
            <Badge className={getStatusColor(session.status)}>
              {session.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Current Phase</div>
              <div className="font-medium">{getPhaseLabel(currentTimer.phase)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Time Remaining</div>
              <div className="font-mono text-lg font-bold">
                {formatTime(currentTimer.remaining)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Current Round</div>
              <div className="font-medium">{session.currentRound} of {session.totalRounds}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Timer Status</div>
              <div className="font-medium">
                {currentTimer.isActive ? 'Running' : 'Paused'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Round Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Round Controls
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onStartRound(1, 1080)} // 18 minutes
              disabled={session.status === 'active' && session.currentRound === 1}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Round 1
            </Button>
            
            <Button
              onClick={() => onStartRound(2, 1080)} // 18 minutes
              disabled={session.status === 'active' && session.currentRound === 2}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Round 2
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={onRecallTeams}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Recall Teams
            </Button>
            
            <Button
              onClick={onLockSubmissions}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Lock className="h-4 w-4" />
              Lock Submissions
            </Button>
            
            <Button
              onClick={() => onExtendTime(5)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              +5 min
            </Button>
          </div>

          <Button
            onClick={() => onExtendTime(2)}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Extend +2 minutes
          </Button>
        </CardContent>
      </Card>

      {/* Broadcast Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Broadcast Message
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Send a message to all teams..."
            className="min-h-[80px]"
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleBroadcast}
              disabled={!broadcastMessage.trim()}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Broadcast
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setBroadcastMessage('')}
            >
              Clear
            </Button>
          </div>

          {/* Quick Messages */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Quick Messages:</div>
            <div className="grid grid-cols-1 gap-1">
              {[
                "⏰ 5 minutes remaining in this round",
                "📊 Great progress teams! Keep analyzing the data",
                "💡 Remember: Unknown is a valid choice when evidence is insufficient",
                "🔄 Switching to breakout rooms now",
                "📈 Check the leaderboard for current standings"
              ].map((msg, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => setBroadcastMessage(msg)}
                  className="justify-start text-left h-auto py-1 px-2 text-xs"
                >
                  {msg}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Information
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Session ID:</span>
            <span className="font-mono">{session.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Title:</span>
            <span>{session.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Mode:</span>
            <span className="capitalize">{session.mode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max Teams:</span>
            <span>{session.maxTeams}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Started:</span>
            <span>{new Date(session.startAt).toLocaleTimeString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
