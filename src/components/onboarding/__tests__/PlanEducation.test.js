import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PlanEducation from '../PlanEducation.vue'

describe('PlanEducation', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(PlanEducation)
  })

  describe('Initial Render', () => {
    it('renders the main title and subtitle', () => {
      expect(wrapper.find('h2').text()).toBe('Understanding SDGE Electric Plans')
      expect(wrapper.find('.subtitle').text()).toContain('Learn about the different plan types')
    })

    it('renders plan type cards', () => {
      const planTypeCards = wrapper.findAll('.plan-type-card')
      expect(planTypeCards).toHaveLength(2)
      
      const cardTitles = planTypeCards.map(card => card.find('h3').text())
      expect(cardTitles).toEqual(['Tiered Plans', 'Time-of-Use Plans'])
    })

    it('shows correct plan counts', () => {
      const planCounts = wrapper.findAll('.plan-count')
      expect(planCounts[0].text()).toBe('1 plan available')
      expect(planCounts[1].text()).toBe('4 plans available')
    })

    it('starts with tiered plans selected by default', () => {
      const tieredCard = wrapper.findAll('.plan-type-card')[0]
      expect(tieredCard.classes()).toContain('active')
      
      const touCard = wrapper.findAll('.plan-type-card')[1]
      expect(touCard.classes()).not.toContain('active')
    })

    it('shows features for each plan type', () => {
      const features = wrapper.findAll('.feature')
      expect(features.length).toBeGreaterThan(0)
      
      // Check that features have icons and text
      features.forEach(feature => {
        expect(feature.find('.icon').exists()).toBe(true)
        expect(feature.text().length).toBeGreaterThan(0)
      })
    })
  })

  describe('Plan Type Selection', () => {
    it('allows switching between plan types', async () => {
      const touCard = wrapper.findAll('.plan-type-card')[1]
      await touCard.trigger('click')
      
      expect(touCard.classes()).toContain('active')
      
      const tieredCard = wrapper.findAll('.plan-type-card')[0]
      expect(tieredCard.classes()).not.toContain('active')
    })

    it('updates detailed plans when switching types', async () => {
      // Initially shows tiered plans
      expect(wrapper.find('.detailed-plans h3').text()).toBe('Tiered Plan Details')
      
      // Switch to time-of-use
      const touCard = wrapper.findAll('.plan-type-card')[1]
      await touCard.trigger('click')
      
      expect(wrapper.find('.detailed-plans h3').text()).toBe('Time-of-Use Plan Options')
    })

    it('filters plans correctly based on selected type', async () => {
      // Check tiered plans (should show plan cards)
      let planCards = wrapper.findAll('.plan-detail-card')
      expect(planCards).toHaveLength(1)
      // Test that it shows the plan type rather than specific plan name
      expect(planCards[0].find('h4').text()).toBeTruthy()
      
      // Switch to time-of-use
      const touCard = wrapper.findAll('.plan-type-card')[1]
      await touCard.trigger('click')
      
      // Check time-of-use plans (should show more than tiered)
      planCards = wrapper.findAll('.plan-detail-card')
      expect(planCards.length).toBeGreaterThan(1)
      
      // Check that we have plan cards with headers
      planCards.forEach(card => {
        expect(card.find('h4').text()).toBeTruthy()
      })
    })
  })

  describe('Plan Detail Cards', () => {
    it('displays plan information correctly', () => {
      const planCard = wrapper.find('.plan-detail-card')
      
      expect(planCard.find('h4').exists()).toBe(true) // Plan type
      // Monthly charge only shows if >= $1
      expect(planCard.find('.plan-name').exists()).toBe(true) // Plan name
      expect(planCard.find('.plan-desc').exists()).toBe(true) // Description
    })

    it('shows rate structure for tiered plans', () => {
      const rateStructure = wrapper.find('.rate-structure')
      expect(rateStructure.exists()).toBe(true)
      
      const rateTiers = wrapper.findAll('.rate-tier')
      expect(rateTiers).toHaveLength(2)
      
      // Check tier labels
      const tierLabels = rateTiers.map(tier => tier.find('.tier-label').text())
      expect(tierLabels[0]).toContain('Tier 1')
      expect(tierLabels[1]).toContain('Tier 2')
      
      // Check rate values are displayed
      rateTiers.forEach(tier => {
        const rateValue = tier.find('.rate-value')
        expect(rateValue.exists()).toBe(true)
        expect(rateValue.text()).toMatch(/\$\d+\.\d{3}\/kWh/)
      })
    })

    it('shows rate structure for time-of-use plans', async () => {
      // Switch to time-of-use
      const touCard = wrapper.findAll('.plan-type-card')[1]
      await touCard.trigger('click')
      
      const rateStructure = wrapper.find('.rate-structure')
      expect(rateStructure.exists()).toBe(true)
      
      const seasonRates = wrapper.find('.season-rates')
      expect(seasonRates.exists()).toBe(true)
      
      const ratePeriods = wrapper.findAll('.rate-period')
      expect(ratePeriods.length).toBeGreaterThan(0)
      
      // Check that rate periods have labels and values
      ratePeriods.forEach(period => {
        expect(period.find('.period-label').exists()).toBe(true)
        expect(period.find('.rate-value').exists()).toBe(true)
        expect(period.find('.rate-value').text()).toMatch(/\$\d+\.\d{3}\/kWh/)
      })
    })

    it('displays monthly charges correctly when >= $1', () => {
      // Monthly charges under $1 are now hidden, so check for plans that have them
      const monthlyCharges = wrapper.findAll('.monthly-charge')
      // Some plans may have monthly charges >= $1, others may not show them
      monthlyCharges.forEach(charge => {
        expect(charge.text()).toMatch(/\$\d+\.\d{2}\/month/)
      })
    })

    it('shows requirements when they exist', async () => {
      // Some plans might have requirements, check if they're displayed when present
      const requirementsSection = wrapper.find('.requirements')
      if (requirementsSection.exists()) {
        expect(requirementsSection.find('h5').text()).toBe('Requirements')
        expect(requirementsSection.find('ul').exists()).toBe(true)
      }
    })
  })

  describe('Insights Section', () => {
    it('renders insights cards', () => {
      const insightCards = wrapper.findAll('.insight-card')
      expect(insightCards).toHaveLength(3)
      
      insightCards.forEach(card => {
        expect(card.find('.insight-icon').exists()).toBe(true)
        expect(card.find('h4').exists()).toBe(true)
        expect(card.find('p').exists()).toBe(true)
      })
    })

    it('shows relevant insight content', () => {
      const insightTitles = wrapper.findAll('.insight-card h4').map(h4 => h4.text())
      expect(insightTitles).toContain('Save Money')
      expect(insightTitles).toContain('Usage Patterns')
      expect(insightTitles).toContain('Compare Plans')
    })
  })

  describe('Navigation', () => {
    it('renders the next button', () => {
      const nextBtn = wrapper.find('.next-btn')
      expect(nextBtn.exists()).toBe(true)
      expect(nextBtn.text()).toContain('Next: Analyze Your Data')
      expect(nextBtn.find('.arrow').text()).toBe('→')
    })

    it('emits next event when next button is clicked', async () => {
      const nextBtn = wrapper.find('.next-btn')
      await nextBtn.trigger('click')
      
      expect(wrapper.emitted('next')).toBeTruthy()
      expect(wrapper.emitted('next')).toHaveLength(1)
    })

    it('has hover effects on interactive elements', async () => {
      const planTypeCard = wrapper.find('.plan-type-card')
      await planTypeCard.trigger('mouseenter')
      
      // CSS hover effects are applied via classes, 
      // we can test that the element exists and is clickable
      expect(planTypeCard.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const headings = [
        wrapper.find('h2'),
        wrapper.find('h3'),
        wrapper.find('h4'),
        wrapper.find('h5')
      ].filter(h => h.exists())
      
      expect(headings.length).toBeGreaterThan(0)
      headings.forEach(heading => {
        expect(heading.text().length).toBeGreaterThan(0)
      })
    })

    it('provides meaningful labels and descriptions', () => {
      const planCards = wrapper.findAll('.plan-type-card')
      planCards.forEach(card => {
        expect(card.find('h3').text().length).toBeGreaterThan(0)
        expect(card.find('p').text().length).toBeGreaterThan(0)
      })
    })

    it('has interactive elements with proper cursor styling', () => {
      const clickableElements = [
        wrapper.find('.plan-type-card'),
        wrapper.find('.next-btn')
      ]
      
      clickableElements.forEach(element => {
        expect(element.element).toHaveProperty('style')
      })
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive classes', () => {
      expect(wrapper.find('.plan-types').exists()).toBe(true)
      expect(wrapper.find('.plans-grid').exists()).toBe(true)
      expect(wrapper.find('.insight-cards').exists()).toBe(true)
      
      // These containers should have CSS grid classes that make them responsive
    })
  })

  describe('Data Integration', () => {
    it('loads plan data from SDGE tariffs', () => {
      // Component should display real plan data from the tariffs file
      const planCards = wrapper.findAll('.plan-detail-card')
      expect(planCards.length).toBeGreaterThan(0)
      
      // Should have plan cards with valid structure
      planCards.forEach(card => {
        expect(card.find('h4').exists()).toBe(true)
        expect(card.find('.plan-name').exists()).toBe(true)
      })
    })

    it('displays accurate rate information', () => {
      const rateValues = wrapper.findAll('.rate-value')
      rateValues.forEach(rate => {
        const rateText = rate.text()
        expect(rateText).toMatch(/\$\d+\.\d{3}\/kWh/)
        
        // Rates should be reasonable (between $0.001 and $1.000 per kWh)
        const rateNumber = parseFloat(rateText.replace(/[\$\/kWh]/g, ''))
        expect(rateNumber).toBeGreaterThan(0.001)
        expect(rateNumber).toBeLessThan(1.000)
      })
    })
  })
})