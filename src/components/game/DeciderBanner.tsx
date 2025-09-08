'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Crown, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeciderBannerProps {
  currentDecider: string
  nextDecider: string
  isCurrentUserDecider: boolean
  onSkipDecider: () => void
  canSkip: boolean
}

export function DeciderBanner({ 
  currentDecider, 
  nextDecider, 
  isCurrentUserDecider, 
  onSkipDecider,
  canSkip 
}: DeciderBannerProps) {
  return (
    <Card className={cn(
      "mb-4 border-2",
      isCurrentUserDecider 
        ? "bg-yellow-50 border-yellow-400 decider-highlight" 
        : "bg-blue-50 border-blue-200"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className={cn(
              "h-5 w-5",
              isCurrentUserDecider ? "text-yellow-600" : "text-blue-600"
            )} />
            <div>
              <div className="font-semibold text-sm">
                Current Decider: <span className="text-lg">{currentDecider}</span>
              </div>
              <div className="text-xs text-gray-600">
                Next: {nextDecider}
              </div>
            </div>
          </div>
          
          {canSkip && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSkipDecider}
              className="flex items-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Skip Decider
            </Button>
          )}
        </div>
        
        {isCurrentUserDecider && (
          <div className="mt-2 text-sm text-yellow-700 font-medium">
            🎯 You are the decision maker for this statement!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
