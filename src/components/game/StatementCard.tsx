'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Statement } from '@/types/game'

interface StatementCardProps {
  statement: Statement
  statementNumber: number
  totalStatements: number
}

const difficultyColors = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-blue-100 text-blue-800', 
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800'
}

const topicColors = {
  'Impact': 'bg-purple-100 text-purple-800',
  'Process': 'bg-indigo-100 text-indigo-800',
  'Quality': 'bg-teal-100 text-teal-800',
  'Context': 'bg-gray-100 text-gray-800'
}

export function StatementCard({ statement, statementNumber, totalStatements }: StatementCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">
            Statement {statementNumber} of {totalStatements}
          </div>
          <div className="flex gap-2">
            <Badge className={topicColors[statement.topic as keyof typeof topicColors] || 'bg-gray-100 text-gray-800'}>
              {statement.topic}
            </Badge>
            <Badge className={difficultyColors[statement.difficulty]}>
              Level {statement.difficulty}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg leading-relaxed">
          {statement.text}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">Difficulty:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      level <= statement.difficulty ? 'bg-orange-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="font-medium">Ambiguity:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      level <= statement.ambiguity ? 'bg-red-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {statement.visualRefs && statement.visualRefs.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Visual References:</div>
              <div className="grid gap-2">
                {statement.visualRefs.map((ref, index) => (
                  <div key={index} className="text-sm text-blue-600 hover:text-blue-800">
                    📊 {ref}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
