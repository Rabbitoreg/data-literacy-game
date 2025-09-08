'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ExternalLink, Table } from 'lucide-react'

interface ObservableEmbedProps {
  notebookId: string
  cells: string[]
  mode: 'iframe' | 'runtime'
  height?: number
  fallbackImage?: string
  title: string
  showDataTable?: boolean
}

export function ObservableEmbed({ 
  notebookId, 
  cells, 
  mode, 
  height = 400, 
  fallbackImage,
  title,
  showDataTable = false
}: ObservableEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    if (mode === 'runtime' && containerRef.current) {
      loadObservableRuntime()
    }
  }, [notebookId, cells, mode])

  const loadObservableRuntime = async () => {
    try {
      setIsLoading(true)
      setHasError(false)

      // For now, just use iframe mode as runtime mode is complex
      // This function is kept for future implementation
      setHasError(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load Observable notebook:', error)
      setHasError(true)
      setIsLoading(false)
    }
  }

  const renderIframe = () => {
    const cellsParam = cells.join(',')
    const src = `https://observablehq.com/embed/d/${notebookId}?cells=${cellsParam}`
    
    return (
      <iframe
        src={src}
        width="100%"
        height={height}
        frameBorder="0"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        title={title}
        className="rounded border"
      />
    )
  }

  const renderFallback = () => {
    if (fallbackImage) {
      return (
        <div className="text-center">
          <img 
            src={fallbackImage} 
            alt={title}
            className="max-w-full h-auto rounded border mx-auto"
            style={{ maxHeight: height }}
          />
          <p className="text-sm text-gray-600 mt-2">
            Static fallback image (Observable chart unavailable)
          </p>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded border">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chart unavailable</p>
          <p className="text-xs text-gray-500">Observable notebook could not be loaded</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
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
              asChild
            >
              <a 
                href={`https://observablehq.com/d/${notebookId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Source
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {!isLoading && !hasError && (
          <div>
            {mode === 'iframe' ? renderIframe() : (
              <div 
                ref={containerRef} 
                style={{ minHeight: height }}
                className="observable-container"
              />
            )}
          </div>
        )}
        
        {hasError && renderFallback()}
        
        {showTable && showDataTable && (
          <div className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="font-medium mb-2">Data Table</h4>
            <p className="text-sm text-gray-600">
              Data table view would be implemented here based on the chart's underlying data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
