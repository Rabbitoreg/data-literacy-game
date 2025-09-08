'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, Download } from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface RechartsWidgetProps {
  type: 'bar' | 'line' | 'area'
  data: any[]
  xKey: string
  yKey: string
  title: string
  showDataTable?: boolean
  fallbackImage?: string
}

export function RechartsWidget({ 
  type, 
  data, 
  xKey, 
  yKey, 
  title, 
  showDataTable = false,
  fallbackImage 
}: RechartsWidgetProps) {
  const [showTable, setShowTable] = React.useState(false)

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#3b82f6" />
          </BarChart>
        )
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        )
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
          </AreaChart>
        )
      
      default:
        return null
    }
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {fallbackImage ? (
            <div className="text-center">
              <img 
                src={fallbackImage} 
                alt={title}
                className="max-w-full h-auto rounded border mx-auto"
              />
              <p className="text-sm text-gray-600 mt-2">
                Static fallback image (live chart data unavailable)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded border">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {showDataTable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTable(!showTable)}
              >
                <Table className="h-4 w-4 mr-1" />
                {showTable ? 'Hide' : 'Show'} Data
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Export data as CSV
                const csv = [
                  Object.keys(data[0]).join(','),
                  ...data.map(row => Object.values(row).join(','))
                ].join('\n')
                
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${title.replace(/\s+/g, '_')}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {showTable && showDataTable && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="border border-gray-300 px-2 py-1 text-left font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="border border-gray-300 px-2 py-1">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
