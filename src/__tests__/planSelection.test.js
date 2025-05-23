import { describe, it, expect, beforeEach } from 'vitest'
import { useMultiPlanCalculator } from '../composables/useMultiPlanCalculator.js'

describe('Plan Selection Behavior', () => {
  let calculator

  beforeEach(() => {
    calculator = useMultiPlanCalculator()
  })

  describe('Plan toggle scenarios', () => {
    it('should allow deselecting TOU-DR1 completely', () => {
      // Start with default selection
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR1', 'EV-TOU-5'])
      
      // Mock the handlePlanToggle behavior for deselecting TOU-DR1
      const currentSelected = calculator.selectedPlans.value
      const planToDeselect = 'TOU-DR1'
      const newSelection = currentSelected.filter(p => p !== planToDeselect)
      
      calculator.setSelectedPlans(newSelection)
      expect(calculator.selectedPlans.value).toEqual(['EV-TOU-5'])
    })

    it('should allow selecting a different plan after deselecting TOU-DR1', () => {
      // Start with default selection
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR1', 'EV-TOU-5'])
      
      // Deselect TOU-DR1 (leaving only EV-TOU-5)
      calculator.setSelectedPlans(['EV-TOU-5'])
      expect(calculator.selectedPlans.value).toEqual(['EV-TOU-5'])
      
      // Now select DR as the second plan
      calculator.setSelectedPlans(['EV-TOU-5', 'DR'])
      expect(calculator.selectedPlans.value).toEqual(['EV-TOU-5', 'DR'])
    })

    it('should allow comparing any two arbitrary plans', () => {
      // Test DR vs TOU-DR-P
      calculator.setSelectedPlans(['DR', 'TOU-DR-P'])
      expect(calculator.selectedPlans.value).toEqual(['DR', 'TOU-DR-P'])
      
      // Test TOU-DR2 vs EV-TOU-5
      calculator.setSelectedPlans(['TOU-DR2', 'EV-TOU-5'])
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR2', 'EV-TOU-5'])
      
      // Test TOU-DR1 vs TOU-DR2
      calculator.setSelectedPlans(['TOU-DR1', 'TOU-DR2'])
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR1', 'TOU-DR2'])
    })

    it('should allow deselecting all plans', () => {
      // Start with default selection
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR1', 'EV-TOU-5'])
      
      // Deselect both plans
      calculator.setSelectedPlans([])
      expect(calculator.selectedPlans.value).toEqual([])
    })

    it('should handle the full user workflow correctly', () => {
      // User starts with default selection
      expect(calculator.selectedPlans.value).toEqual(['TOU-DR1', 'EV-TOU-5'])
      
      // User deselects TOU-DR1 (clicks on it to deselect)
      let currentSelected = calculator.selectedPlans.value
      let newSelection = currentSelected.filter(p => p !== 'TOU-DR1')
      calculator.setSelectedPlans(newSelection)
      expect(calculator.selectedPlans.value).toEqual(['EV-TOU-5'])
      
      // User selects DR (clicks on DR)
      currentSelected = calculator.selectedPlans.value
      newSelection = [...currentSelected, 'DR']
      calculator.setSelectedPlans(newSelection)
      expect(calculator.selectedPlans.value).toEqual(['EV-TOU-5', 'DR'])
      
      // User deselects EV-TOU-5 (clicks on it to deselect)
      currentSelected = calculator.selectedPlans.value
      newSelection = currentSelected.filter(p => p !== 'EV-TOU-5')
      calculator.setSelectedPlans(newSelection)
      expect(calculator.selectedPlans.value).toEqual(['DR'])
      
      // User selects TOU-DR2 (clicks on TOU-DR2)
      currentSelected = calculator.selectedPlans.value
      newSelection = [...currentSelected, 'TOU-DR2']
      calculator.setSelectedPlans(newSelection)
      expect(calculator.selectedPlans.value).toEqual(['DR', 'TOU-DR2'])
      
      // Final comparison should be DR vs TOU-DR2
      expect(calculator.selectedPlans.value).toEqual(['DR', 'TOU-DR2'])
    })
  })

  describe('Plan selector UI state', () => {
    it('should show correct selection states for any combination', () => {
      // Test with DR and TOU-DR-P selected
      calculator.setSelectedPlans(['DR', 'TOU-DR-P'])
      
      const selectablePlans = calculator.getSelectablePlans()
      
      const drPlan = selectablePlans.find(p => p.type === 'DR')
      const touDrPPlan = selectablePlans.find(p => p.type === 'TOU-DR-P')
      const touDr1Plan = selectablePlans.find(p => p.type === 'TOU-DR1')
      const evTou5Plan = selectablePlans.find(p => p.type === 'EV-TOU-5')
      const touDr2Plan = selectablePlans.find(p => p.type === 'TOU-DR2')
      
      expect(drPlan.selected).toBe(true)
      expect(touDrPPlan.selected).toBe(true)
      expect(touDr1Plan.selected).toBe(false)
      expect(evTou5Plan.selected).toBe(false)
      expect(touDr2Plan.selected).toBe(false)
    })

    it('should show correct selection states with only one plan selected', () => {
      // Test with only EV-TOU-5 selected
      calculator.setSelectedPlans(['EV-TOU-5'])
      
      const selectablePlans = calculator.getSelectablePlans()
      
      const evTou5Plan = selectablePlans.find(p => p.type === 'EV-TOU-5')
      const otherPlans = selectablePlans.filter(p => p.type !== 'EV-TOU-5')
      
      expect(evTou5Plan.selected).toBe(true)
      otherPlans.forEach(plan => {
        expect(plan.selected).toBe(false)
      })
    })

    it('should show no plans selected when empty', () => {
      calculator.setSelectedPlans([])
      
      const selectablePlans = calculator.getSelectablePlans()
      
      selectablePlans.forEach(plan => {
        expect(plan.selected).toBe(false)
      })
    })
  })
})