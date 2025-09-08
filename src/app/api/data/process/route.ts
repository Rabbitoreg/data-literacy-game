import { NextRequest, NextResponse } from 'next/server'
import { DataProcessor } from '@/lib/data-processor'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvPath, dataType } = body

    // Read the CSV file from the project directory
    const filePath = path.join(process.cwd(), csvPath)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'CSV file not found' },
        { status: 404 }
      )
    }

    const csvContent = fs.readFileSync(filePath, 'utf-8')
    
    let processedData
    
    if (dataType === 'sales') {
      // Process the sales dataset for analytics
      processedData = DataProcessor.processCSVData(csvContent)
      
      // Generate aggregated views for charts
      const regionData = processedData.reduce((acc, row) => {
        const region = row.region || 'Unknown'
        if (!acc[region]) {
          acc[region] = {
            region,
            totalPerformance: 0,
            count: 0,
            avgDealSize: 0,
            completionRate: 0
          }
        }
        
        acc[region].totalPerformance += row.performance || 0
        acc[region].count += 1
        acc[region].avgDealSize += row.deals_closed || 0
        
        if (row.complete_training === 1) {
          acc[region].completionRate += 1
        }
        
        return acc
      }, {} as Record<string, any>)

      // Calculate averages
      const regionAnalytics = Object.values(regionData).map((region: any) => ({
        region: region.region,
        avgPerformance: region.totalPerformance / region.count,
        avgDealSize: region.avgDealSize / region.count,
        completionRate: (region.completionRate / region.count) * 100,
        sampleSize: region.count
      }))

      return NextResponse.json({
        success: true,
        rawData: processedData.slice(0, 10), // First 10 rows for preview
        analytics: {
          byRegion: regionAnalytics,
          summary: {
            totalRecords: processedData.length,
            avgPerformance: processedData.reduce((sum, row) => sum + (row.performance || 0), 0) / processedData.length,
            completionRate: (processedData.filter(row => row.complete_training === 1).length / processedData.length) * 100
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: processedData
    })

  } catch (error) {
    console.error('Data processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return sample data for demo purposes
    const sampleRegionData = [
      { region: 'North', avgPerformance: 85.2, avgDealSize: 4.2, completionRate: 78 },
      { region: 'South', avgPerformance: 92.1, avgDealSize: 5.1, completionRate: 85 },
      { region: 'East', avgPerformance: 78.9, avgDealSize: 3.8, completionRate: 72 },
      { region: 'West', avgPerformance: 88.4, avgDealSize: 4.7, completionRate: 81 }
    ]

    const sampleTimeSeriesData = [
      { month: 'Jan', performance: 82, deals: 45 },
      { month: 'Feb', performance: 85, deals: 52 },
      { month: 'Mar', performance: 88, deals: 48 },
      { month: 'Apr', performance: 91, deals: 55 },
      { month: 'May', performance: 87, deals: 49 },
      { month: 'Jun', performance: 93, deals: 58 }
    ]

    return NextResponse.json({
      success: true,
      analytics: {
        byRegion: sampleRegionData,
        timeSeries: sampleTimeSeriesData,
        summary: {
          totalRecords: 263,
          avgPerformance: 86.2,
          completionRate: 79
        }
      }
    })

  } catch (error) {
    console.error('Get sample data error:', error)
    return NextResponse.json(
      { error: 'Failed to get sample data' },
      { status: 500 }
    )
  }
}
