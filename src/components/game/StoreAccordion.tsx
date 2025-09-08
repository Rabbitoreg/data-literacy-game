'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Clock, DollarSign, Package, Zap } from 'lucide-react'
import { StoreItem } from '@/types/game'
import { formatCurrency, formatTime } from '@/lib/utils'

interface StoreAccordionProps {
  items: StoreItem[]
  onPurchase: (itemId: string) => void
  budgetRemaining: number
  canPurchase: boolean
  purchasedItems: string[]
}

const categoryIcons = {
  people_process: '👥',
  data_artifact: '📊', 
  analytics_view: '📈',
  quality_check: '✅',
  context_intel: '🔍'
}

const categoryColors = {
  people_process: 'bg-blue-100 text-blue-800',
  data_artifact: 'bg-green-100 text-green-800',
  analytics_view: 'bg-purple-100 text-purple-800', 
  quality_check: 'bg-orange-100 text-orange-800',
  context_intel: 'bg-teal-100 text-teal-800'
}

export function StoreAccordion({ 
  items, 
  onPurchase, 
  budgetRemaining, 
  canPurchase,
  purchasedItems 
}: StoreAccordionProps) {
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, StoreItem[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Information Store
        </CardTitle>
        <div className="text-sm text-gray-600">
          Budget Remaining: <span className="font-bold text-green-600">{formatCurrency(budgetRemaining)}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <AccordionItem key={category} value={category} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                  <span className="font-medium capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                    {categoryItems.length} items
                  </Badge>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {categoryItems.map((item) => {
                    const canAfford = budgetRemaining >= item.costMoney
                    const alreadyPurchased = purchasedItems.includes(item.id)
                    const isAvailable = canPurchase && canAfford && !alreadyPurchased
                    
                    return (
                      <div 
                        key={item.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 ml-3">
                            <div className="flex items-center gap-1 text-xs">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(item.costMoney)}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {item.costTimeMin}m
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {item.deliveryType === 'observable_cell' && (
                              <Badge variant="outline" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Observable
                              </Badge>
                            )}
                            {item.isPersistent && (
                              <Badge variant="outline" className="text-xs">
                                Reusable
                              </Badge>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => onPurchase(item.id)}
                            disabled={!isAvailable}
                            variant={alreadyPurchased ? "secondary" : "default"}
                          >
                            {alreadyPurchased ? 'Purchased' : 
                             !canAfford ? 'Too Expensive' :
                             !canPurchase ? 'Purchase Locked' : 'Purchase'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="mt-4 text-xs text-gray-500 bg-yellow-50 p-2 rounded">
          💡 You can only purchase ONE item per statement. Choose wisely!
        </div>
      </CardContent>
    </Card>
  )
}
