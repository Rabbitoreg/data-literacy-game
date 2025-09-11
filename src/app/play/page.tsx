'use client'

import React, { useState, useEffect, useRef, memo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '../../components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog'
import { ArrowUp, ArrowDown, DollarSign, ShoppingCart, Users, Target, TrendingUp, TrendingDown, Circle } from 'lucide-react'
import { StoreAccordion } from '@/components/game/StoreAccordion'
import { TeamSetupModal } from '@/components/game/TeamSetupModal'
import { DecisionControls } from '@/components/game/DecisionControls'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'

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
  members?: string[]
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
  data_type?: string
  lead_time_minutes: number
  observablehq_url?: string
  purchase_count?: number
}

interface Decision {
  id: string
  team_id: string
  statement_id: string
  choice: 'true' | 'false' | 'unknown'
  rationale: string
  confidence: number
  decider_name: string
  is_correct?: boolean
  points_earned: number
  submitted_at: string
  evidence_items?: string[]
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
  const playerName = searchParams.get('name')
  const { toast } = useToast()

  const [team, setTeam] = useState<Team | null>(null)
  const [statements, setStatements] = useState<Statement[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingItem, setViewingItem] = useState<Item | null>(null)
  const [previousScore, setPreviousScore] = useState<number | null>(null)
  const [scoreChange, setScoreChange] = useState<'up' | 'down' | null>(null)
  const [purchasedHints, setPurchasedHints] = useState<Set<string>>(new Set())
  const [lastHintCount, setLastHintCount] = useState(0)
  const [lastDecisionCount, setLastDecisionCount] = useState(0)

