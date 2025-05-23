import { describe, it, expect, beforeEach } from 'vitest'
import { useMultiPlanCalculator } from '../useMultiPlanCalculator.js'

describe('useMultiPlanCalculator', () => {
  let calculator

  beforeEach(() => {
    calculator = useMultiPlanCalculator()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR1', 'EV-TOU-5'])
      expect(calculator.processing.value).toBe(false)
      expect(calculator.error.value).toBe(null)
      expect(calculator.overallComparison.value).toBe(null)
      expect(calculator.usageData.value).toEqual([])
    })
  })

  describe('setSelectedPlans', () => {
    it('should set selected plans correctly', () => {
      calculator.setSelectedPlans(['DR', 'TOU-DR2'])
      expect(calculator.selectedPlans.value).toEqual(['DR', 'TOU-DR2'])
    })

    it('should allow 0, 1, or 2 plans but not more than 2', () => {
      // Should allow 0 plans
      calculator.setSelectedPlans([])
      expect(calculator.selectedPlans.value).toEqual([])

      // Should allow 1 plan
      calculator.setSelectedPlans(['DR'])
      expect(calculator.selectedPlans.value).toEqual(['DR'])

      // Should allow 2 plans
      calculator.setSelectedPlans(['DR', 'TOU-DR1'])
      expect(calculator.selectedPlans.value).toEqual(['DR', 'TOU-DR1'])

      // Should throw error for more than 2 plans
      expect(() => {
        calculator.setSelectedPlans(['DR', 'TOU-DR1', 'EV-TOU-5'])
      }).toThrow('Maximum of two plans can be selected for comparison')
    })
  })

  describe('getSelectablePlans', () => {
    it('should return all available plans with selection state', () => {
      const plans = calculator.getSelectablePlans()
      
      expect(plans.length).toBe(5)
      
      const planTypes = plans.map(p => p.type)
      expect(planTypes).toContain('DR')
      expect(planTypes).toContain('TOU-DR1')
      expect(planTypes).toContain('EV-TOU-5')
      
      // Check that default selected plans are marked as selected
      const touDr1 = plans.find(p => p.type === 'TOU-DR1')
      const evTou5 = plans.find(p => p.type === 'EV-TOU-5')
      const dr = plans.find(p => p.type === 'DR')
      
      expect(touDr1).toBeDefined()
      expect(evTou5).toBeDefined()
      expect(dr).toBeDefined()
      
      expect(touDr1.selected).toBe(true)
      expect(evTou5.selected).toBe(true)
      expect(dr.selected).toBe(false)
    })

    it('should update selection state when plans change', () => {
      calculator.setSelectedPlans(['DR', 'TOU-DR2'])
      const plans = calculator.getSelectablePlans()
      
      const dr = plans.find(p => p.type === 'DR')
      const touDr2 = plans.find(p => p.type === 'TOU-DR2')
      const touDr1 = plans.find(p => p.type === 'TOU-DR1')
      
      expect(dr.selected).toBe(true)
      expect(touDr2.selected).toBe(true)
      expect(touDr1.selected).toBe(false)
    })
  })

  describe('processData', () => {
    const mockUsageData = [
      {
        "Date": "6/1/2024",
        "Start Time": "12:00 AM",
        "Consumption": "1.5"
      },
      {
        "Date": "6/1/2024", 
        "Start Time": "1:00 AM",
        "Consumption": "1.2"
      },
      {
        "Date": "6/1/2024",
        "Start Time": "6:00 PM",
        "Consumption": "3.0"
      }
    ]

    it('should process data without errors', () => {
      calculator.processData(mockUsageData)
      
      expect(calculator.error.value).toBe(null)
      expect(calculator.usageData.value.length).toBe(3)
      expect(calculator.processing.value).toBe(false)
    })

    it('should calculate costs for both plans', () => {
      calculator.processData(mockUsageData)
      
      const processedData = calculator.usageData.value
      expect(processedData[0].plan1).toBeDefined()
      expect(processedData[0].plan2).toBeDefined()
      expect(processedData[0].plan1.type).toBe('TOU-DR1')
      expect(processedData[0].plan2.type).toBe('EV-TOU-5')
      expect(typeof processedData[0].plan1.cost).toBe('number')
      expect(typeof processedData[0].plan2.cost).toBe('number')
    })

    it('should generate overall comparison', () => {
      calculator.processData(mockUsageData)
      
      const comparison = calculator.overallComparison.value
      expect(comparison).toBeDefined()
      expect(comparison.plan1.type).toBe('TOU-DR1')
      expect(comparison.plan2.type).toBe('EV-TOU-5')
      expect(typeof comparison.totalKWh).toBe('string')
      expect(typeof comparison.totalSavings).toBe('string')
      expect(comparison.monthsAnalyzed).toBe(1)
    })

    it('should generate period comparisons', () => {
      calculator.processData(mockUsageData)
      
      const periodComparisons = calculator.periodComparisons.value
      expect(Array.isArray(periodComparisons)).toBe(true)
      expect(periodComparisons.length).toBeGreaterThan(0)
      
      const firstPeriod = periodComparisons[0]
      expect(firstPeriod.season).toBeDefined()
      expect(firstPeriod.period).toBeDefined()
      expect(typeof firstPeriod.consumption).toBe('string')
      expect(typeof firstPeriod.plan1Cost).toBe('string')
      expect(typeof firstPeriod.plan2Cost).toBe('string')
    })

    it('should generate monthly comparisons', () => {
      calculator.processData(mockUsageData)
      
      const monthlyComparisons = calculator.monthlyComparisons.value
      expect(Array.isArray(monthlyComparisons)).toBe(true)
      expect(monthlyComparisons.length).toBe(1) // One month of data
      
      const monthlyData = monthlyComparisons[0]
      expect(monthlyData.month).toBe('2024-06')
      expect(typeof monthlyData.consumption).toBe('string')
      expect(typeof monthlyData.plan1TotalCost).toBe('string')
      expect(typeof monthlyData.plan2TotalCost).toBe('string')
      expect(typeof monthlyData.monthlySavings).toBe('string')
    })

    it('should prepare chart data', () => {
      calculator.processData(mockUsageData)
      
      const chartData = calculator.chartData.value
      expect(chartData.dailyUsage).toBeDefined()
      expect(chartData.monthlyComparison).toBeDefined()
      expect(chartData.monthlySavings).toBeDefined()
      
      expect(Array.isArray(chartData.dailyUsage.labels)).toBe(true)
      expect(Array.isArray(chartData.dailyUsage.datasets)).toBe(true)
    })

    it('should handle invalid data gracefully', () => {
      const invalidData = [
        { "Date": "", "Start Time": "", "Consumption": "invalid" },
        { "Date": "6/1/2024", "Start Time": "1:00 AM", "Consumption": "2.0" }
      ]
      
      calculator.processData(invalidData)
      
      expect(calculator.error.value).toBe(null)
      expect(calculator.usageData.value.length).toBe(1) // Only valid row processed
    })

    it('should handle different plan selections', () => {
      calculator.setSelectedPlans(['DR', 'TOU-DR-P'])
      calculator.processData(mockUsageData)
      
      const comparison = calculator.overallComparison.value
      expect(comparison.plan1.type).toBe('DR')
      expect(comparison.plan2.type).toBe('TOU-DR-P')
    })
  })

  describe('resetState', () => {
    it('should reset all state to initial values', () => {
      // First process some data
      calculator.processData([{
        "Date": "6/1/2024",
        "Start Time": "12:00 AM", 
        "Consumption": "1.5"
      }])
      
      // Verify data exists
      expect(calculator.usageData.value.length).toBeGreaterThan(0)
      expect(calculator.overallComparison.value).not.toBe(null)
      
      // Reset
      calculator.resetState()
      
      // Verify reset
      expect(calculator.usageData.value).toEqual([])
      expect(calculator.overallComparison.value).toBe(null)
      expect(calculator.periodComparisons.value).toEqual([])
      expect(calculator.monthlyComparisons.value).toEqual([])
      expect(calculator.chartData.value.dailyUsage.labels).toEqual([])
      expect(calculator.chartData.value.dailyUsage.datasets).toEqual([])
    })
  })
})