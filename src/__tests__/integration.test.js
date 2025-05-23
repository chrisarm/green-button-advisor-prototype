import { describe, it, expect, beforeEach } from 'vitest'
import { useMultiPlanCalculator } from '../composables/useMultiPlanCalculator.js'
import { calculateRate, getSeason, getTimePeriod } from '../utils/sdgeTariffs.js'

describe('Integration Tests', () => {
  let calculator

  const sampleUsageData = [
    {
      "Date": "6/15/2024",
      "Start Time": "12:00 AM",
      "Consumption": "1.5"
    },
    {
      "Date": "6/15/2024", 
      "Start Time": "6:00 PM",
      "Consumption": "3.2"
    },
    {
      "Date": "12/15/2024",
      "Start Time": "3:00 AM",
      "Consumption": "2.1"
    },
    {
      "Date": "12/15/2024",
      "Start Time": "7:00 PM",
      "Consumption": "4.5"
    }
  ]

  beforeEach(() => {
    calculator = useMultiPlanCalculator()
  })

  describe('End-to-end plan comparison workflow', () => {
    it('should complete full comparison between TOU-DR1 and EV-TOU-5', () => {
      // 1. Verify default plan selection
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR1', 'EV-TOU-5'])
      
      // 2. Process sample data
      calculator.processData(sampleUsageData)
      
      // 3. Verify results are generated
      expect(calculator.overallComparison.value).not.toBeNull()
      expect(calculator.periodComparisons.value.length).toBeGreaterThan(0)
      expect(calculator.monthlyComparisons.value.length).toBeGreaterThan(0)
      
      // 4. Verify overall comparison structure
      const comparison = calculator.overallComparison.value
      expect(comparison.plan1.type).toBe('TOU-DR1')
      expect(comparison.plan2.type).toBe('EV-TOU-5')
      expect(comparison.totalKWh).toBeDefined()
      expect(comparison.totalSavings).toBeDefined()
      expect(comparison.monthsAnalyzed).toBe(2) // June and December
      
      // 5. Verify chart data is prepared
      expect(calculator.chartData.value.dailyUsage.labels.length).toBeGreaterThan(0)
      expect(calculator.chartData.value.dailyUsage.datasets.length).toBeGreaterThan(0)
    })

    it('should handle plan switching correctly', () => {
      // 1. Switch to DR vs TOU-DR2 comparison
      calculator.setSelectedPlans(['DR', 'TOU-DR2'])
      expect(calculator.selectedPlans.value).toEqual(['DR', 'TOU-DR2'])
      
      // 2. Process data with new plan selection
      calculator.processData(sampleUsageData)
      
      // 3. Verify comparison reflects new plans
      const comparison = calculator.overallComparison.value
      expect(comparison.plan1.type).toBe('DR')
      expect(comparison.plan2.type).toBe('TOU-DR2')
      
      // 4. Verify different plan types are handled (tiered vs TOU)
      expect(comparison.plan1.name).toContain('Standard Residential')
      expect(comparison.plan2.name).toContain('Time of Use')
    })

    it('should calculate accurate rate differences between plans', () => {
      // Test specific scenarios to verify rate calculations
      
      // Summer on-peak hour - should show significant difference between plans
      const summerOnPeakTouDr1 = calculateRate('TOU-DR1', 18, false, 'summer', 1.0)
      const summerOnPeakEvTou5 = calculateRate('EV-TOU-5', 18, false, 'summer', 1.0)
      
      expect(summerOnPeakTouDr1.rate).toBe(0.71412)
      expect(summerOnPeakEvTou5.rate).toBe(0.71106)
      expect(summerOnPeakTouDr1.rate).toBeGreaterThan(summerOnPeakEvTou5.rate)
      
      // Winter super off-peak - EV-TOU-5 should be much cheaper
      const winterSuperOffPeakTouDr1 = calculateRate('TOU-DR1', 3, false, 'winter', 1.0)
      const winterSuperOffPeakEvTou5 = calculateRate('EV-TOU-5', 3, false, 'winter', 1.0)
      
      expect(winterSuperOffPeakTouDr1.rate).toBe(0.47999)
      expect(winterSuperOffPeakEvTou5.rate).toBe(0.11381)
      expect(winterSuperOffPeakEvTou5.rate).toBeLessThan(winterSuperOffPeakTouDr1.rate)
    })

    it('should handle seasonal and time period logic correctly', () => {
      // Verify season detection
      expect(getSeason(5)).toBe('summer') // June
      expect(getSeason(11)).toBe('winter') // December
      
      // Verify time period detection for TOU plans
      expect(getTimePeriod(3, false, 'summer', 'TOU-DR1')).toBe('superOffPeak')
      expect(getTimePeriod(18, false, 'summer', 'TOU-DR1')).toBe('onPeak')
      expect(getTimePeriod(10, false, 'summer', 'TOU-DR1')).toBe('offPeak')
      
      // Verify weekend logic
      expect(getTimePeriod(12, true, 'summer', 'TOU-DR1')).toBe('superOffPeak')
    })

    it('should generate meaningful monthly and period summaries', () => {
      calculator.processData(sampleUsageData)
      
      const periodComparisons = calculator.periodComparisons.value
      const monthlyComparisons = calculator.monthlyComparisons.value
      
      // Verify period comparisons include both seasons
      const seasons = [...new Set(periodComparisons.map(p => p.season))]
      expect(seasons).toContain('summer')
      expect(seasons).toContain('winter')
      
      // Verify monthly comparisons
      expect(monthlyComparisons.length).toBe(2) // June and December
      expect(monthlyComparisons[0].month).toBe('2024-06')
      expect(monthlyComparisons[1].month).toBe('2024-12')
      
      // Verify cost calculations include monthly charges
      monthlyComparisons.forEach(month => {
        expect(parseFloat(month.plan1MonthlyCharge)).toBeGreaterThan(0)
        expect(parseFloat(month.plan2MonthlyCharge)).toBeGreaterThan(0)
        expect(parseFloat(month.plan1TotalCost)).toBeGreaterThan(0)
        expect(parseFloat(month.plan2TotalCost)).toBeGreaterThan(0)
      })
    })
  })

  describe('Plan selector integration', () => {
    it('should provide correct selectable plans with metadata', () => {
      const selectablePlans = calculator.getSelectablePlans()
      
      expect(selectablePlans.length).toBe(5)
      
      // Verify each plan has required properties
      selectablePlans.forEach(plan => {
        expect(plan.type).toBeDefined()
        expect(plan.name).toBeDefined()
        expect(plan.description).toBeDefined()
        expect(plan.monthlyCharge).toBeDefined()
        expect(typeof plan.selected).toBe('boolean')
        expect(plan.requirements).toBeDefined()
      })
      
      // Verify EV plan has requirements
      const evPlan = selectablePlans.find(p => p.type === 'EV-TOU-5')
      expect(evPlan.requirements.length).toBeGreaterThan(0)
      expect(evPlan.requirements[0]).toContain('electric vehicle')
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle empty data gracefully', () => {
      // Ensure we have 2 plans selected first
      calculator.setSelectedPlans(['TOU-DR1', 'EV-TOU-5'])
      calculator.processData([])
      
      expect(calculator.error.value).toBeNull()
      // Empty data should still generate a comparison object with zero values
      expect(calculator.overallComparison.value).not.toBeNull()
      expect(calculator.overallComparison.value.totalKWh).toBe('0.00')
      expect(calculator.processing.value).toBe(false)
    })

    it('should handle invalid data entries', () => {
      const invalidData = [
        { "Date": "", "Start Time": "", "Consumption": "" },
        { "Date": "invalid", "Start Time": "invalid", "Consumption": "invalid" },
        { "Date": "6/15/2024", "Start Time": "1:00 AM", "Consumption": "2.0" } // Valid entry
      ]
      
      calculator.processData(invalidData)
      
      expect(calculator.error.value).toBeNull()
      expect(calculator.usageData.value.length).toBe(1) // Only valid entry processed
    })

    it('should require exactly 2 plans for processing', () => {
      // Test with 0 plans
      calculator.setSelectedPlans([])
      calculator.processData(sampleUsageData)
      expect(calculator.error.value).toBe('Please select exactly 2 plans for comparison')
      
      // Test with 1 plan
      calculator.setSelectedPlans(['TOU-DR1'])
      calculator.processData(sampleUsageData)
      expect(calculator.error.value).toBe('Please select exactly 2 plans for comparison')
      
      // Test with 2 plans (should work)
      calculator.setSelectedPlans(['TOU-DR1', 'EV-TOU-5'])
      calculator.processData(sampleUsageData)
      expect(calculator.error.value).toBeNull()
    })

    it('should reset state properly', () => {
      // Process some data first
      calculator.processData(sampleUsageData)
      expect(calculator.overallComparison.value).not.toBeNull()
      
      // Reset and verify
      calculator.resetState()
      expect(calculator.overallComparison.value).toBeNull()
      expect(calculator.usageData.value).toEqual([])
      expect(calculator.periodComparisons.value).toEqual([])
      expect(calculator.monthlyComparisons.value).toEqual([])
    })
  })
})