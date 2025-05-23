import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PlanSelector from '../PlanSelector.vue'

describe('PlanSelector', () => {
  const mockPlans = [
    {
      type: 'TOU-DR1',
      name: 'TOU-DR1 - Time of Use Service',
      description: 'Time-of-use option for residential customers',
      planType: 'time_of_use',
      monthlyCharge: 0.402,
      requirements: [],
      selected: true
    },
    {
      type: 'EV-TOU-5',
      name: 'EV-TOU-5 - Electric Vehicle Time of Use',
      description: 'Residential service for customers with qualifying electric vehicles',
      planType: 'time_of_use',
      monthlyCharge: 16.00,
      requirements: ['Must own electric vehicle registered with California DMV'],
      selected: true
    },
    {
      type: 'DR',
      name: 'DR - Standard Residential',
      description: 'Standard UDC schedule for domestic residential electric service',
      planType: 'tiered',
      monthlyCharge: 0.402,
      requirements: [],
      selected: false
    }
  ]

  describe('Position Indicators', () => {
    it('should show correct position labels for selected plans', () => {
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: mockPlans
        }
      })

      // Find the position indicators
      const positionIndicators = wrapper.findAll('.position-indicator')
      expect(positionIndicators.length).toBe(2)

      // Check that position indicators exist for selected plans
      const selectedPlans = wrapper.findAll('.plan.selected')
      expect(selectedPlans.length).toBe(2)
      
      // Each selected plan should have a position indicator
      selectedPlans.forEach(plan => {
        expect(plan.find('.position-indicator').exists()).toBe(true)
      })
    })

    it('should not show position indicators for unselected plans', () => {
      const unselectedPlans = mockPlans.map(plan => ({ ...plan, selected: false }))
      
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: unselectedPlans
        }
      })

      const positionIndicators = wrapper.findAll('.position-indicator')
      expect(positionIndicators.length).toBe(0)
    })

    it('should show only one position indicator when one plan is selected', () => {
      const oneSelectedPlan = mockPlans.map(plan => ({
        ...plan,
        selected: plan.type === 'TOU-DR1'
      }))
      
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: oneSelectedPlan
        }
      })

      const positionIndicators = wrapper.findAll('.position-indicator')
      expect(positionIndicators.length).toBe(1)
      
      const selectedPlan = wrapper.find('.plan.selected')
      expect(selectedPlan.find('.position-indicator').exists()).toBe(true)
    })
  })

  describe('Selection Status Messages', () => {
    it('should show correct message when no plans selected', () => {
      const noSelectedPlans = mockPlans.map(plan => ({ ...plan, selected: false }))
      
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: noSelectedPlans
        }
      })

      const statusText = wrapper.find('.selection-status p').text()
      expect(statusText).toBe('Please select 2 plans to compare.')
    })

    it('should show correct message when one plan selected', () => {
      const oneSelectedPlan = mockPlans.map(plan => ({
        ...plan,
        selected: plan.type === 'TOU-DR1'
      }))
      
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: oneSelectedPlan
        }
      })

      const statusText = wrapper.find('.selection-status p').text()
      expect(statusText).toBe('Please select 1 more plan to compare with TOU-DR1 (Plan 1 - Left Side).')
    })

    it('should show correct message when two plans selected', () => {
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: mockPlans // Has TOU-DR1 and EV-TOU-5 selected
        }
      })

      const statusElement = wrapper.find('.selection-status p.ready')
      expect(statusElement.exists()).toBe(true)
      expect(statusElement.text()).toBe('Ready to compare: TOU-DR1 (Left) vs EV-TOU-5 (Right)')
    })
  })

  describe('Plan Toggle Functionality', () => {
    it('should emit planToggled event when plan is clicked', async () => {
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: mockPlans
        }
      })

      // Click on the DR plan
      const drPlan = wrapper.findAll('.plan')[2] // DR is the third plan
      await drPlan.trigger('click')

      expect(wrapper.emitted('planToggled')).toBeTruthy()
      expect(wrapper.emitted('planToggled')[0]).toEqual(['DR'])
    })

    it('should emit plansSelected when Next button is clicked', async () => {
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: mockPlans // Has 2 plans selected
        }
      })

      const nextButton = wrapper.find('.next-btn')
      expect(nextButton.attributes('disabled')).toBeUndefined()
      
      await nextButton.trigger('click')

      expect(wrapper.emitted('plansSelected')).toBeTruthy()
    })

    it('should disable Next button when fewer than 2 plans selected', () => {
      const oneSelectedPlan = mockPlans.map(plan => ({
        ...plan,
        selected: plan.type === 'TOU-DR1'
      }))
      
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: oneSelectedPlan
        }
      })

      const nextButton = wrapper.find('.next-btn')
      expect(nextButton.attributes('disabled')).toBe('')
    })
  })

  describe('Plan Information Display', () => {
    it('should display all plan information correctly', () => {
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: mockPlans
        }
      })

      const planCards = wrapper.findAll('.plan')
      expect(planCards.length).toBe(3)

      // Check TOU-DR1 plan
      const touDr1Card = planCards[0]
      expect(touDr1Card.find('h3').text()).toBe('TOU-DR1')
      expect(touDr1Card.find('h4').text()).toBe('TOU-DR1 - Time of Use Service')
      expect(touDr1Card.find('.monthly-charge').text()).toBe('SDGE Monthly Charge: $0.40')

      // Check EV-TOU-5 plan with requirements
      const evTou5Card = planCards[1]
      expect(evTou5Card.find('h3').text()).toBe('EV-TOU-5')
      expect(evTou5Card.find('.requirements').exists()).toBe(true)
      expect(evTou5Card.find('.requirements li').text()).toContain('electric vehicle')
    })

    it('should show correct plan type badges', () => {
      const wrapper = mount(PlanSelector, {
        props: {
          availablePlans: mockPlans
        }
      })

      const planTypeBadges = wrapper.findAll('.plan-type-badge')
      expect(planTypeBadges[0].text()).toBe('Time of Use') // TOU-DR1
      expect(planTypeBadges[1].text()).toBe('Time of Use') // EV-TOU-5
      expect(planTypeBadges[2].text()).toBe('Tiered') // DR
    })
  })
})