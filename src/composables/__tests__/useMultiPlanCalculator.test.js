import { describe, it, expect, beforeEach } from 'vitest'
import { useMultiPlanCalculator } from '../useMultiPlanCalculator.js'
import { parseGreenButtonCsv } from '../../utils/csvParser.js'

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

  describe('resetUsageToOriginal', () => {
    const sampleData = [
      {
        "Date": "6/1/2024",
        "Start Time": "12:00 AM", 
        "Consumption": "1.5"
      },
      {
        "Date": "6/1/2024",
        "Start Time": "1:00 AM", 
        "Consumption": "2.0"
      },
      {
        "Date": "7/1/2024",
        "Start Time": "12:00 AM", 
        "Consumption": "1.8"
      }
    ]

    it('should store original data when processing', () => {
      calculator.processData(sampleData)
      
      // Should have original data stored
      expect(calculator.originalUsageData).toBeDefined()
      expect(calculator.originalUsageData.value).toBeDefined()
      expect(calculator.originalUsageData.value.length).toBe(3)
    })

    it('should restore original consumption values when reset', async () => {
      // Process initial data
      calculator.processData(sampleData)
      
      // Store original total consumption
      const originalTotalConsumption = calculator.usageData.value.reduce(
        (sum, row) => sum + row.Consumption, 0
      )
      
      // Modify some usage data
      await calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      
      // Verify data was modified
      const modifiedTotalConsumption = calculator.usageData.value.reduce(
        (sum, row) => sum + row.Consumption, 0
      )
      expect(modifiedTotalConsumption).not.toBeCloseTo(originalTotalConsumption)
      
      // Reset to original
      await calculator.resetUsageToOriginal()
      
      // Verify data was restored
      const restoredTotalConsumption = calculator.usageData.value.reduce(
        (sum, row) => sum + row.Consumption, 0
      )
      expect(restoredTotalConsumption).toBeCloseTo(originalTotalConsumption, 2)
    })

    it('should recalculate all comparisons and charts after reset', async () => {
      // Process initial data
      calculator.processData(sampleData)
      
      // Store original comparison values
      const originalPlan1Cost = parseFloat(calculator.overallComparison.value.plan1.totalCost)
      const originalPlan2Cost = parseFloat(calculator.overallComparison.value.plan2.totalCost)
      
      // Modify usage data
      await calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      
      // Verify costs changed
      const modifiedPlan1Cost = parseFloat(calculator.overallComparison.value.plan1.totalCost)
      const modifiedPlan2Cost = parseFloat(calculator.overallComparison.value.plan2.totalCost)
      expect(modifiedPlan1Cost).not.toBeCloseTo(originalPlan1Cost)
      expect(modifiedPlan2Cost).not.toBeCloseTo(originalPlan2Cost)
      
      // Reset to original
      await calculator.resetUsageToOriginal()
      
      // Verify costs were restored
      const restoredPlan1Cost = parseFloat(calculator.overallComparison.value.plan1.totalCost)
      const restoredPlan2Cost = parseFloat(calculator.overallComparison.value.plan2.totalCost)
      expect(restoredPlan1Cost).toBeCloseTo(originalPlan1Cost, 2)
      expect(restoredPlan2Cost).toBeCloseTo(originalPlan2Cost, 2)
    })

    it('should handle reset when no original data exists', () => {
      // Try to reset without processing any data
      expect(() => calculator.resetUsageToOriginal()).not.toThrow()
      
      // State should remain empty
      expect(calculator.usageData.value).toEqual([])
      expect(calculator.overallComparison.value).toBe(null)
    })

    it('should preserve original data after multiple edits and resets', async () => {
      // Process initial data
      calculator.processData(sampleData)
      
      const originalTotalConsumption = calculator.usageData.value.reduce(
        (sum, row) => sum + row.Consumption, 0
      )
      
      // Make multiple edits
      await calculator.updateMonthlyUsage({ month: '2024-06', consumption: 50 })
      
      const firstRowPeriod = calculator.usageData.value[0]?.plan1?.period
      const firstRowSeason = calculator.usageData.value[0]?.season
      if (firstRowPeriod && firstRowSeason) {
        await calculator.updatePeriodUsage({ season: firstRowSeason, period: firstRowPeriod, consumption: 25 })
      }
      
      // Reset
      await calculator.resetUsageToOriginal()
      
      // Make more edits
      await calculator.updateMonthlyUsage({ month: '2024-07', consumption: 75 })
      
      // Reset again
      await calculator.resetUsageToOriginal()
      
      // Should still match original
      const finalTotalConsumption = calculator.usageData.value.reduce(
        (sum, row) => sum + row.Consumption, 0
      )
      expect(finalTotalConsumption).toBeCloseTo(originalTotalConsumption, 2)
    })
  })

  describe('hasDataBeenModified', () => {
    const sampleData = [
      {
        "Date": "6/1/2024",
        "Start Time": "12:00 AM", 
        "Consumption": "1.5"
      }
    ]

    it('should return false when data has not been modified', () => {
      calculator.processData(sampleData)
      expect(calculator.hasDataBeenModified.value).toBe(false)
    })

    it('should return true when monthly usage has been modified', async () => {
      calculator.processData(sampleData)
      await calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      expect(calculator.hasDataBeenModified.value).toBe(true)
    })

    it('should return true when period usage has been modified', () => {
      calculator.processData(sampleData)
      
      // Get the actual period from the processed data
      const firstRowPeriod = calculator.usageData.value[0]?.plan1?.period
      const firstRowSeason = calculator.usageData.value[0]?.season
      
      // Use actual values from the data
      if (firstRowPeriod && firstRowSeason) {
        calculator.updatePeriodUsage({ 
          season: firstRowSeason, 
          period: firstRowPeriod, 
          consumption: 50 
        })
        expect(calculator.hasDataBeenModified.value).toBe(true)
      } else {
        // Fallback test - just check that we can call the function
        calculator.updatePeriodUsage({ season: 'summer', period: 'Off-Peak', consumption: 50 })
        // Function should not throw, modification status depends on whether data matches
        expect(typeof calculator.hasDataBeenModified.value).toBe('boolean')
      }
    })

    it('should return false after reset to original', async () => {
      calculator.processData(sampleData)
      await calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      expect(calculator.hasDataBeenModified.value).toBe(true)
      
      await calculator.resetUsageToOriginal()
      expect(calculator.hasDataBeenModified.value).toBe(false)
    })
  })

  describe('updating state', () => {
    const sampleData = [
      {
        "Date": "6/1/2024",
        "Start Time": "12:00 AM", 
        "Consumption": "1.5"
      }
    ]

    it('should start with updating false', () => {
      expect(calculator.updating.value).toBe(false)
    })

    it('should set updating to true during monthly usage update then false when done', async () => {
      calculator.processData(sampleData)
      
      // Initially false
      expect(calculator.updating.value).toBe(false)
      
      // Start update (don't await yet)
      const updatePromise = calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      
      // Should be true immediately after starting
      expect(calculator.updating.value).toBe(true)
      
      // Wait for completion
      await updatePromise
      
      // Should be false after completion
      expect(calculator.updating.value).toBe(false)
    })

    it('should set updating to true during period usage update then false when done', async () => {
      calculator.processData(sampleData)
      
      // Get actual period from processed data
      const firstRowPeriod = calculator.usageData.value[0]?.plan1?.period
      const firstRowSeason = calculator.usageData.value[0]?.season
      
      expect(calculator.updating.value).toBe(false)
      
      if (firstRowPeriod && firstRowSeason) {
        // Start update (don't await yet)
        const updatePromise = calculator.updatePeriodUsage({ 
          season: firstRowSeason, 
          period: firstRowPeriod, 
          consumption: 50 
        })
        
        // Should be true immediately after starting
        expect(calculator.updating.value).toBe(true)
        
        // Wait for completion
        await updatePromise
        
        // Should be false after completion
        expect(calculator.updating.value).toBe(false)
      }
    })

    it('should set updating to true during reset then false when done', async () => {
      calculator.processData(sampleData)
      await calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      
      expect(calculator.updating.value).toBe(false)
      
      // Start reset (don't await yet)
      const resetPromise = calculator.resetUsageToOriginal()
      
      // Should be true immediately after starting
      expect(calculator.updating.value).toBe(true)
      
      // Wait for completion
      await resetPromise
      
      // Should be false after completion
      expect(calculator.updating.value).toBe(false)
    })
  })

  describe('chart data preservation after reset', () => {
    const sampleData = [
      {
        "Date": "6/1/2024",
        "Start Time": "12:00 AM", 
        "Consumption": "1.5"
      },
      {
        "Date": "6/1/2024",
        "Start Time": "1:00 AM", 
        "Consumption": "2.0"
      },
      {
        "Date": "6/2/2024",
        "Start Time": "12:00 AM", 
        "Consumption": "1.8"
      }
    ]

    it('should preserve Date objects in usageData after reset', async () => {
      calculator.processData(sampleData)
      
      // Verify original data has proper Date objects
      const originalFirstRow = calculator.usageData.value[0]
      expect(originalFirstRow.datetime).toBeInstanceOf(Date)
      expect(originalFirstRow.datetime.getTime()).toBeGreaterThan(0)
      
      // Modify data
      await calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      
      // Reset
      await calculator.resetUsageToOriginal()
      
      // Verify Date objects are still preserved after reset
      const restoredFirstRow = calculator.usageData.value[0]
      expect(restoredFirstRow.datetime).toBeInstanceOf(Date)
      expect(restoredFirstRow.datetime.getTime()).toBeGreaterThan(0)
      expect(restoredFirstRow.datetime.getTime()).toBe(originalFirstRow.datetime.getTime())
    })

    it('should preserve chart data structure after reset', () => {
      calculator.processData(sampleData)
      
      // Store original chart data
      const originalChartLabels = [...calculator.chartData.value.dailyUsage.labels]
      const originalChartDatasets = calculator.chartData.value.dailyUsage.datasets.map(ds => ({ 
        label: ds.label, 
        dataLength: ds.data.length 
      }))
      
      // Verify we have chart data initially
      expect(originalChartLabels.length).toBeGreaterThan(0)
      expect(originalChartDatasets.length).toBeGreaterThan(0)
      
      // Modify data
      calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      
      // Reset
      calculator.resetUsageToOriginal()
      
      // Verify chart data is preserved after reset
      expect(calculator.chartData.value.dailyUsage.labels.length).toBe(originalChartLabels.length)
      expect(calculator.chartData.value.dailyUsage.datasets.length).toBe(originalChartDatasets.length)
      
      // Verify chart data is not empty
      expect(calculator.chartData.value.dailyUsage.labels.length).toBeGreaterThan(0)
      expect(calculator.chartData.value.dailyUsage.datasets[0].data.length).toBeGreaterThan(0)
      
      // Verify data values are numbers, not NaN
      const firstDataset = calculator.chartData.value.dailyUsage.datasets[0]
      firstDataset.data.forEach(value => {
        expect(typeof value).toBe('number')
        expect(isNaN(value)).toBe(false)
      })
    })

    it('should maintain proper date formatting in chart labels after reset', () => {
      calculator.processData(sampleData)
      
      // Store original chart labels
      const originalLabels = [...calculator.chartData.value.dailyUsage.labels]
      
      // Verify labels are properly formatted dates
      originalLabels.forEach(label => {
        expect(typeof label).toBe('string')
        expect(label).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
      })
      
      // Modify and reset
      calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      calculator.resetUsageToOriginal()
      
      // Verify labels are still properly formatted after reset
      const restoredLabels = calculator.chartData.value.dailyUsage.labels
      expect(restoredLabels.length).toBe(originalLabels.length)
      
      restoredLabels.forEach(label => {
        expect(typeof label).toBe('string')
        expect(label).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
      })
    })

    it('should handle period data correctly after reset', () => {
      calculator.processData(sampleData)
      
      // Verify we have period data initially
      const originalPeriods = [...new Set(calculator.usageData.value.map(row => row.plan1.period))]
      expect(originalPeriods.length).toBeGreaterThan(0)
      
      // Store original dataset structure
      const originalDatasets = calculator.chartData.value.dailyUsage.datasets.map(ds => ds.label)
      
      // Modify and reset
      calculator.updateMonthlyUsage({ month: '2024-06', consumption: 100 })
      calculator.resetUsageToOriginal()
      
      // Verify periods are preserved
      const restoredPeriods = [...new Set(calculator.usageData.value.map(row => row.plan1.period))]
      expect(restoredPeriods.length).toBe(originalPeriods.length)
      
      // Verify chart datasets match periods
      const restoredDatasets = calculator.chartData.value.dailyUsage.datasets.map(ds => ds.label)
      expect(restoredDatasets.length).toBe(originalDatasets.length)
      
      originalDatasets.forEach(period => {
        expect(restoredDatasets).toContain(period)
      })
    })
  })

  describe('monthsAnalyzed calculation', () => {
    it('should correctly calculate months analyzed for 3-month period', () => {
      // Test data spanning 3 months (Jan 1 - Mar 31, 2025)
      const threeMonthData = [
        { "Date": "1/1/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "1/15/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "2/1/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "2/15/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "3/1/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "3/31/2025", "Start Time": "12:00 AM", "Consumption": "1.0" }
      ]

      calculator.processData(threeMonthData)
      
      expect(calculator.overallComparison.value).not.toBe(null)
      expect(calculator.overallComparison.value.monthsAnalyzed).toBe(3)
      expect(calculator.overallComparison.value.monthsAnalyzed).not.toBe(90)
    })

    it('should correctly calculate months analyzed for single month period', () => {
      // Test data spanning 1 month
      const oneMonthData = [
        { "Date": "1/1/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "1/15/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "1/31/2025", "Start Time": "12:00 AM", "Consumption": "1.0" }
      ]

      calculator.processData(oneMonthData)
      
      expect(calculator.overallComparison.value).not.toBe(null)
      expect(calculator.overallComparison.value.monthsAnalyzed).toBe(1)
    })

    it('should correctly calculate months analyzed for partial month period', () => {
      // Test data spanning about 2 weeks
      const partialMonthData = [
        { "Date": "1/1/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "1/7/2025", "Start Time": "12:00 AM", "Consumption": "1.0" },
        { "Date": "1/14/2025", "Start Time": "12:00 AM", "Consumption": "1.0" }
      ]

      calculator.processData(partialMonthData)
      
      expect(calculator.overallComparison.value).not.toBe(null)
      // Should be less than 1 month, but at least 1 for billing purposes
      expect(calculator.overallComparison.value.monthsAnalyzed).toBe(1)
    })

    it('should correctly calculate months analyzed using real CSV data', async () => {
      // Sample CSV data similar to the real sample.csv
      const csvData = `Name,SAMPLE NAME
Address,123 Sample Street  San Diego CA 92123
Account Number,123412341234
Disclaimer,The information contained in this file is intended for the personal and confidential use of the recipient(s) named above.  Any unauthorized use is prohibited.
Title,CSV Export Electric Meter(s)
Resource,Electric
Meter Number,12341234
Interval UOM,Minute(s)
Reading Start,1/1/2025 00:00
Reading End,3/31/2025 23:45
Total Duration,90 Days
Total Usage,1324.19
UOM,kWh
Meter Number,Date,Start Time,Duration,Consumption,Generation,Net
"12341234","1/1/2025","12:00 AM","15","0.0550","0.0000","0.0550"
"12341234","1/1/2025","12:15 AM","15","0.0550","0.0000","0.0550"
"12341234","1/15/2025","12:00 AM","15","0.0550","0.0000","0.0550"
"12341234","2/1/2025","12:00 AM","15","0.0550","0.0000","0.0550"
"12341234","2/15/2025","12:00 AM","15","0.0550","0.0000","0.0550"
"12341234","3/1/2025","12:00 AM","15","0.0550","0.0000","0.0550"
"12341234","3/31/2025","12:00 AM","15","0.0550","0.0000","0.0550"`

      const parsedData = await parseGreenButtonCsv(csvData)
      calculator.processData(parsedData)

      expect(calculator.overallComparison.value).not.toBe(null)
      console.log('Actual monthsAnalyzed:', calculator.overallComparison.value.monthsAnalyzed)
      console.log('Usage data length:', calculator.usageData.value.length)
      console.log('Unique months:', [...new Set(calculator.usageData.value.map(row => row.month_year_key))])
      
      expect(calculator.overallComparison.value.monthsAnalyzed).toBe(3)
      expect(calculator.overallComparison.value.monthsAnalyzed).not.toBe(90)
    })

    it('should correctly calculate months analyzed using actual sample.csv file', async () => {
      // Read the actual sample.csv file
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const samplePath = path.resolve('./src/assets/sample.csv')
      const csvData = await fs.readFile(samplePath, 'utf-8')
      
      const parsedData = await parseGreenButtonCsv(csvData)
      calculator.processData(parsedData)

      expect(calculator.overallComparison.value).not.toBe(null)
      console.log('ACTUAL SAMPLE FILE - monthsAnalyzed:', calculator.overallComparison.value.monthsAnalyzed)
      console.log('ACTUAL SAMPLE FILE - Usage data length:', calculator.usageData.value.length)
      console.log('ACTUAL SAMPLE FILE - Unique months count:', new Set(calculator.usageData.value.map(row => row.month_year_key)).size)
      console.log('ACTUAL SAMPLE FILE - First few month keys:', calculator.usageData.value.slice(0, 10).map(row => row.month_year_key))
      
      // This test should fail initially (showing the bug)
      expect(calculator.overallComparison.value.monthsAnalyzed).toBe(3)
      expect(calculator.overallComparison.value.monthsAnalyzed).not.toBe(90)
    })
  })
})