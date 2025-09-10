'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface StatementEvaluation {
  id: string
  statementId: string
  choice: 'true' | 'false' | 'unknown'
  isCorrect: boolean
  points: number
  feedback: string
}

interface Statement {
  id: string
  text: string
  topic: string
  truthLabel: string
}

interface StatementEvaluationManagerProps {
  statement: Statement
  onClose: () => void
}

export default function StatementEvaluationManager({ statement, onClose }: StatementEvaluationManagerProps) {
  const [evaluations, setEvaluations] = useState<StatementEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for each choice
  const [trueEval, setTrueEval] = useState({ isCorrect: false, points: 0, feedback: '' })
  const [falseEval, setFalseEval] = useState({ isCorrect: false, points: 0, feedback: '' })
  const [unknownEval, setUnknownEval] = useState({ isCorrect: false, points: 0, feedback: '' })

  useEffect(() => {
    loadEvaluations()
  }, [statement.id])

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/statements/${statement.id}/evaluations`)
      if (response.ok) {
        const data = await response.json()
        setEvaluations(data.evaluations || [])
        
        // Populate form state
        console.log('Loading evaluations:', data.evaluations)
        data.evaluations?.forEach((evaluation: StatementEvaluation) => {
          const evaluationData = { isCorrect: evaluation.isCorrect, points: evaluation.points, feedback: evaluation.feedback }
          console.log(`Setting ${evaluation.choice} eval:`, evaluationData)
          if (evaluation.choice === 'true') setTrueEval(evaluationData)
          else if (evaluation.choice === 'false') setFalseEval(evaluationData)
          else if (evaluation.choice === 'unknown') setUnknownEval(evaluationData)
        })
      }
    } catch (err) {
      setError('Failed to load evaluations')
    } finally {
      setLoading(false)
    }
  }

  const saveEvaluations = async () => {
    try {
      setSaving(true)
      setError(null)

      const evaluationsToSave = [
        { choice: 'true', ...trueEval },
        { choice: 'false', ...falseEval },
        { choice: 'unknown', ...unknownEval }
      ]

      console.log('Saving evaluations:', evaluationsToSave)
      console.log('Saving to URL:', `/api/statements/${statement.id}/evaluations/bulk`)
      console.log('Statement ID being used:', statement.id)

      const response = await fetch(`/api/statements/${statement.id}/evaluations/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations: evaluationsToSave })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Save result:', result)
        await loadEvaluations() // Refresh the data
      } else {
        const errorData = await response.json()
        console.error('Save error:', errorData)
        setError(errorData.error || 'Failed to save evaluations')
      }
    } catch (err) {
      console.error('Save exception:', err)
      setError('Failed to save evaluations')
    } finally {
      setSaving(false)
    }
  }

  const setDefaultScoring = () => {
    // Set default scoring based on legacy truthLabel
    const truthLabel = statement.truthLabel === 'unknowable' ? 'unknown' : statement.truthLabel

    if (truthLabel === 'true') {
      setTrueEval({ isCorrect: true, points: 100, feedback: 'Correct! This statement is true.' })
      setFalseEval({ isCorrect: false, points: -80, feedback: 'Incorrect. This statement is actually true.' })
      setUnknownEval({ isCorrect: false, points: -40, feedback: 'This statement has a definitive answer: true.' })
    } else if (truthLabel === 'false') {
      setTrueEval({ isCorrect: false, points: -80, feedback: 'Incorrect. This statement is actually false.' })
      setFalseEval({ isCorrect: true, points: 100, feedback: 'Correct! This statement is false.' })
      setUnknownEval({ isCorrect: false, points: -40, feedback: 'This statement has a definitive answer: false.' })
    } else if (truthLabel === 'unknown') {
      setTrueEval({ isCorrect: false, points: -40, feedback: 'This statement cannot be determined to be true.' })
      setFalseEval({ isCorrect: false, points: -40, feedback: 'This statement cannot be determined to be false.' })
      setUnknownEval({ isCorrect: true, points: 70, feedback: 'Correct! This statement is unknowable with the given information.' })
    }
  }


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading evaluations...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Configure Statement Scoring</CardTitle>
              <p className="text-sm text-gray-600 mt-2">{statement.text}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{statement.topic}</Badge>
                <Badge variant="secondary">Legacy: {statement.truthLabel}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={setDefaultScoring} variant="outline">
              Set Default Scoring
            </Button>
            <Button onClick={saveEvaluations} disabled={saving}>
              {saving ? 'Saving...' : 'Save Evaluations'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TRUE Form */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500 text-white">
                    TRUE
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="true-correct"
                    checked={trueEval.isCorrect}
                    onChange={(e) => setTrueEval({ ...trueEval, isCorrect: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="true-correct">Mark as correct</Label>
                </div>
                
                <div>
                  <Label htmlFor="true-points">Points</Label>
                  <Input
                    id="true-points"
                    type="number"
                    value={trueEval.points}
                    onChange={(e) => setTrueEval({ ...trueEval, points: parseInt(e.target.value) || 0 })}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="true-feedback">Feedback</Label>
                  <Textarea
                    id="true-feedback"
                    value={trueEval.feedback}
                    onChange={(e) => setTrueEval({ ...trueEval, feedback: e.target.value })}
                    placeholder="Feedback for this choice..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* FALSE Form */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-500 text-white">
                    FALSE
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="false-correct"
                    checked={falseEval.isCorrect}
                    onChange={(e) => setFalseEval({ ...falseEval, isCorrect: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="false-correct">Mark as correct</Label>
                </div>
                
                <div>
                  <Label htmlFor="false-points">Points</Label>
                  <Input
                    id="false-points"
                    type="number"
                    value={falseEval.points}
                    onChange={(e) => setFalseEval({ ...falseEval, points: parseInt(e.target.value) || 0 })}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="false-feedback">Feedback</Label>
                  <Textarea
                    id="false-feedback"
                    value={falseEval.feedback}
                    onChange={(e) => setFalseEval({ ...falseEval, feedback: e.target.value })}
                    placeholder="Feedback for this choice..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* UNKNOWN Form */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gray-500 text-white">
                    UNKNOWN
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="unknown-correct"
                    checked={unknownEval.isCorrect}
                    onChange={(e) => setUnknownEval({ ...unknownEval, isCorrect: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="unknown-correct">Mark as correct</Label>
                </div>
                
                <div>
                  <Label htmlFor="unknown-points">Points</Label>
                  <Input
                    id="unknown-points"
                    type="number"
                    value={unknownEval.points}
                    onChange={(e) => setUnknownEval({ ...unknownEval, points: parseInt(e.target.value) || 0 })}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="unknown-feedback">Feedback</Label>
                  <Textarea
                    id="unknown-feedback"
                    value={unknownEval.feedback}
                    onChange={(e) => setUnknownEval({ ...unknownEval, feedback: e.target.value })}
                    placeholder="Feedback for this choice..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {evaluations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Current Evaluations</h3>
              <div className="space-y-2">
                {evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant={evaluation.isCorrect ? "default" : "destructive"}>
                        {evaluation.choice.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{evaluation.points} points</span>
                      <span className="text-sm text-gray-600">{evaluation.feedback}</span>
                    </div>
                    <Badge variant={evaluation.isCorrect ? "default" : "secondary"}>
                      {evaluation.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