  const [selectedChoice, setSelectedChoice] = useState<'true' | 'false' | 'unknown'>('true')
  const [confidence, setConfidence] = useState(70)
  const [rationale, setRationale] = useState('')
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([])
  const [storeSearchTerm, setStoreSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Load team data and add player if needed
  const loadTeamData = async () => {
    if (!teamNumber) return
    try {
      const response = await fetch(`/api/teams/${teamNumber}`)
      if (response.ok) {
        const data = await response.json()
        
        // Track score changes for arrow indicator
        if (team && team.score !== data.team.score) {
          setPreviousScore(team.score)
          if (data.team.score > team.score) {
            setScoreChange('up')
          } else if (data.team.score < team.score) {
            setScoreChange('down')
          }
        }
        
        // Team data loaded
        setTeam(data.team)
        
        // Add player to team if name is provided and not already in team
        if (playerName && data.team && !data.team.members?.includes(playerName)) {
          await addPlayerToTeam(playerName)
        }
      }
    } catch (err) {
      console.error('Failed to load team data:', err)
    }
  }

  // Load purchased hints for the team
  const loadPurchasedHints = async () => {
    if (!teamNumber) return
    try {
      const response = await fetch(`/api/teams/${teamNumber}/hints`)
      if (response.ok) {
        const data = await response.json()
        const hintIds = data.hints.map((hint: any) => hint.statement_id)
        setPurchasedHints(new Set(hintIds))
      }
    } catch (err) {
      console.error('Failed to load purchased hints:', err)
    }
  }

  // Load statements
  const loadStatements = async () => {
    try {
      const response = await fetch('/api/statements')
      if (response.ok) {
        const data = await response.json()
        setStatements(data.statements || [])
      }
    } catch (err) {
      console.error('Failed to load statements:', err)
    }
  }

  // Add player to team
  const addPlayerToTeam = async (name: string) => {
    if (!teamNumber) return
    try {
      const response = await fetch(`/api/teams/${teamNumber}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (response.ok) {
        // Reload team data to get updated member list
        loadTeamData()
      }
    } catch (err) {
      console.error('Failed to add player to team:', err)
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

  const loadItems = async () => {
    if (!team?.id) return
    try {
      const itemsResponse = await fetch(`/api/items?teamId=${team.id}`)
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setItems(itemsData.items || [])
      }
    } catch (err) {
      console.error('Error loading items:', err)
    }
  }

  // Load initial data
  useEffect(() => {
    if (!teamNumber) return

    const loadData = async () => {
      try {
        setLoading(true)
        await loadTeamData()
        await loadStatements()
        await loadDecisions()
        await loadItems()
        await loadPurchases()
        await loadPurchasedHints()
        setLoading(false)
      } catch (err) {
        console.error('Error loading data:', err)
        setLoading(false)
      }
    }

    loadData()
  }, [teamNumber])

  // Periodically refresh purchased hints to sync with other team members
  useEffect(() => {
    if (!teamNumber) return

    const interval = setInterval(() => {
      loadPurchasedHints()
      loadDecisions() // Also refresh decisions to catch new submissions
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [teamNumber])

  // Monitor hint purchases for notifications
  useEffect(() => {
    const currentHintCount = purchasedHints.size
    if (lastHintCount > 0 && currentHintCount > lastHintCount) {
      // New hint purchased by team member
      toast({
        title: "💡 Hint Purchased!",
        description: "A team member just purchased a hint for the current statement.",
        variant: "info",
      })
    }
    setLastHintCount(currentHintCount)
  }, [purchasedHints.size, lastHintCount, toast])

  // Monitor decision submissions for notifications
  useEffect(() => {
    const currentDecisionCount = decisions.length
    if (lastDecisionCount > 0 && currentDecisionCount > lastDecisionCount) {
      // New decision submitted by team member
      const latestDecision = decisions[decisions.length - 1]
      toast({
        title: "📝 Decision Submitted!",
        description: `A team member submitted a decision: ${latestDecision.choice.toUpperCase()}`,
        variant: "success",
      })
    }
    setLastDecisionCount(currentDecisionCount)
  }, [decisions.length, lastDecisionCount, toast])

  // Load items when team data is available
  useEffect(() => {
    if (team?.id) {
      loadItems()
    }
  }, [team?.id])

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
    if (!currentStatement || !team || !rationale.trim()) return

    // Submitting decision

    try {
      const response = await fetch(`/api/teams/${team.team_number}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementId: currentStatement.id,
          choice: selectedChoice,
          rationale: rationale.trim(),
          confidence,
          deciderName: assignedDecisionMaker || playerName || 'Unknown',
          evidence_items: selectedEvidence
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Reload decisions and team data to update UI and show score changes
        await loadDecisions()
        await loadTeamData()
        
        // Reset form
        setRationale('')
        setSelectedChoice('true')
        setConfidence(70)
        setSelectedEvidence([])
        
        // Decision submitted successfully - the next undecided statement will be automatically calculated
      } else {
        const errorData = await response.json()
        console.error('Decision submission failed:', errorData)
        setError(errorData.error || 'Failed to submit decision')
      }
    } catch (err) {
      console.error('Error submitting decision:', err)
      setError('Failed to submit decision')
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

      // Refresh team data, purchases, and items after successful purchase
      await loadTeamData()
      await loadPurchases()
      await loadItems() // Reload items to show newly available items based on prerequisites
    } catch (error) {
      console.error('Error purchasing item:', error)
    }
  }

  const handleViewItem = (item: Item) => {
    if (viewingItem?.id === item.id) {
      setViewingItem(null)
    } else {
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
    }
  }

  const handleBackToGame = () => {
    setViewingItem(null)
  }

  const handlePurchaseHint = async (statementId: string) => {
    console.log('handlePurchaseHint called with:', statementId, typeof statementId)
    
    if (!team || (team.budget ?? 0) < 10) return
    
    try {
      console.log('Purchasing hint for statement:', statementId, 'team:', team.team_number)
      const response = await fetch(`/api/teams/${team.team_number}/purchase-hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId })
      })

      console.log('Purchase hint response:', response.status)
      
      if (response.ok) {
        setPurchasedHints(prev => new Set(Array.from(prev).concat(statementId)))
        await loadTeamData() // Refresh team data to update budget
        
        // Show success notification for current user
        toast({
          title: "✅ Hint Purchased!",
          description: "You successfully purchased a hint for this statement.",
          variant: "success",
        })
      } else {
        const errorData = await response.json()
        console.error('Purchase hint error:', errorData)
        
        // If hint was already purchased by another team member, refresh hints to show it
        if (response.status === 400 && errorData.error?.includes('already purchased')) {
          console.log('Hint already purchased, refreshing hints list')
          await loadPurchasedHints()
        }
      }
    } catch (error) {
      console.error('Error purchasing hint:', error)
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

  // Find the next undecided statement
  const getNextUndecidedStatement = () => {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const hasDecision = decisions.some(d => d.statement_id === statement.id)
      if (!hasDecision) {
        return { statement, index: i }
      }
    }
    return null
  }

  const nextUndecided = getNextUndecidedStatement()
  const currentStatement = nextUndecided?.statement
  const currentStatementIndex = nextUndecided?.index ?? statements.length
  
  // Get assigned decision maker for current statement
  const getAssignedDecisionMaker = (statementIndex: number) => {
    if (!team?.members || team.members.length === 0) return null
    
    // Use statement index to rotate through team members
    const memberIndex = statementIndex % team.members.length
    return team.members[memberIndex]
  }
  
  const assignedDecisionMaker = currentStatement ? getAssignedDecisionMaker(currentStatementIndex) : null

  // Get completed decisions with statement details
  const completedDecisions = decisions.map(decision => {
    const statement = statements.find(s => s.id === decision.statement_id)
    return { ...decision, statement }
  }).filter(d => d.statement)
  
  // Get purchased items for evidence selection
  const purchasedItems = purchases.filter(p => p.status === 'delivered').map(p => p.item)
  
  // Filter items for store
  const categories = Array.from(new Set(items.map(item => item.data_type || 'other')))
  const filteredItems = items.filter(item => {
    const matchesSearch = !storeSearchTerm || 
      item.name.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(storeSearchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
      (item.data_type || 'other') === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  const handleEvidenceToggle = (itemId: string) => {
    setSelectedEvidence(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }
  
  // Game state ready

  // Show item detail view if viewing an item
  if (viewingItem) {
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
                <CardTitle>Context</CardTitle>
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
            {team?.members && team.members.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Team Members:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {team.members.map((member: string, index: number) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${team?.budget}</div>
              <div className="text-sm text-gray-500">Budget</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl font-bold text-blue-600">{team?.score}</div>
                {scoreChange && (
                  <>
                    {scoreChange === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : scoreChange === 'down' ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : null}
                  </>
                )}
              </div>
              <div className="text-sm text-gray-500">Total Score</div>
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
              Evidence Store & Purchases
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="game" className="mt-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Main Decision Area */}
              <div className="col-span-8">
          {currentStatement ? (
            <Card>
              <CardHeader>
                <CardTitle>Statement {currentStatementIndex + 1} of {statements.length}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentStatement.topic}</Badge>
                  {assignedDecisionMaker && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Decision Maker: {assignedDecisionMaker}
                    </Badge>
                  )}
                </div>
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
                    <textarea
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="Explain your reasoning..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      required
                    />
                  </div>

                  {purchasedItems.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select evidence to support your decision (optional):
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {purchasedItems.map((item) => (
                          <label key={item.id} className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors duration-200 border border-transparent hover:border-blue-200">
                            <input
                              type="checkbox"
                              checked={selectedEvidence.includes(item.id)}
                              onChange={() => handleEvidenceToggle(item.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{item.name}</span>
                          </label>
                        ))}
                      </div>
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

          {/* Completed Decisions Section */}
          {completedDecisions.length > 0 && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Previous Decisions ({completedDecisions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {completedDecisions.map((decision, index) => {
                      const statementIndex = statements.findIndex(s => s.id === decision.statement_id) + 1
                      
                      // Get evaluations from statement
                      let evaluations = []
                      if (decision.statement?.recommended_items) {
                        try {
                          const items = decision.statement.recommended_items
                          if (Array.isArray(items) && items.length > 0) {
                            const lastItem = items[items.length - 1]
                            if (typeof lastItem === 'string' && lastItem.startsWith('{')) {
                              const parsed = JSON.parse(lastItem)
                              evaluations = parsed.evaluations || []
                            }
                          }
                        } catch (e) {
                          evaluations = []
                        }
                      }

                      return (
                        <div key={decision.id} className="border rounded-lg bg-white shadow-sm">
                          {/* Header */}
                          <div className="p-4 border-b bg-gray-800 text-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-sm bg-white text-gray-800 border-gray-300">
                                  Statement {statementIndex}
                                </Badge>
                                <span className="text-sm text-gray-300">
                                  {new Date(decision.submitted_at).toLocaleString()}
                                </span>
                              </div>
                              <span className="text-sm text-gray-300">
                                Decided by: {decision.decider_name}
                              </span>
                            </div>
                          </div>

                          {/* Statement */}
                          <div className="p-4 border-b">
                            <p className="font-medium text-gray-900 mb-2">
                              {decision.statement?.text}
                            </p>
                          </div>

                          {/* Team Decision */}
                          <div className="p-4 border-b">
                            <h4 className="font-semibold text-gray-900 mb-3">Team Decision</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">Choice</label>
                                <div className="mt-1">
                                  <Badge 
                                    variant={decision.choice === 'true' ? 'default' : decision.choice === 'false' ? 'destructive' : 'secondary'}
                                    className="text-lg px-3 py-1"
                                  >
                                    {decision.choice.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Confidence</label>
                                <div className="mt-1 text-lg font-semibold text-gray-900">
                                  {decision.confidence}%
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Points Earned</label>
                                <div className="mt-1">
                                  <span className={`text-lg font-bold ${
                                    decision.points_earned > 0 ? 'text-green-600' : 
                                    decision.points_earned < 0 ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    {decision.points_earned > 0 ? '+' : ''}{decision.points_earned}
                                  </span>
                                  {evaluations.length > 0 && (() => {
                                    const evaluation = evaluations.find((e: any) => e.choice === decision.choice)
                                    if (evaluation) {
                                      const basePoints = evaluation.points
                                      const originalConfidence = decision.confidence
                                      const hasEvidence = decision.evidence_items && decision.evidence_items.length > 0
                                      
                                      // Calculate if evidence boost was applied
                                      const expectedPointsWithoutBoost = Math.round(basePoints * (originalConfidence / 100))
                                      const actualPoints = decision.points_earned
                                      const evidenceBoostApplied = hasEvidence && actualPoints > expectedPointsWithoutBoost
                                      
                                      if (evidenceBoostApplied) {
                                        // Calculate the effective confidence that would result in these points
                                        const effectiveConfidence = Math.round((actualPoints / basePoints) * 100)
                                        const boost = effectiveConfidence - originalConfidence
                                        
                                        return (
                                          <div className="text-xs text-gray-500 mt-1">
                                            {basePoints} × ({originalConfidence}% + {boost}% evidence boost) = {actualPoints}
                                          </div>
                                        )
                                      } else {
                                        return (
                                          <div className="text-xs text-gray-500 mt-1">
                                            {basePoints} × {originalConfidence}% = {actualPoints}
                                          </div>
                                        )
                                      }
                                    }
                                    return null
                                  })()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-600">Rationale</label>
                              <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-md">
                                {decision.rationale}
                              </p>
                            </div>

                            {/* Evidence Items */}
                            {decision.evidence_items && decision.evidence_items.length > 0 && (
                              <div className="mt-4">
                                <label className="text-sm font-medium text-gray-600">Evidence Used</label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {decision.evidence_items.map((itemId: string, idx: number) => {
                                    const item = items.find(i => i.id === itemId)
                                    return item ? (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {item.name}
                                      </Badge>
                                    ) : null
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Acceptable Answers */}
                          {evaluations.length > 0 && (
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Acceptable Answers</h4>
                              <div className="space-y-2">
                                {evaluations.map((evaluation: any, evalIdx: number) => (
                                  <div key={evalIdx} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                                    <div className="flex items-center gap-3">
                                      <Badge 
                                        variant={evaluation.choice === 'true' ? 'default' : evaluation.choice === 'false' ? 'destructive' : 'secondary'}
                                        className="text-sm"
                                      >
                                        {evaluation.choice.toUpperCase()}
                                      </Badge>
                                      <span className="text-sm text-gray-700">{evaluation.feedback}</span>
                                    </div>
                                    <span className={`text-sm font-semibold ${
                                      evaluation.points > 0 ? 'text-green-600' : 
                                      evaluation.points < 0 ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                      {evaluation.points > 0 ? '+' : ''}{evaluation.points} pts
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

              {/* Hint section */}
              <div className="col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Hint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentStatement && purchasedHints.has(currentStatement.id) ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            {(currentStatement as any).statement_hint || 'No hint available for this statement.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-gray-600 text-sm">
                          Need help with this statement? Purchase a hint to get additional guidance.
                        </p>
                        <Button
                          onClick={() => {
                            const statementId = currentStatement?.id;
                            console.log('Button onClick - statementId:', statementId);
                            if (statementId) {
                              handlePurchaseHint(statementId);
                            }
                          }}
                          disabled={!team || (team.budget ?? 0) < 10 || !currentStatement}
                          className="w-full"
                          variant="outline"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Purchase Hint (10 coins)
                        </Button>
                        {team && (team.budget ?? 0) < 10 && (
                          <p className="text-red-500 text-xs">Insufficient budget</p>
                        )}
                      </div>
                    )}
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
                    {/* Store Filters */}
                    <div className="mb-6 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Search items..."
                            value={storeSearchTerm}
                            onChange={(e) => setStoreSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="sm:w-48">
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                              <option key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {filteredItems.map((item) => {
                        const purchase = purchases.find(p => p.item_id === item.id)
                        const isPurchased = !!purchase
                        
                        return (
                          <div key={item.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">${item.cost}</Badge>
                                {item.purchase_count !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.purchase_count} sold
                                  </Badge>
                                )}
                              </div>
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
                              disabled={!team || (!isPurchased && (team.budget ?? 0) < item.cost)}
                              className={`w-full transition-all duration-200 ${isPurchased ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700' : ''}`}
                              variant={isPurchased ? "default" : "default"}
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

      <Toaster />
    </div>
  )
}
