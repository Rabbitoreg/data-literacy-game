'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MacroTimerProps {
  remaining: number
  total: number
  isActive: boolean
  phase: 'setup' | 'round1' | 'debrief1' | 'round2' | 'final'
}

export function MacroTimer({ remaining, total, isActive, phase }: MacroTimerProps) {
  const percentage = total > 0 ? (remaining / total) * 100 : 0
  const isCritical = remaining <= 120 && isActive // Last 2 minutes
  
  const phaseLabels = {
    setup: 'Setup Phase',
    round1: 'Round 1 - Active',
    debrief1: 'Debrief 1',
    round2: 'Round 2 - Active', 
    final: 'Final Debrief'
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-700">
          {phaseLabels[phase]}
        </h3>
        <div className={cn(
          "text-lg font-mono font-bold",
          isCritical ? "text-red-600 animate-pulse" : "text-gray-900"
        )}>
          {formatTime(remaining)}
        </div>
      </div>
      
      <Progress 
        value={percentage} 
        className={cn(
          "h-2",
          isCritical && "bg-red-100"
        )}
      />
      
      {isCritical && (
        <div className="mt-2 text-xs text-red-600 font-medium animate-pulse">
          ⚠️ Time running out!
        </div>
      )}
      
      {!isActive && phase !== 'setup' && (
        <div className="mt-2 text-xs text-orange-600 font-medium">
          ⏸️ Round paused - waiting for facilitator
        </div>
      )}
    </div>
  )
}
