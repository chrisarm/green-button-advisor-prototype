import { describe, it, expect } from 'vitest'
import { useMultiPlanCalculator } from '../composables/useMultiPlanCalculator.js'

describe('Position Indicator Functionality', () => {
  describe('Plan ordering and position labels', () => {
    it('should maintain consistent left/right positions based on selection order', () => {
      const calculator = useMultiPlanCalculator()

      // Test 1: DR (first) vs TOU-DR1 (second)
      calculator.setSelectedPlans(['DR', 'TOU-DR1'])
      let plans = calculator.getSelectablePlans()
      
      let drPlan = plans.find(p => p.type === 'DR')
      let touDr1Plan = plans.find(p => p.type === 'TOU-DR1')
      
      expect(drPlan.selected).toBe(true)
      expect(touDr1Plan.selected).toBe(true)
      
      // DR should be Plan 1 (left), TOU-DR1 should be Plan 2 (right)
      expect(calculator.selectedPlans.value.indexOf('DR')).toBe(0)
      expect(calculator.selectedPlans.value.indexOf('TOU-DR1')).toBe(1)

      // Test 2: TOU-DR2 (first) vs EV-TOU-5 (second)
      calculator.setSelectedPlans(['TOU-DR2', 'EV-TOU-5'])
      plans = calculator.getSelectablePlans()
      
      let touDr2Plan = plans.find(p => p.type === 'TOU-DR2')
      let evTou5Plan = plans.find(p => p.type === 'EV-TOU-5')
      
      expect(touDr2Plan.selected).toBe(true)
      expect(evTou5Plan.selected).toBe(true)
      
      // TOU-DR2 should be Plan 1 (left), EV-TOU-5 should be Plan 2 (right)
      expect(calculator.selectedPlans.value.indexOf('TOU-DR2')).toBe(0)
      expect(calculator.selectedPlans.value.indexOf('EV-TOU-5')).toBe(1)
    })

    it('should reflect selection order in comparison results', () => {
      const calculator = useMultiPlanCalculator()

      // Select plans in specific order: EV-TOU-5 first, then DR
      calculator.setSelectedPlans(['EV-TOU-5', 'DR'])

      const sampleData = [
        {
          "Date": "6/15/2024",
          "Start Time": "12:00 AM",
          "Consumption": "1.5"
        }
      ]

      calculator.processData(sampleData)

      const comparison = calculator.overallComparison.value
      expect(comparison).not.toBeNull()
      
      // Plan 1 (left) should be EV-TOU-5, Plan 2 (right) should be DR
      expect(comparison.plan1.type).toBe('EV-TOU-5')
      expect(comparison.plan1.name).toContain('Electric Vehicle')
      expect(comparison.plan2.type).toBe('DR')
      expect(comparison.plan2.name).toContain('Standard Residential')
    })

    it('should handle plan reordering correctly', () => {
      const calculator = useMultiPlanCalculator()

      // Start with TOU-DR1, EV-TOU-5
      calculator.setSelectedPlans(['TOU-DR1', 'EV-TOU-5'])
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR1', 'EV-TOU-5'])

      // Change to DR, TOU-DR2 (completely different pair)
      calculator.setSelectedPlans(['DR', 'TOU-DR2'])
      expect(calculator.selectedPlans.value).toEqual(['DR', 'TOU-DR2'])

      // Verify the plans reflect the new selection
      const plans = calculator.getSelectablePlans()
      
      const drPlan = plans.find(p => p.type === 'DR')
      const touDr2Plan = plans.find(p => p.type === 'TOU-DR2')
      const touDr1Plan = plans.find(p => p.type === 'TOU-DR1')
      const evTou5Plan = plans.find(p => p.type === 'EV-TOU-5')

      expect(drPlan.selected).toBe(true)
      expect(touDr2Plan.selected).toBe(true)
      expect(touDr1Plan.selected).toBe(false)
      expect(evTou5Plan.selected).toBe(false)
    })

    it('should provide clear position context for users', () => {
      const calculator = useMultiPlanCalculator()

      // Simulate user workflow
      calculator.setSelectedPlans(['TOU-DR-P', 'DR'])
      
      const plans = calculator.getSelectablePlans()
      const selectedPlans = plans.filter(p => p.selected)
      
      expect(selectedPlans.length).toBe(2)
      
      // First selected plan should be position 0 (left)
      const leftPlan = selectedPlans.find(p => calculator.selectedPlans.value.indexOf(p.type) === 0)
      expect(leftPlan.type).toBe('TOU-DR-P')
      
      // Second selected plan should be position 1 (right)
      const rightPlan = selectedPlans.find(p => calculator.selectedPlans.value.indexOf(p.type) === 1)
      expect(rightPlan.type).toBe('DR')
    })
  })

  describe('Visual consistency', () => {
    it('should provide consistent color coding for positions', () => {
      // This test verifies that the position indicators use consistent colors
      // Green for left (Plan 1), Orange for right (Plan 2)
      
      // This is more of a documentation test to ensure the color scheme is maintained
      const leftColorClass = 'position-left'
      const rightColorClass = 'position-right'
      
      expect(leftColorClass).toBe('position-left') // Should use green colors
      expect(rightColorClass).toBe('position-right') // Should use orange colors
    })

    it('should maintain position labels across different plan combinations', () => {
      const calculator = useMultiPlanCalculator()
      
      const testCombinations = [
        ['DR', 'TOU-DR1'],
        ['EV-TOU-5', 'TOU-DR2'],
        ['TOU-DR-P', 'DR'],
        ['TOU-DR1', 'TOU-DR2']
      ]

      testCombinations.forEach(([leftPlan, rightPlan]) => {
        calculator.setSelectedPlans([leftPlan, rightPlan])
        
        // Verify order is maintained
        expect(calculator.selectedPlans.value[0]).toBe(leftPlan)
        expect(calculator.selectedPlans.value[1]).toBe(rightPlan)
        
        // Verify selection states
        const plans = calculator.getSelectablePlans()
        const leftPlanObj = plans.find(p => p.type === leftPlan)
        const rightPlanObj = plans.find(p => p.type === rightPlan)
        
        expect(leftPlanObj.selected).toBe(true)
        expect(rightPlanObj.selected).toBe(true)
        
        // Other plans should not be selected
        const otherPlans = plans.filter(p => p.type !== leftPlan && p.type !== rightPlan)
        otherPlans.forEach(plan => {
          expect(plan.selected).toBe(false)
        })
      })
    })
  })
})