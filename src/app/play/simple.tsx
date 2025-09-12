'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Team {
  id: string
  team_number: number
  budget: number
  score: number
  created_at: string
}

interface Statement {
  id: string
  text: string
  topic: string
  difficulty: number
  ambiguity: number
  truth_label: boolean | null
  reason_key: string
  recommended_items: string[]
}

interface Item {
  id: string
  name: string
  description: string
  cost: number
  delivery_type: 'instant' | 'timed'
  lead_time_minutes: number
  content?: string
}

interface Decision {
  id: string
  team_id: string
  statement_id: string
  choice: 'true' | 'false' | 'unknown'
  rationale: string
  confidence: number
  is_correct?: boolean
  points_earned: number
  submitted_at: string
}

interface Purchase {
  id: string
  team_id: string
  item_id: string
  cost: number
  status: 'pending' | 'delivered'
  purchased_at: string
  delivered_at?: string
  item: Item
}

export default function PlayPage() {
  const searchParams = useSearchParams()
  const teamNumber = searchParams.get('team')

  const [team, setTeam] = useState<Team | null>(null)
  const [statements, setStatements] = useState<Statement[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<'true' | 'false' | 'unknown'>('true')
  const [confidence, setConfidence] = useState(70)
  const [rationale, setRationale] = useState('')
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([])
  const [storeSearchTerm, setStoreSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load team data
  const loadTeamData = async () => {
    if (!teamNumber) return
    try {
      const response = await fetch(`/api/teams/${teamNumber}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data.team)
      }
    } catch (err) {
      console.error('Failed to load team data:', err)
    }
  }

  // Load decisions
  const loadDecisions = async () => {
    if (!teamNumber) return
    try {
      const response = await fetch(`/api/teams/${teamNumber}/decisions`)
      if (response.ok) {
        const data = await response.json()
        setDecisions(data.decisions || [])
      }
    } catch (err) {
      console.error('Failed to load decisions:', err)
    }
  }

  // Load purchases
  const loadPurchases = async () => {
    if (!teamNumber) return
    try {
      const response = await fetch(`/api/teams/${teamNumber}/purchases`)
      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchases || [])
      }
    } catch (err) {
      console.error('Failed to load purchases:', err)
    }
  }

  // Load items with prerequisite filtering
  const loadItems = async () => {
    if (!teamNumber) return
    try {
      const itemsResponse = await fetch(`/api/items?teamId=${teamNumber}`)
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setItems(itemsData.items || [])
      }
    } catch (err) {
      console.error('Failed to load items:', err)
    }
  }

  // Load initial data
  useEffect(() => {
    if (!teamNumber) return

    const loadData = async () => {
      try {
        setLoading(true)
        
        await loadTeamData()

        // Load statements
        const statementsResponse = await fetch('/api/statements')
        if (statementsResponse.ok) {
          const statementsData = await statementsResponse.json()
          setStatements(statementsData.statements || [])
        }

        await loadItems()

        await loadDecisions()
        await loadPurchases()

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        setLoading(false)
      }
    }

    loadData()
  }, [teamNumber])

  // Setup polling for updates (Vercel-compatible)
  useEffect(() => {
    if (!teamNumber) return
    
    // Poll for updates every 10 seconds
    const pollInterval = setInterval(() => {
      loadTeamData()
      loadDecisions()
      loadPurchases()
    }, 10000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [teamNumber])

  const handleSubmitDecision = async () => {
    if (!team || !statements[currentStatementIndex] || !rationale.trim()) return

    try {
      const response = await fetch(`/api/teams/${teamNumber}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement_id: statements[currentStatementIndex].id,
          choice: selectedChoice,
          rationale: rationale.trim(),
          confidence,
          evidence_items: selectedEvidence
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDecisions(prev => [...prev, data.decision])
        setTeam(data.team)
        
        // Reload items to show newly available items based on statement prerequisites
        await loadItems()
        
        // Move to next statement
        setCurrentStatementIndex(prev => prev + 1)
        setSelectedChoice('true')
        setRationale('')
        setConfidence(70)
        setSelectedEvidence([])
      }
    } catch (err) {
      console.error('Failed to submit decision:', err)
    }
  }

  const handlePurchaseItem = async (itemId: string) => {
    if (!team) return

    try {
      const response = await fetch(`/api/teams/${teamNumber}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          statement_id: statements[currentStatementIndex]?.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPurchases(prev => [...prev, data.purchase])
        setTeam(data.team)
      }
    } catch (err) {
      console.error('Failed to purchase item:', err)
    }
  }

  if (!teamNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error: No team selected</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStatement = statements[currentStatementIndex]
  const hasDecisionForCurrent = decisions.some(d => d.statement_id === currentStatement?.id)
  
  // Get purchased items for evidence selection
  const purchasedItems = purchases.filter(p => p.status === 'delivered').map(p => p.item)
  
  // Filter items for store
  const categories = Array.from(new Set(items.map(item => item.delivery_type || 'other')))
  const filteredItems = items.filter(item => {
    const matchesSearch = !storeSearchTerm || 
      item.name.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(storeSearchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
      (item.delivery_type || 'other') === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  const handleEvidenceToggle = (itemId: string) => {
    setSelectedEvidence(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold">Team {team?.team_number}</h1>
            <p className="text-gray-600">Data Decisions: Pilot Pursuit</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${team?.budget}</div>
              <div className="text-sm text-gray-500">Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{team?.score}</div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{decisions.length}</div>
              <div className="text-sm text-gray-500">Decisions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        {/* Main Decision Area */}
        <div className="col-span-8">
          {currentStatement && !hasDecisionForCurrent ? (
            <Card>
              <CardHeader>
                <CardTitle>Statement {currentStatementIndex + 1} of {statements.length}</CardTitle>
                <Badge variant="outline">{currentStatement.topic}</Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-lg">{currentStatement.text}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Decision</label>
                    <div className="flex gap-2">
                      {(['true', 'false', 'unknown'] as const).map((choice) => (
                        <Button
                          key={choice}
                          variant={selectedChoice === choice ? 'default' : 'outline'}
                          onClick={() => setSelectedChoice(choice)}
                          className="capitalize"
                        >
                          {choice}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Confidence: {confidence}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Rationale</label>
                    <Textarea
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="Explain your reasoning..."
                      rows={4}
                    />
                  </div>

                  {purchasedItems.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Supporting Evidence (Select purchased items that support your decision)
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                        {purchasedItems.map((item) => (
                          <label key={item.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedEvidence.includes(item.id)}
                              onChange={() => handleEvidenceToggle(item.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{item.name}</span>
                            <Badge variant="outline" className="text-xs">${item.cost}</Badge>
                          </label>
                        ))}
                      </div>
                      {selectedEvidence.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          {selectedEvidence.length} evidence item(s) selected
                        </p>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={handleSubmitDecision}
                    disabled={!rationale.trim()}
                    className="w-full"
                  >
                    Submit Decision
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-4">
                  {currentStatementIndex >= statements.length 
                    ? 'All statements completed!' 
                    : 'Decision submitted for this statement'}
                </h2>
                <p className="text-gray-600">
                  {currentStatementIndex >= statements.length
                    ? 'You have completed all available statements.'
                    : 'You can purchase information items or wait for the next round.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Information Store */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Information Store</CardTitle>
              <div className="space-y-3">
                {/* Search */}
                <div>
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={storeSearchTerm}
                    onChange={(e) => setStoreSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                
                {/* Category Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">${item.cost}</Badge>
                          {item.delivery_type && (
                            <Badge variant="secondary" className="text-xs">
                              {item.delivery_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      <Button
                        size="sm"
                        onClick={() => handlePurchaseItem(item.id)}
                        disabled={!team || team.budget < item.cost}
                        className="w-full"
                      >
                        Purchase
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No items match your search criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length > 0 ? (
                <div className="space-y-2">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{purchase.item.name}</div>
                      <div className="text-gray-600">${purchase.cost}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No purchases yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
