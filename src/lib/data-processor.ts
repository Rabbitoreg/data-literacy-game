import { Statement, StoreItem } from '@/types/game'

export interface CSVStatement {
  id: string
  text: string
  topic: string
  difficulty: string
  ambiguity: string
  truth_label: string
  reason_key: string
  recommended_items: string
  required_evidence_types?: string
  visual_refs?: string
}

export interface CSVStoreItem {
  id: string
  name: string
  category: string
  cost_money: string
  cost_time_min: string
  delivery_type: string
  artifact_id?: string
  widget_config?: string
  observable_config?: string
  description: string
  is_persistent?: string
}

export class DataProcessor {
  static parseCSVStatements(csvData: string, sessionId: string): Statement[] {
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line)
      const row: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      return {
        id: row.id,
        sessionId,
        text: row.text,
        topic: row.topic,
        difficulty: parseInt(row.difficulty) as 1 | 2 | 3 | 4 | 5,
        ambiguity: parseInt(row.ambiguity) as 1 | 2 | 3 | 4 | 5,
        truthLabel: row.truth_label as 'true' | 'false' | 'unknowable',
        reasonKey: row.reason_key,
        requiredEvidenceTypes: row.required_evidence_types ? 
          row.required_evidence_types.split('|').map(s => s.trim()) : [],
        recommendedItems: row.recommended_items ? 
          row.recommended_items.split('|').map(s => s.trim()) : [],
        visualRefs: row.visual_refs ? 
          row.visual_refs.split('|').map(s => s.trim()) : [],
        metadata: {}
      }
    })
  }

  static parseCSVStoreItems(csvData: string, sessionId: string): StoreItem[] {
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line)
      const row: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      let widgetConfig = undefined
      let observableConfig = undefined

      if (row.widget_config) {
        try {
          widgetConfig = JSON.parse(row.widget_config)
        } catch (e) {
          console.warn('Invalid widget_config JSON:', row.widget_config)
        }
      }

      if (row.observable_config) {
        try {
          observableConfig = JSON.parse(row.observable_config)
        } catch (e) {
          console.warn('Invalid observable_config JSON:', row.observable_config)
        }
      }

      return {
        id: row.id,
        sessionId,
        name: row.name,
        category: row.category as any,
        costMoney: parseInt(row.cost_money),
        costTimeMin: parseInt(row.cost_time_min),
        deliveryType: row.delivery_type as any,
        artifactId: row.artifact_id || undefined,
        widgetConfig,
        observableConfig,
        description: row.description || '',
        isPersistent: row.is_persistent === 'true' || row.is_persistent === '1'
      }
    })
  }

  static generateSampleStatements(sessionId: string): Statement[] {
    return [
      {
        id: 'stmt_1',
        sessionId,
        text: 'Sales enablement training increased average deal size by 8% in Q3.',
        topic: 'Impact',
        difficulty: 2,
        ambiguity: 3,
        truthLabel: 'false',
        reasonKey: 'Seasonality confound; promo overlap',
        requiredEvidenceTypes: ['segment_drilldown', 'promo_calendar'],
        recommendedItems: ['I303', 'I509'],
        visualRefs: ['artifact:seg_drill_q3.png'],
        metadata: {}
      },
      {
        id: 'stmt_2',
        sessionId,
        text: 'Pilot regions had significantly higher close rates than control.',
        topic: 'Impact',
        difficulty: 3,
        ambiguity: 2,
        truthLabel: 'true',
        reasonKey: 'p<0.05 when controlling for pipeline stage',
        requiredEvidenceTypes: ['randomization_check', 'segment_drilldown'],
        recommendedItems: ['I407', 'I303'],
        visualRefs: ['artifact:close_rates_comparison.png'],
        metadata: {}
      },
      {
        id: 'stmt_3',
        sessionId,
        text: 'Time-to-first-contact improved due to the training.',
        topic: 'Process',
        difficulty: 2,
        ambiguity: 4,
        truthLabel: 'unknowable',
        reasonKey: 'CRM timestamp mismatch across cohorts',
        requiredEvidenceTypes: ['data_dictionary', 'randomization_check'],
        recommendedItems: ['I212', 'I407'],
        visualRefs: [],
        metadata: {}
      },
      {
        id: 'stmt_4',
        sessionId,
        text: 'Training completion rates were higher in the West region.',
        topic: 'Process',
        difficulty: 1,
        ambiguity: 2,
        truthLabel: 'true',
        reasonKey: 'Clear regional difference in completion data',
        requiredEvidenceTypes: ['segment_drilldown'],
        recommendedItems: ['I303'],
        visualRefs: ['artifact:completion_by_region.png'],
        metadata: {}
      },
      {
        id: 'stmt_5',
        sessionId,
        text: 'The learning dashboard shows consistent engagement patterns.',
        topic: 'Quality',
        difficulty: 3,
        ambiguity: 3,
        truthLabel: 'false',
        reasonKey: 'High variance in engagement metrics across cohorts',
        requiredEvidenceTypes: ['analytics_view'],
        recommendedItems: ['I601'],
        visualRefs: [],
        metadata: {}
      }
    ]
  }

  static generateSampleStoreItems(sessionId: string): StoreItem[] {
    return [
      {
        id: 'I101',
        sessionId,
        name: 'Interview: Learning Team',
        category: 'people_process',
        costMoney: 250,
        costTimeMin: 3,
        deliveryType: 'artifact',
        artifactId: 'int_learning_team.pdf',
        description: 'Collection caveats, instrumentation details',
        isPersistent: false
      },
      {
        id: 'I212',
        sessionId,
        name: 'Data Dictionary',
        category: 'data_artifact',
        costMoney: 120,
        costTimeMin: 1,
        deliveryType: 'artifact',
        artifactId: 'data_dictionary.pdf',
        description: 'Field definitions & transforms',
        isPersistent: true
      },
      {
        id: 'I303',
        sessionId,
        name: 'Dashboard: Segment Drilldown',
        category: 'analytics_view',
        costMoney: 180,
        costTimeMin: 2,
        deliveryType: 'live_widget',
        artifactId: 'seg_drill_q3.png',
        widgetConfig: {
          type: 'bar',
          dim: 'region',
          metric: 'avg_deal_size'
        },
        description: 'Choose 1 segment (region/role)',
        isPersistent: false
      },
      {
        id: 'I407',
        sessionId,
        name: 'Randomization Check',
        category: 'quality_check',
        costMoney: 200,
        costTimeMin: 4,
        deliveryType: 'artifact',
        artifactId: 'rand_check_table.pdf',
        description: 'Baseline equivalence analysis',
        isPersistent: false
      },
      {
        id: 'I509',
        sessionId,
        name: 'Promo Calendar',
        category: 'context_intel',
        costMoney: 160,
        costTimeMin: 2,
        deliveryType: 'artifact',
        artifactId: 'promo_calendar.png',
        description: 'Overlapping promos timeline',
        isPersistent: false
      },
      {
        id: 'I601',
        sessionId,
        name: 'Learning Dashboard: Win Rate (Observable)',
        category: 'analytics_view',
        costMoney: 160,
        costTimeMin: 2,
        deliveryType: 'observable_cell',
        artifactId: 'learning_winrate.png',
        observableConfig: {
          notebookId: 'd/fb670ca5f330a7e9',
          cells: ['chart_winrate'],
          mode: 'iframe',
          height: 540
        },
        description: 'Focused cell from Learning Dashboard',
        isPersistent: false
      }
    ]
  }

  static processCSVData(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line)
      const row: Record<string, any> = {}
      
      headers.forEach((header, index) => {
        const value = values[index] || ''
        // Try to parse numbers
        if (!isNaN(Number(value)) && value !== '') {
          row[header] = Number(value)
        } else {
          row[header] = value
        }
      })
      
      return row
    })
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }
}
