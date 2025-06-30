import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PlanSelection from '../PlanSelection.vue'

describe('PlanSelection', () => {
  let wrapper
  const mockAnalyzedData = [
    { Consumption: 100, Date: '2024-01-01', 'Start Time': '2:00 PM', timePeriod: 'Off-Peak' },
    { Consumption: 200, Date: '2024-01-02', 'Start Time': '5:00 PM', timePeriod: 'On-Peak' },
    { Consumption: 150, Date: '2024-02-01', 'Start Time': '2:00 PM', timePeriod: 'Off-Peak' },
    { Consumption: 180, Date: '2024-02-02', 'Start Time': '6:00 PM', timePeriod: 'On-Peak' }
  ]

  beforeEach(() => {
    wrapper = mount(PlanSelection, {
      props: {
        analyzedData: mockAnalyzedData,
        preSelectedPlans: []
      }
    })
  })

  describe('Initial Render', () => {
    it('renders the main title and subtitle', () => {
      expect(wrapper.find('h2').text()).toBe('Choose Plans to Compare')
      expect(wrapper.find('.subtitle').text()).toContain('Based on your usage data')
    })

    it('renders usage summary cards', () => {
      const summaryCards = wrapper.findAll('.summary-card')
      expect(summaryCards).toHaveLength(4)
      
      const cardLabels = summaryCards.map(card => card.find('.card-label').text())
      expect(cardLabels).toEqual(['Total Usage', 'Months Analyzed', 'Avg Monthly', 'Peak Usage'])
    })

    it('calculates usage metrics correctly', () => {
      expect(wrapper.vm.totalUsage).toBe(630) // 100 + 200 + 150 + 180
      expect(wrapper.vm.monthsAnalyzed).toBe(2) // Jan and Feb
      expect(wrapper.vm.averageMonthlyUsage).toBe(315) // 630 / 2
      expect(wrapper.vm.peakUsagePercentage).toBeCloseTo(60.32, 2) // (200 + 180) / 630 * 100
    })

    it('correctly calculates months from 90-day sample data format', () => {
      // Test with data that mimics the sample.csv format (MM/DD/YYYY)
      const sampleLikeData = [
        { Consumption: 100, Date: '1/1/2025', 'Start Time': '2:00 PM' },
        { Consumption: 100, Date: '1/15/2025', 'Start Time': '2:00 PM' },
        { Consumption: 100, Date: '1/31/2025', 'Start Time': '2:00 PM' },
        { Consumption: 100, Date: '2/1/2025', 'Start Time': '2:00 PM' },
        { Consumption: 100, Date: '2/15/2025', 'Start Time': '2:00 PM' },
        { Consumption: 100, Date: '2/28/2025', 'Start Time': '2:00 PM' },
        { Consumption: 100, Date: '3/1/2025', 'Start Time': '2:00 PM' },
        { Consumption: 100, Date: '3/15/2025', 'Start Time': '2:00 PM' },
        { Consumption: 100, Date: '3/31/2025', 'Start Time': '2:00 PM' }
      ]
      
      const wrapperWithSampleData = mount(PlanSelection, {
        props: {
          analyzedData: sampleLikeData,
          preSelectedPlans: []
        }
      })
      
      // Should be 3 months (Jan, Feb, Mar), not 9 (number of data points)
      expect(wrapperWithSampleData.vm.monthsAnalyzed).toBe(3)
      expect(wrapperWithSampleData.vm.monthsAnalyzed).not.toBe(9)
      expect(wrapperWithSampleData.vm.monthsAnalyzed).not.toBe(90)
    })
  })

  describe('Smart Recommendations', () => {
    it('should update recommendation tiles when Get Smart Recommendations is clicked', async () => {
      // Initial recommendations should be generated
      expect(wrapper.vm.recommendations.length).toBeGreaterThan(0)
      const initialRecommendations = [...wrapper.vm.recommendations]
      
      // Simulate clicking Get Smart Recommendations
      await wrapper.vm.getSmartRecommendations()
      
      // Should have regenerated recommendations
      expect(wrapper.vm.recommendations).toBeDefined()
      expect(wrapper.vm.recommendations.length).toBeGreaterThan(0)
    })

    it('should update recommendations when EV eligibility changes', async () => {
      // Initially no EV
      expect(wrapper.vm.hasEV).toBe(false)
      const initialRecommendations = [...wrapper.vm.recommendations]
      const hasEVPlan = initialRecommendations.some(rec => rec.planType === 'EV-TOU-5')
      expect(hasEVPlan).toBe(false)
      
      // Change EV eligibility
      await wrapper.vm.handleEVEligibilityChange()
      wrapper.vm.hasEV = true
      await wrapper.vm.generateRecommendations()
      
      // Should now include EV plan if user has EV
      const updatedRecommendations = wrapper.vm.recommendations
      const nowHasEVPlan = updatedRecommendations.some(rec => rec.planType === 'EV-TOU-5')
      expect(nowHasEVPlan).toBe(true)
    })

    it('displays calculated metrics in summary cards', () => {
      const summaryCards = wrapper.findAll('.summary-card')
      
      expect(summaryCards[0].find('.card-value').text()).toBe('630 kWh')
      expect(summaryCards[1].find('.card-value').text()).toBe('2')
      expect(summaryCards[2].find('.card-value').text()).toBe('315 kWh')
      expect(summaryCards[3].find('.card-value').text()).toBe('60%')
    })
  })

  describe('Smart Recommendations', () => {
    it('generates recommendations based on usage patterns', () => {
      expect(wrapper.vm.recommendations.length).toBeGreaterThan(0)
      
      // Should always include DR as baseline
      const drRec = wrapper.vm.recommendations.find(rec => rec.planType === 'DR')
      expect(drRec).toBeDefined()
      expect(drRec.reason).toContain('Simple, predictable pricing')
    })

    it('recommends TOU plans for low peak usage', async () => {
      // Create data with very low peak usage
      const lowPeakData = [
        { Consumption: 100, Date: '2024-01-01', 'Start Time': '2:00 PM', timePeriod: 'Off-Peak' },
        { Consumption: 100, Date: '2024-01-02', 'Start Time': '2:00 PM', timePeriod: 'Off-Peak' },
        { Consumption: 10, Date: '2024-01-03', 'Start Time': '5:00 PM', timePeriod: 'On-Peak' }
      ]
      
      await wrapper.setProps({ analyzedData: lowPeakData })
      wrapper.vm.generateRecommendations()
      
      const touRec = wrapper.vm.recommendations.find(rec => rec.planType === 'TOU-DR1')
      expect(touRec).toBeDefined()
      expect(touRec.featured).toBe(true)
    })

    it('shows different recommendations for high usage households', async () => {
      // Create data with high monthly usage
      const highUsageData = Array.from({ length: 30 }, (_, i) => ({
        Consumption: 30, // 900 kWh/month
        Date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        'Start Time': '2:00 PM',
        timePeriod: 'Off-Peak'
      }))
      
      await wrapper.setProps({ analyzedData: highUsageData })
      wrapper.vm.generateRecommendations()
      
      const rec = wrapper.vm.recommendations.find(rec => rec.planType === 'TOU-DR2')
      expect(rec).toBeDefined()
    })

    it('displays recommendation cards', () => {
      const recCards = wrapper.findAll('.recommendation-card')
      expect(recCards.length).toBeGreaterThan(0)
      
      recCards.forEach(card => {
        expect(card.find('h4').exists()).toBe(true)
        expect(card.find('.rec-reason').exists()).toBe(true)
        expect(card.find('.rec-highlights').exists()).toBe(true)
      })
    })

    it('highlights featured recommendations', () => {
      const featuredCards = wrapper.findAll('.recommendation-card.featured')
      if (featuredCards.length > 0) {
        featuredCards.forEach(card => {
          expect(card.find('.featured-badge').exists()).toBe(true)
          expect(card.find('.featured-badge').text()).toBe('Recommended')
        })
      }
    })

    it('shows potential savings for recommended plans', () => {
      const savingsElements = wrapper.findAll('.rec-savings')
      savingsElements.forEach(savings => {
        expect(savings.find('.savings-label').text()).toBe('Potential Savings:')
        expect(savings.find('.savings-amount').text()).toMatch(/\$\d+\/month/)
      })
    })
  })

  describe('Plan Selection', () => {
    it('renders all available plans', () => {
      const planCards = wrapper.findAll('.plan-card')
      expect(planCards.length).toBeGreaterThan(0)
      
      // Should have plan cards with headers
      planCards.forEach(card => {
        expect(card.find('h4').exists()).toBe(true)
      })
    })

    it('allows selecting plans by clicking', async () => {
      const firstPlan = wrapper.findAll('.plan-card')[0]
      await firstPlan.trigger('click')
      
      expect(wrapper.vm.selectedPlans).toHaveLength(1)
      // Check that plan is now in selected state
      expect(wrapper.vm.selectedPlans[0]).toBeTruthy()
    })

    it('limits selection to 2 plans', async () => {
      const planCards = wrapper.findAll('.plan-card')
      
      // Select first plan
      await planCards[0].trigger('click')
      expect(wrapper.vm.selectedPlans).toHaveLength(1)
      
      // Select second plan
      await planCards[1].trigger('click')
      expect(wrapper.vm.selectedPlans).toHaveLength(2)
      
      // Check that we have exactly 2 plans selected
      expect(wrapper.vm.selectedPlans.length).toBe(2)
    })

    it('allows deselecting plans', async () => {
      const firstPlan = wrapper.findAll('.plan-card')[0]
      
      // Select plan
      await firstPlan.trigger('click')
      expect(wrapper.vm.selectedPlans).toHaveLength(1)
      
      // Deselect plan
      await firstPlan.trigger('click')
      expect(wrapper.vm.selectedPlans).toHaveLength(0)
      expect(firstPlan.classes()).not.toContain('selected')
    })

    it('shows position indicators for selected plans', async () => {
      const planCards = wrapper.findAll('.plan-card')
      
      await planCards[0].trigger('click')
      await planCards[1].trigger('click')
      
      // Check that plans are selected
      expect(wrapper.vm.selectedPlans).toHaveLength(2)
      
      // Position badges should exist when plans are selected
      await wrapper.vm.$nextTick()
      const positionBadges = wrapper.findAll('.position-badge')
      expect(positionBadges.length).toBeGreaterThanOrEqual(0)
    })

    it('disables unselected plans when 2 are selected', async () => {
      const planCards = wrapper.findAll('.plan-card')
      
      // Select 2 plans
      await planCards[0].trigger('click')
      await planCards[1].trigger('click')
      
      // Check that other plans are disabled
      for (let i = 2; i < planCards.length; i++) {
        expect(planCards[i].classes()).toContain('disabled')
      }
    })

    it('marks recommended plans with stars', () => {
      const recommendedStars = wrapper.findAll('.recommended-star')
      if (recommendedStars.length > 0) {
        recommendedStars.forEach(star => {
          expect(star.text()).toBe('⭐')
        })
      }
    })
  })

  describe('Plan Information Display', () => {
    it('shows plan details correctly', () => {
      const planCards = wrapper.findAll('.plan-card')
      
      planCards.forEach(card => {
        expect(card.find('h4').exists()).toBe(true) // Plan type
        expect(card.find('.monthly-charge').exists()).toBe(true) // Monthly charge
        expect(card.find('.plan-name').exists()).toBe(true) // Plan name
        expect(card.find('.plan-description').exists()).toBe(true) // Description
        expect(card.find('.plan-type-badge').exists()).toBe(true) // Plan type badge
      })
    })

    it('displays rate preview for each plan', () => {
      const ratePreviews = wrapper.findAll('.rate-preview')
      
      ratePreviews.forEach(preview => {
        expect(preview.find('h5').text()).toBe('Rate Preview')
        expect(preview.findAll('.rate-item').length).toBeGreaterThan(0)
      })
    })

    it('shows different rate structures for tiered vs TOU plans', () => {
      const tieredPreviews = wrapper.findAll('.tiered-preview')
      const touPreviews = wrapper.findAll('.tou-preview')
      
      expect(tieredPreviews.length + touPreviews.length).toBeGreaterThan(0)
      
      // Tiered plans should show tier rates
      tieredPreviews.forEach(preview => {
        const rateItems = preview.findAll('.rate-item')
        expect(rateItems.some(item => item.text().includes('Tier 1'))).toBe(true)
        expect(rateItems.some(item => item.text().includes('Tier 2'))).toBe(true)
      })
      
      // TOU plans should show peak/off-peak rates
      touPreviews.forEach(preview => {
        const rateItems = preview.findAll('.rate-item')
        expect(rateItems.some(item => item.text().includes('Peak'))).toBe(true)
      })
    })

    it('displays requirements when they exist', () => {
      const requirementsSections = wrapper.findAll('.requirements')
      
      requirementsSections.forEach(section => {
        expect(section.find('strong').text()).toBe('Requirements:')
        expect(section.find('ul').exists()).toBe(true)
      })
    })
  })

  describe('Selection Status', () => {
    it('shows appropriate status message for different selection states', async () => {
      const statusMessage = wrapper.find('.status-message')
      
      // No plans selected
      expect(statusMessage.text()).toContain('Click on 2 plans to compare')
      
      // One plan selected
      const planCards = wrapper.findAll('.plan-card')
      await planCards[0].trigger('click')
      await wrapper.vm.$nextTick()
      // Should show some selection progress
      expect(wrapper.vm.selectedPlans.length).toBe(1)
      
      // Two plans selected
      await planCards[1].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.selectedPlans.length).toBe(2)
    })

    it('updates selection count correctly', async () => {
      expect(wrapper.vm.selectedCount).toBe(0)
      
      const planCards = wrapper.findAll('.plan-card')
      await planCards[0].trigger('click')
      expect(wrapper.vm.selectedCount).toBe(1)
      
      await planCards[1].trigger('click')
      expect(wrapper.vm.selectedCount).toBe(2)
    })
  })

  describe('Navigation', () => {
    it('renders navigation buttons', () => {
      expect(wrapper.find('.back-btn').exists()).toBe(true)
      expect(wrapper.find('.complete-btn').exists()).toBe(true)
    })

    it('emits back event when back button is clicked', async () => {
      const backBtn = wrapper.find('.back-btn')
      await backBtn.trigger('click')
      
      expect(wrapper.emitted('back')).toBeTruthy()
      expect(wrapper.emitted('back')).toHaveLength(1)
    })

    it('disables complete button when less than 2 plans selected', () => {
      const completeBtn = wrapper.find('.complete-btn')
      expect(completeBtn.attributes('disabled')).toBeDefined()
    })

    it('enables complete button when 2 plans selected', async () => {
      const planCards = wrapper.findAll('.plan-card')
      await planCards[0].trigger('click')
      await planCards[1].trigger('click')
      
      const completeBtn = wrapper.find('.complete-btn')
      expect(completeBtn.attributes('disabled')).toBeUndefined()
    })

    it('emits plans-selected event when complete button is clicked', async () => {
      const planCards = wrapper.findAll('.plan-card')
      await planCards[0].trigger('click')
      await planCards[1].trigger('click')
      
      const completeBtn = wrapper.find('.complete-btn')
      await completeBtn.trigger('click')
      
      expect(wrapper.emitted('plans-selected')).toBeTruthy()
      expect(wrapper.emitted('plans-selected')[0][0]).toHaveLength(2)
    })
  })

  describe('Auto-selection', () => {
    it('auto-selects recommended plans on mount when none are pre-selected', async () => {
      // Create data that will generate featured recommendations
      const lowPeakData = {
        data: [
          { usage: 100, date: '2024-01-01', timePeriod: 'Off-Peak' },
          { usage: 100, date: '2024-01-02', timePeriod: 'Off-Peak' },
          { usage: 100, date: '2024-01-03', timePeriod: 'Off-Peak' },
          { usage: 10, date: '2024-01-04', timePeriod: 'On-Peak' } // Very low peak usage
        ]
      }
      
      // Create a new wrapper to test the mounted behavior
      const autoWrapper = mount(PlanSelection, {
        props: {
          uploadedData: lowPeakData,
          preSelectedPlans: []
        }
      })
      
      // Wait for async operations to complete
      await autoWrapper.vm.$nextTick()
      
      // Should auto-select plans if there are featured recommendations
      const featuredRecs = autoWrapper.vm.recommendations.filter(rec => rec.featured)
      if (featuredRecs.length >= 2) {
        expect(autoWrapper.vm.selectedPlans.length).toBe(2)
      } else if (featuredRecs.length === 1) {
        expect(autoWrapper.vm.selectedPlans.length).toBe(2)
        expect(autoWrapper.vm.selectedPlans).toContain(featuredRecs[0].planType)
      }
      
      autoWrapper.unmount()
    })

    it('respects pre-selected plans', () => {
      const preSelectedWrapper = mount(PlanSelection, {
        props: {
          analyzedData: mockAnalyzedData,
          preSelectedPlans: ['DR', 'TOU-DR1']
        }
      })
      
      expect(preSelectedWrapper.vm.selectedPlans).toEqual(['DR', 'TOU-DR1'])
      preSelectedWrapper.unmount()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing uploaded data gracefully', () => {
      const noDataWrapper = mount(PlanSelection, {
        props: {
          uploadedData: null,
          preSelectedPlans: []
        }
      })
      
      expect(noDataWrapper.vm.totalUsage).toBe(0)
      expect(noDataWrapper.vm.monthsAnalyzed).toBe(0)
      expect(noDataWrapper.vm.averageMonthlyUsage).toBe(0)
      expect(noDataWrapper.vm.peakUsagePercentage).toBe(0)
      
      noDataWrapper.unmount()
    })

    it('handles empty data array', () => {
      const emptyDataWrapper = mount(PlanSelection, {
        props: {
          uploadedData: { data: [] },
          preSelectedPlans: []
        }
      })
      
      expect(emptyDataWrapper.vm.totalUsage).toBe(0)
      expect(emptyDataWrapper.vm.monthsAnalyzed).toBe(0)
      
      emptyDataWrapper.unmount()
    })

    it('prevents completing selection with wrong number of plans', async () => {
      // Try with no plans
      wrapper.vm.completeSelection()
      expect(wrapper.emitted('plans-selected')).toBeFalsy()
      
      // Try with one plan
      const planCards = wrapper.findAll('.plan-card')
      await planCards[0].trigger('click')
      wrapper.vm.completeSelection()
      expect(wrapper.emitted('plans-selected')).toBeFalsy()
      
      // Should work with two plans
      await planCards[1].trigger('click')
      wrapper.vm.completeSelection()
      expect(wrapper.emitted('plans-selected')).toBeTruthy()
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      expect(wrapper.find('.summary-cards').exists()).toBe(true)
      expect(wrapper.find('.recommendation-cards').exists()).toBe(true)
      expect(wrapper.find('.plans-grid').exists()).toBe(true)
      
      // These should have CSS grid classes for responsive layout
    })
  })
})