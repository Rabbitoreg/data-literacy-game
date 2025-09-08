'use client'

import React, { useState, useEffect, useRef, memo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Observable embed component - memoized to prevent re-renders
const ObservableEmbed = memo(({ url, itemId }: { url: string, itemId: string }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeCreated = useRef(false)

  useEffect(() => {
    if (!containerRef.current || iframeCreated.current) return

    // Convert regular Observable URL to embed format and add parameters to hide footer
    let embedUrl = url.includes('/embed/') ? url : url.replace('observablehq.com/', 'observablehq.com/embed/')
    
    // Add Observable HQ parameters to hide banner and optimize display
    const urlObj = new URL(embedUrl)
    urlObj.searchParams.set('banner', 'false')
    embedUrl = urlObj.toString()
    
    const iframe = document.createElement('iframe')
    iframe.src = embedUrl
    iframe.width = '100%'
    iframe.height = '400'
    iframe.style.border = 'none'
    iframe.style.borderRadius = '8px'
    iframe.style.overflow = 'hidden'
    
    // Create wrapper div for iframe container
    const wrapper = document.createElement('div')
    wrapper.style.width = '100%'
    wrapper.style.borderRadius = '8px'
    wrapper.style.position = 'relative'
    
    // Add sandbox and allow attributes to fix permissions policy violations
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms')
    iframe.setAttribute('allow', 'clipboard-write; autoplay; camera; encrypted-media; fullscreen; geolocation; microphone; midi; accelerometer; gyroscope; magnetometer; payment; usb')
    
    // Auto-resize iframe to content height to eliminate scrollbars
    iframe.onload = () => {
      try {
        // Wait a bit for Observable content to fully render
        setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
            if (iframeDoc) {
              const body = iframeDoc.body
              const html = iframeDoc.documentElement
              
              // With banner=false, calculate precise content height to eliminate scrollbars
              const height = Math.max(
                body?.scrollHeight || 0,
                body?.offsetHeight || 0,
                html?.clientHeight || 0,
                html?.scrollHeight || 0,
                html?.offsetHeight || 0
              )
              
              // Set iframe to exact content height since banner is now hidden
              const finalHeight = height + 20 // Small padding for safety
              iframe.height = finalHeight.toString()
              iframe.style.height = `${finalHeight}px`
            }
          } catch (e) {
            // Cross-origin restrictions - fallback to larger default height
            iframe.height = '600'
            iframe.style.height = '600px'
          }
        }, 2000) // Wait 2 seconds for Observable charts to render
      } catch (e) {
        console.log('iframe resize failed:', e)
      }
    }
    
    // Add error handling for CSP issues
    iframe.onerror = () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="p-4 text-center">
            <p class="text-gray-600 mb-3">Interactive chart available at:</p>
            <a href="${url}" target="_blank" class="text-blue-600 hover:underline">${url}</a>
            <p class="text-sm text-gray-500 mt-2">Click to open in new tab</p>
          </div>
        `
      }
    }

    // Add iframe to wrapper, then wrapper to container
    wrapper.appendChild(iframe)
    containerRef.current.appendChild(wrapper)
    iframeCreated.current = true

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      iframeCreated.current = false
    }
  }, [url, itemId])

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <h3 className="font-medium mb-2">Interactive Charts & Data</h3>
      <div 
        ref={containerRef}
        className="bg-white rounded border"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
})

ObservableEmbed.displayName = 'ObservableEmbed'

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
  content: string
  delivery_type: 'instant' | 'timed'
  lead_time_minutes: number
  observablehq_url?: string
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
  item: {
    id: string
    name: string
    description: string
    cost: number
    content: string
    observablehq_url?: string
  }
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayPageContent />
    </Suspense>
  )
}

function PlayPageContent() {
  const searchParams = useSearchParams()
  const teamNumber = searchParams.get('team')

  const [team, setTeam] = useState<Team | null>(null)
  const [statements, setStatements] = useState<Statement[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0)
  const [viewingItem, setViewingItem] = useState<Item | null>(null)
  const [showItemView, setShowItemView] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const [selectedChoice, setSelectedChoice] = useState<'true' | 'false' | 'unknown'>('true')
  const [confidence, setConfidence] = useState(70)
  const [rationale, setRationale] = useState('')
  const [loading, setLoading] = useState(true)

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

        // Load items
        const itemsResponse = await fetch('/api/items')
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setItems(itemsData.items || [])
        }

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
          confidence
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDecisions(prev => [...prev, data.decision])
        setTeam(data.team)
        
        // Move to next statement
        setCurrentStatementIndex(prev => prev + 1)
        setSelectedChoice('true')
        setRationale('')
        setConfidence(70)
      }
    } catch (err) {
      console.error('Failed to submit decision:', err)
    }
  }

  const handlePurchaseItem = async (itemId: string) => {
    if (!team) return

    try {
      const response = await fetch(`/api/teams/${team.team_number}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: itemId,
          statement_id: currentStatement?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to purchase item')
      }

      // Reload data to reflect the purchase
      await loadTeamData()
      await loadPurchases()
    } catch (error) {
      console.error('Error purchasing item:', error)
    }
  }

  const handleViewItem = (item: Item) => {
    // Find the purchase data for this item to get the most up-to-date info
    const purchaseData = purchases.find(p => p.item_id === item.id)
    if (purchaseData && purchaseData.item) {
      // Type assertion to ensure the item has all required fields
      const fullItem: Item = {
        ...purchaseData.item,
        delivery_type: (purchaseData.item as any).delivery_type || 'instant',
        lead_time_minutes: (purchaseData.item as any).lead_time_minutes || 0
      }
      setViewingItem(fullItem)
    } else {
      setViewingItem(item)
    }
    setShowItemView(true)
  }

  const handleBackToGame = () => {
    setShowItemView(false)
    setViewingItem(null)
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
  
  // Debug logging - force refresh
  console.log('Debug NEW - statements:', statements.length, 'currentIndex:', currentStatementIndex, 'currentStatement:', currentStatement)
  console.log('Debug NEW - decisions:', decisions, 'hasDecisionForCurrent:', hasDecisionForCurrent, 'timestamp:', Date.now())

  // Show item detail view if viewing an item
  if (showItemView && viewingItem) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={handleBackToGame}
              variant="outline"
              className="flex items-center gap-2"
            >
              ← Back to Game
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{viewingItem.name}</h1>
              <p className="text-gray-600">Team {team?.team_number}</p>
            </div>
          </div>

          {/* Item Content */}
          <div className="space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{viewingItem.description || 'No description available'}</p>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{viewingItem.content || 'No content available'}</p>
              </CardContent>
            </Card>

            {/* Observable HQ Chart */}
            {viewingItem.observablehq_url && (
              <ObservableEmbed url={viewingItem.observablehq_url} itemId={viewingItem.id} />
            )}
          </div>
        </div>
      </div>
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

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="game" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Decision Making
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Store & Purchases
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="game" className="mt-6">
            <div className="grid grid-cols-12 gap-6">
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

              {/* Charts and additional game content can go here */}
              <div className="col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Observable HQ Charts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-sm">Charts will be integrated here</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="store" className="mt-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Information Store */}
              <div className="col-span-12">
                <Card>
                  <CardHeader>
                    <CardTitle>Information Store</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {items.map((item) => {
                        const purchase = purchases.find(p => p.item_id === item.id)
                        const isPurchased = !!purchase
                        
                        return (
                          <div key={item.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <Badge variant="outline">${item.cost}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            
                            {isPurchased && purchase && (
                              <div className="mb-3 p-2 bg-green-50 rounded text-sm">
                                <div className="text-green-700 font-medium">Purchased</div>
                                <div className="text-green-600">${purchase.cost} • {new Date(purchase.purchased_at).toLocaleTimeString()}</div>
                              </div>
                            )}
                            
                            <Button
                              size="sm"
                              onClick={() => isPurchased ? handleViewItem(item) : handlePurchaseItem(item.id)}
                              disabled={!team || (!isPurchased && team.budget < item.cost)}
                              className="w-full"
                              variant={isPurchased ? "default" : "default"}
                              style={isPurchased ? { backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' } : {}}
                            >
                              {isPurchased ? (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  VIEW
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                                  </svg>
                                  Purchase
                                </>
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  )
}
