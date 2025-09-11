'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Circle } from 'lucide-react'

interface DecisionControlsProps {
  onSubmitDecision: (choice: 'true' | 'false' | 'unknown', rationale: string) => void
  disabled: boolean
  isDecider: boolean
}

export function DecisionControls({ onSubmitDecision, disabled, isDecider }: DecisionControlsProps) {
  const [choice, setChoice] = useState<'true' | 'false' | 'unknown'>()
  const [rationale, setRationale] = useState('')
  const [announceText, setAnnounceText] = useState('')
  
  const handleSubmit = () => {
    if (choice && rationale.trim()) {
      onSubmitDecision(choice, rationale.trim())
      setAnnounceText(`Decision submitted: ${choice} with rationale`)
      setChoice(undefined)
      setRationale('')
      setTimeout(() => setAnnounceText(''), 3000)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey && isValid && !disabled) {
      handleSubmit()
    }
  }

  const isValid = choice && rationale.trim().length >= 10

  return (
    <Card role="region" aria-labelledby="decision-title">
      <CardHeader>
        <CardTitle id="decision-title" className="flex items-center gap-2">
          Decision & Rationale
          {!isDecider && (
            <span className="text-sm font-normal text-gray-500">
              (Input for team discussion)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4" onKeyDown={handleKeyDown}>
        {announceText && (
          <div 
            role="status" 
            aria-live="polite" 
            className="sr-only"
          >
            {announceText}
          </div>
        )}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Your assessment of this statement:
          </Label>
          <RadioGroup 
            value={choice} 
            onValueChange={(value) => setChoice(value as 'true' | 'false' | 'unknown')}
            disabled={disabled}
            className="space-y-3"
            aria-describedby="choice-description"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors duration-200 hover:border-gray-300">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="flex items-center gap-2 cursor-pointer flex-1">
                <Circle className="h-4 w-4 text-gray-600" />
                <span className="font-medium">True</span>
                <span className="text-sm text-gray-500">- This statement is accurate</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors duration-200 hover:border-gray-300">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="flex items-center gap-2 cursor-pointer flex-1">
                <Circle className="h-4 w-4 text-gray-600" />
                <span className="font-medium">False</span>
                <span className="text-sm text-gray-500">- This statement is incorrect</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors duration-200 hover:border-gray-300">
              <RadioGroupItem value="unknown" id="unknown" />
              <Label htmlFor="unknown" className="flex items-center gap-2 cursor-pointer flex-1">
                <Circle className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Unknown</span>
                <span className="text-sm text-gray-500">- Cannot be determined with available evidence</span>
              </Label>
            </div>
          </RadioGroup>
          <div id="choice-description" className="sr-only">
            Select True if the statement is accurate, False if incorrect, or Unknown if it cannot be determined with available evidence.
          </div>
        </div>

        <div>
          <Label htmlFor="rationale" className="text-sm font-medium mb-2 block">
            Rationale (minimum 10 characters):
          </Label>
          <Textarea
            id="rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Explain your reasoning and what evidence supports your decision..."
            disabled={disabled}
            className="min-h-[100px]"
            aria-describedby="rationale-help"
          />
          <div id="rationale-help" className="text-xs text-gray-500 mt-1">
            {rationale.length}/10 minimum characters. Press Ctrl+Enter to submit when ready.
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={disabled || !isValid}
          className="w-full"
          size="lg"
          aria-describedby="submit-help"
        >
          {isDecider ? 'Submit Team Decision' : 'Contribute to Discussion'}
        </Button>
        <div id="submit-help" className="sr-only">
          {!isValid ? 'Please select a choice and provide at least 10 characters of rationale' : 'Ready to submit decision'}
        </div>
        
        {!isDecider && (
          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
            💡 Your input will be visible to the team. The current decider makes the final call.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
