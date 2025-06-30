import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OnboardingWizard from '../components/OnboardingWizard.vue'
import PlanEducation from '../components/onboarding/PlanEducation.vue'
import DataUpload from '../components/onboarding/DataUpload.vue'
import PlanSelection from '../components/onboarding/PlanSelection.vue'

// Mock the CSV parser
vi.mock('../utils/csvParser.js', () => ({
  parseGreenButtonFile: vi.fn()
}))

// Mock sample CSV file import
vi.mock('../assets/sample.csv?url', () => ({
  default: '/mocked-sample.csv'
}))

// Mock fetch for sample data
global.fetch = vi.fn()

describe('Onboarding Integration Flow', () => {
  let wrapper
  let mockParseGreenButtonFile

  beforeEach(async () => {
    vi.clearAllMocks()
    const { parseGreenButtonFile } = await import('../utils/csvParser.js')
    mockParseGreenButtonFile = vi.mocked(parseGreenButtonFile)
    global.fetch.mockClear()
    
    wrapper = mount(OnboardingWizard, {
      global: {
        components: {
          PlanEducation,
          DataUpload,
          PlanSelection
        }
      }
    })
  })

  describe('Complete File Analysis Flow', () => {
    it('completes the full flow from start to finish with file analysis', async () => {
      // Step 1: Plan Education
      expect(wrapper.findComponent(PlanEducation).exists()).toBe(true)
      expect(wrapper.find('.step-indicator.active').text()).toContain('Learn Plans')
      
      // Progress through step 1
      const planEducation = wrapper.findComponent(PlanEducation)
      const nextBtn = planEducation.find('.next-btn')
      await nextBtn.trigger('click')
      
      // Step 2: Data Upload
      expect(wrapper.findComponent(DataUpload).exists()).toBe(true)
      expect(wrapper.findAll('.step-indicator')[1].classes()).toContain('active')
      expect(wrapper.findAll('.step-indicator')[0].classes()).toContain('completed')
      
      // Simulate file analysis
      const mockParsedData = {
        data: [
          { usage: 100, date: '2024-01-01', timePeriod: 'Off-Peak' },
          { usage: 200, date: '2024-01-02', timePeriod: 'On-Peak' }
        ]
      }
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      const dataUpload = wrapper.findComponent(DataUpload)
      const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      
      // Set up file analysis
      dataUpload.vm.selectedFile = mockFile
      await dataUpload.vm.$nextTick()
      
      const processBtn = dataUpload.find('.process-btn')
      await processBtn.trigger('click')
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Step 3: Plan Selection
      expect(wrapper.findComponent(PlanSelection).exists()).toBe(true)
      expect(wrapper.findAll('.step-indicator')[2].classes()).toContain('active')
      expect(wrapper.findAll('.step-indicator')[1].classes()).toContain('completed')
      
      // Verify data was passed
      const planSelection = wrapper.findComponent(PlanSelection)
      expect(planSelection.props('analyzedData')).toEqual(mockParsedData)
      
      // Select plans
      const planCards = planSelection.findAll('.plan-card')
      await planCards[0].trigger('click')
      await planCards[1].trigger('click')
      
      // Complete the flow
      const completeBtn = planSelection.find('.complete-btn')
      await completeBtn.trigger('click')
      
      // Verify completion events
      expect(wrapper.emitted('complete')).toBeTruthy()
      expect(wrapper.emitted('data-analyzed')).toBeTruthy()
      expect(wrapper.emitted('plans-selected')).toBeTruthy()
      
      const completeEvent = wrapper.emitted('complete')[0][0]
      expect(completeEvent.data).toEqual(mockParsedData)
      expect(completeEvent.plans).toHaveLength(2)
    })

    it('handles file analysis errors gracefully', async () => {
      // Navigate to data analysis step
      const planEducation = wrapper.findComponent(PlanEducation)
      await planEducation.find('.next-btn').trigger('click')
      
      // Simulate file analysis error
      const errorMessage = 'Invalid file format'
      mockParseGreenButtonFile.mockRejectedValue(new Error(errorMessage))
      
      const dataUpload = wrapper.findComponent(DataUpload)
      const mockFile = new File(['invalid,data'], 'test.csv', { type: 'text/csv' })
      
      dataUpload.vm.selectedFile = mockFile
      await dataUpload.vm.$nextTick()
      
      const processBtn = dataUpload.find('.process-btn')
      await processBtn.trigger('click')
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should remain on data analysis step with error
      expect(wrapper.findComponent(DataUpload).exists()).toBe(true)
      expect(dataUpload.vm.uploadError).toContain(errorMessage)
      expect(dataUpload.find('.upload-error').exists()).toBe(true)
      
      // Should not proceed to plan selection
      expect(wrapper.findComponent(PlanSelection).exists()).toBe(false)
    })
  })

  describe('Complete Sample Data Flow', () => {
    it('completes the full flow with sample data', async () => {
      // Navigate to data analysis step
      const planEducation = wrapper.findComponent(PlanEducation)
      await planEducation.find('.next-btn').trigger('click')
      
      const dataUpload = wrapper.findComponent(DataUpload)
      
      // Switch to sample data method
      const sampleCard = dataUpload.findAll('.option-card')[1]
      await sampleCard.trigger('click')
      
      expect(dataUpload.find('.sample-section').exists()).toBe(true)
      
      // Mock sample data loading
      const mockCsvData = 'date,usage,timePeriod\n2024-01-01,100,Off-Peak\n2024-01-02,200,On-Peak'
      const mockParsedData = {
        data: [
          { usage: 100, date: '2024-01-01', timePeriod: 'Off-Peak' },
          { usage: 200, date: '2024-01-02', timePeriod: 'On-Peak' }
        ]
      }
      
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCsvData)
      })
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      // Load sample data
      const sampleBtn = dataUpload.find('.sample-btn')
      await sampleBtn.trigger('click')
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should proceed to plan selection
      expect(wrapper.findComponent(PlanSelection).exists()).toBe(true)
      
      const planSelection = wrapper.findComponent(PlanSelection)
      expect(planSelection.props('analyzedData')).toEqual(mockParsedData)
      
      // Complete plan selection
      const planCards = planSelection.findAll('.plan-card')
      await planCards[0].trigger('click')
      await planCards[1].trigger('click')
      
      const completeBtn = planSelection.find('.complete-btn')
      await completeBtn.trigger('click')
      
      // Verify completion
      expect(wrapper.emitted('complete')).toBeTruthy()
      const completeEvent = wrapper.emitted('complete')[0][0]
      expect(completeEvent.data).toEqual(mockParsedData)
    })

    it('handles sample data loading errors', async () => {
      // Navigate to data analysis step
      const planEducation = wrapper.findComponent(PlanEducation)
      await planEducation.find('.next-btn').trigger('click')
      
      const dataUpload = wrapper.findComponent(DataUpload)
      
      // Switch to sample data method
      const sampleCard = dataUpload.findAll('.option-card')[1]
      await sampleCard.trigger('click')
      
      // Mock sample data loading error
      global.fetch.mockRejectedValue(new Error('Failed to fetch sample data'))
      
      const sampleBtn = dataUpload.find('.sample-btn')
      await sampleBtn.trigger('click')
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should show error and remain on data analysis step
      expect(dataUpload.vm.uploadError).toContain('Failed to load sample data')
      expect(wrapper.findComponent(PlanSelection).exists()).toBe(false)
    })
  })

  describe('Navigation Between Steps', () => {
    it('allows navigation back and forth between steps', async () => {
      // Start at step 1
      expect(wrapper.findComponent(PlanEducation).exists()).toBe(true)
      
      // Go to step 2
      let planEducation = wrapper.findComponent(PlanEducation)
      await planEducation.find('.next-btn').trigger('click')
      expect(wrapper.findComponent(DataUpload).exists()).toBe(true)
      
      // Go back to step 1
      let dataUpload = wrapper.findComponent(DataUpload)
      await dataUpload.find('.back-btn').trigger('click')
      expect(wrapper.findComponent(PlanEducation).exists()).toBe(true)
      
      // Go to step 2 again (refetch component reference)
      planEducation = wrapper.findComponent(PlanEducation)
      await planEducation.find('.next-btn').trigger('click')
      expect(wrapper.findComponent(DataUpload).exists()).toBe(true)
      
      // Upload data to go to step 3 (refetch component reference)
      dataUpload = wrapper.findComponent(DataUpload)
      const mockParsedData = { data: [{ usage: 100, date: '2024-01-01' }] }
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      dataUpload.vm.selectedFile = mockFile
      await dataUpload.vm.$nextTick()
      
      await dataUpload.find('.process-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(wrapper.findComponent(PlanSelection).exists()).toBe(true)
      
      // Go back to step 2
      const planSelection = wrapper.findComponent(PlanSelection)
      await planSelection.find('.back-btn').trigger('click')
      expect(wrapper.findComponent(DataUpload).exists()).toBe(true)
    })

    it('maintains progress indicator state during navigation', async () => {
      // Navigate forward through steps
      await wrapper.findComponent(PlanEducation).find('.next-btn').trigger('click')
      
      let stepIndicators = wrapper.findAll('.step-indicator')
      expect(stepIndicators[0].classes()).toContain('completed')
      expect(stepIndicators[1].classes()).toContain('active')
      expect(stepIndicators[2].classes()).toContain('upcoming')
      
      // Navigate back
      await wrapper.findComponent(DataUpload).find('.back-btn').trigger('click')
      
      stepIndicators = wrapper.findAll('.step-indicator')
      expect(stepIndicators[0].classes()).toContain('active')
      expect(stepIndicators[1].classes()).toContain('upcoming')
      expect(stepIndicators[2].classes()).toContain('upcoming')
    })
  })

  describe('Data Persistence', () => {
    it('retains analyzed data when navigating between steps', async () => {
      // Navigate to data analysis and analyze data
      await wrapper.findComponent(PlanEducation).find('.next-btn').trigger('click')
      
      const mockParsedData = { data: [{ usage: 100, date: '2024-01-01' }] }
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      const dataUpload = wrapper.findComponent(DataUpload)
      const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      dataUpload.vm.selectedFile = mockFile
      await dataUpload.vm.$nextTick()
      
      await dataUpload.find('.process-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should be on plan selection with data
      let planSelection = wrapper.findComponent(PlanSelection)
      expect(planSelection.props('analyzedData')).toEqual(mockParsedData)
      
      // Navigate back to data analysis
      await planSelection.find('.back-btn').trigger('click')
      
      // Should be back on data analysis
      expect(wrapper.findComponent(DataUpload).exists()).toBe(true)
      
      // The wizard should remember the analyzed data and auto-advance
      // when we process the same file again, or we can simulate the data being retained
      expect(wrapper.vm.analyzedData).toEqual(mockParsedData)
    })

    it('retains selected plans when completing and then navigating', async () => {
      // Get to plan selection step
      await wrapper.findComponent(PlanEducation).find('.next-btn').trigger('click')
      
      const mockParsedData = { data: [{ usage: 100, date: '2024-01-01' }] }
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      const dataUpload = wrapper.findComponent(DataUpload)
      const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      dataUpload.vm.selectedFile = mockFile
      await dataUpload.vm.$nextTick()
      
      await dataUpload.find('.process-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Select plans
      let planSelection = wrapper.findComponent(PlanSelection)
      const planCards = planSelection.findAll('.plan-card')
      
      // Ensure we have at least 2 plan cards
      expect(planCards.length).toBeGreaterThanOrEqual(2)
      
      await planCards[0].trigger('click')
      await planCards[1].trigger('click')
      
      const selectedPlansBefore = planSelection.vm.selectedPlans.slice()
      
      // Should have selected 2 plans in the component
      expect(selectedPlansBefore).toHaveLength(2)
      
      // Complete the selection to trigger the plans-selected event
      const completeBtn = planSelection.find('.complete-btn')
      expect(completeBtn.attributes('disabled')).toBeUndefined()
      
      // The completion will trigger the complete event and end the onboarding
      // This tests that the wizard properly captures and stores the selected plans
      await completeBtn.trigger('click')
      
      // Verify that the complete event was emitted with the selected plans
      expect(wrapper.emitted('complete')).toBeTruthy()
      const completeEvent = wrapper.emitted('complete')[0][0]
      expect(completeEvent.plans).toEqual(selectedPlansBefore)
      expect(wrapper.vm.selectedPlans).toEqual(selectedPlansBefore)
    })
  })

  describe('Smart Recommendations Integration', () => {
    it('generates appropriate recommendations based on analyzed usage data', async () => {
      // Navigate to plan selection with specific usage pattern
      await wrapper.findComponent(PlanEducation).find('.next-btn').trigger('click')
      
      // Create usage data with low peak usage (good for TOU plans)
      const lowPeakData = {
        data: [
          { usage: 100, date: '2024-01-01', timePeriod: 'Off-Peak' },
          { usage: 100, date: '2024-01-02', timePeriod: 'Off-Peak' },
          { usage: 20, date: '2024-01-03', timePeriod: 'On-Peak' }
        ]
      }
      
      mockParseGreenButtonFile.mockResolvedValue(lowPeakData)
      
      const dataUpload = wrapper.findComponent(DataUpload)
      const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      dataUpload.vm.selectedFile = mockFile
      await dataUpload.vm.$nextTick()
      
      await dataUpload.find('.process-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Check that recommendations are generated
      const planSelection = wrapper.findComponent(PlanSelection)
      expect(planSelection.vm.recommendations.length).toBeGreaterThan(0)
      
      // Should recommend TOU plans for low peak usage
      const touRec = planSelection.vm.recommendations.find(rec => rec.planType.startsWith('TOU'))
      expect(touRec).toBeDefined()
      
      // Verify recommendations are displayed
      const recCards = planSelection.findAll('.recommendation-card')
      expect(recCards.length).toBeGreaterThan(0)
    })

    it('auto-selects recommended plans when available', async () => {
      // Navigate through to plan selection
      await wrapper.findComponent(PlanEducation).find('.next-btn').trigger('click')
      
      const mockParsedData = { data: [{ usage: 100, date: '2024-01-01', timePeriod: 'Off-Peak' }] }
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      const dataUpload = wrapper.findComponent(DataUpload)
      const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      dataUpload.vm.selectedFile = mockFile
      await dataUpload.vm.$nextTick()
      
      await dataUpload.find('.process-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Wait for recommendations to be generated and auto-selection to occur
      const planSelection = wrapper.findComponent(PlanSelection)
      await planSelection.vm.$nextTick()
      
      // Should have auto-selected plans if recommendations are available
      if (planSelection.vm.recommendations.some(rec => rec.featured)) {
        expect(planSelection.vm.selectedPlans.length).toBeGreaterThan(0)
        
        // Selected plans should be visually indicated
        const selectedCards = planSelection.findAll('.plan-card.selected')
        expect(selectedCards.length).toBe(planSelection.vm.selectedPlans.length)
      }
    })
  })

  describe('Error Recovery', () => {
    it('allows user to retry after errors', async () => {
      // Navigate to data upload
      await wrapper.findComponent(PlanEducation).find('.next-btn').trigger('click')
      
      // First attempt - error
      mockParseGreenButtonFile.mockRejectedValueOnce(new Error('Network error'))
      
      const dataUpload = wrapper.findComponent(DataUpload)
      const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      dataUpload.vm.selectedFile = mockFile
      await dataUpload.vm.$nextTick()
      
      await dataUpload.find('.process-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should show error
      expect(dataUpload.find('.upload-error').exists()).toBe(true)
      
      // Retry - success
      const mockParsedData = { data: [{ usage: 100, date: '2024-01-01' }] }
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      const retryBtn = dataUpload.find('.retry-btn')
      await retryBtn.trigger('click')
      
      // Error should be cleared
      expect(dataUpload.vm.uploadError).toBe('')
      
      // Try processing again
      await dataUpload.find('.process-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should proceed to plan selection
      expect(wrapper.findComponent(PlanSelection).exists()).toBe(true)
    })
  })

  describe('Accessibility and UX', () => {
    it('maintains proper focus management during navigation', async () => {
      // This test would ideally check focus management, but since we're using mount,
      // we can at least verify that interactive elements are present and accessible
      
      // Step 1 - should have focusable next button
      const planEducation = wrapper.findComponent(PlanEducation)
      const nextBtn = planEducation.find('.next-btn')
      expect(nextBtn.exists()).toBe(true)
      
      await nextBtn.trigger('click')
      
      // Step 2 - should have focusable back button and upload area
      const dataUpload = wrapper.findComponent(DataUpload)
      expect(dataUpload.find('.back-btn').exists()).toBe(true)
      expect(dataUpload.find('.upload-area').exists()).toBe(true)
    })

    it('provides clear visual feedback for user actions', async () => {
      // Test progress indicator updates
      expect(wrapper.find('.progress-fill').attributes('style')).toContain('33.33')
      
      await wrapper.findComponent(PlanEducation).find('.next-btn').trigger('click')
      expect(wrapper.find('.progress-fill').attributes('style')).toContain('66.66')
      
      // Test step completion visual indicators
      const completedSteps = wrapper.findAll('.step-indicator.completed')
      expect(completedSteps).toHaveLength(1)
    })
  })
})