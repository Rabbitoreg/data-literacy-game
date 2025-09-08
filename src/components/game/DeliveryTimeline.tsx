'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Package, CheckCircle } from 'lucide-react'
import { Purchase } from '@/types/game'
import { formatTime } from '@/lib/utils'

interface DeliveryTimelineProps {
  purchases: Purchase[]
  currentTime: Date
}

export function DeliveryTimeline({ purchases, currentTime }: DeliveryTimelineProps) {
  const sortedPurchases = [...purchases].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'pending') return -1
      if (b.status === 'pending') return 1
    }
    return new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
  })

  const getTimeRemaining = (purchase: Purchase) => {
    if (purchase.status === 'delivered') return 0
    
    const deliveryTime = new Date(purchase.purchasedAt)
    deliveryTime.setMinutes(deliveryTime.getMinutes() + purchase.costTimeMin)
    
    const remaining = Math.max(0, Math.floor((deliveryTime.getTime() - currentTime.getTime()) / 1000))
    return remaining
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Delivery Timeline
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {sortedPurchases.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No purchases yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPurchases.map((purchase) => {
              const timeRemaining = getTimeRemaining(purchase)
              const isDelivered = purchase.status === 'delivered'
              
              return (
                <div 
                  key={purchase.id}
                  className={`border rounded-lg p-3 ${
                    isDelivered ? 'bg-green-50 border-green-200 purchase-delivered' : 
                    'bg-orange-50 border-orange-200 purchase-pending'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isDelivered ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-orange-600" />
                        )}
                        <span className="font-medium text-sm">Item #{purchase.itemId}</span>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        Purchased: {new Date(purchase.purchasedAt).toLocaleTimeString()}
                      </div>
                      
                      {purchase.deliveredAt && (
                        <div className="text-xs text-green-600">
                          Delivered: {new Date(purchase.deliveredAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant={isDelivered ? "default" : "secondary"}
                        className={isDelivered ? "bg-green-600" : "bg-orange-600"}
                      >
                        {isDelivered ? 'Delivered' : `${formatTime(timeRemaining)} left`}
                      </Badge>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        Lead time: {purchase.costTimeMin}m
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {purchases.some(p => p.status === 'pending') && (
          <div className="mt-4 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            ⏱️ Items will be delivered automatically when ready
          </div>
        )}
      </CardContent>
    </Card>
  )
}
