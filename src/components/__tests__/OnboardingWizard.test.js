import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OnboardingWizard from '../OnboardingWizard.vue'
import PlanEducation from '../onboarding/PlanEducation.vue'
import DataUpload from '../onboarding/DataUpload.vue'
import PlanSelection from '../onboarding/PlanSelection.vue'

// Mock the child components
vi.mock('../onboarding/PlanEducation.vue', () => ({
  default: {
    name: 'PlanEducation',
    template: '<div data-testid="plan-education">Plan Education Component</div>',
    emits: ['next']
  }
}))

vi.mock('../onboarding/DataUpload.vue', () => ({
  default: {
    name: 'DataUpload',
    template: '<div data-testid="data-upload">Data Upload Component</div>',
    emits: ['back', 'data-uploaded']
  }
}))

vi.mock('../onboarding/PlanSelection.vue', () => ({
  default: {
    name: 'PlanSelection',
    template: '<div data-testid="plan-selection">Plan Selection Component</div>',
    emits: ['back', 'plans-selected'],
    props: ['uploadedData', 'preSelectedPlans']
  }
}))

describe('OnboardingWizard', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(OnboardingWizard)
  })

  describe('Initial State', () => {
    it('renders the wizard with progress indicator', () => {
      expect(wrapper.find('.onboarding-wizard').exists()).toBe(true)
      expect(wrapper.find('.progress-indicator').exists()).toBe(true)
      expect(wrapper.find('.step-indicators').exists()).toBe(true)
    })

    it('starts on the first step (Plan Education)', () => {
      expect(wrapper.findComponent({ name: 'PlanEducation' }).exists()).toBe(true)
      expect(wrapper.find('[data-testid="plan-education"]').exists()).toBe(true)
    })

    it('displays all three steps in the progress indicator', () => {
      const stepIndicators = wrapper.findAll('.step-indicator')
      expect(stepIndicators).toHaveLength(3)
      
      const stepLabels = stepIndicators.map(step => step.find('.step-label').text())
      expect(stepLabels).toEqual(['Learn Plans', 'Upload Data', 'Choose Plans'])
    })

    it('shows first step as active', () => {
      const stepIndicators = wrapper.findAll('.step-indicator')
      expect(stepIndicators[0].classes()).toContain('active')
      expect(stepIndicators[1].classes()).toContain('upcoming')
      expect(stepIndicators[2].classes()).toContain('upcoming')
    })

    it('shows correct progress percentage', () => {
      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 33.33333333333333%')
    })
  })

  describe('Step Navigation', () => {
    it('advances to data upload step when plan education emits next', async () => {
      const planEducation = wrapper.findComponent({ name: 'PlanEducation' })
      await planEducation.vm.$emit('next')
      
      expect(wrapper.findComponent({ name: 'DataUpload' }).exists()).toBe(true)
      expect(wrapper.find('[data-testid="data-upload"]').exists()).toBe(true)
      
      // Check progress indicator
      const stepIndicators = wrapper.findAll('.step-indicator')
      expect(stepIndicators[0].classes()).toContain('completed')
      expect(stepIndicators[1].classes()).toContain('active')
      expect(stepIndicators[2].classes()).toContain('upcoming')
    })

    it('can go back from data upload to plan education', async () => {
      // Navigate to step 2
      const planEducation = wrapper.findComponent({ name: 'PlanEducation' })
      await planEducation.vm.$emit('next')
      
      // Go back
      const dataUpload = wrapper.findComponent({ name: 'DataUpload' })
      await dataUpload.vm.$emit('back')
      
      expect(wrapper.findComponent({ name: 'PlanEducation' }).exists()).toBe(true)
      expect(wrapper.find('[data-testid="plan-education"]').exists()).toBe(true)
    })

    it('advances to plan selection when data is uploaded', async () => {
      // Navigate to step 2
      const planEducation = wrapper.findComponent({ name: 'PlanEducation' })
      await planEducation.vm.$emit('next')
      
      // Upload data
      const mockData = { data: [{ usage: 100, date: '2024-01-01' }] }
      const dataUpload = wrapper.findComponent({ name: 'DataUpload' })
      await dataUpload.vm.$emit('data-uploaded', mockData)
      
      expect(wrapper.findComponent({ name: 'PlanSelection' }).exists()).toBe(true)
      expect(wrapper.find('[data-testid="plan-selection"]').exists()).toBe(true)
      
      // Check that data is passed to plan selection
      const planSelection = wrapper.findComponent({ name: 'PlanSelection' })
      expect(planSelection.props('uploadedData')).toEqual(mockData)
    })

    it('updates progress percentage as steps advance', async () => {
      // Step 1 - 33.33%
      let progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 33.33333333333333%')
      
      // Navigate to step 2 - 66.67%
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 66.66666666666666%')
      
      // Navigate to step 3 - 100%
      const mockData = { data: [{ usage: 100, date: '2024-01-01' }] }
      await wrapper.findComponent({ name: 'DataUpload' }).vm.$emit('data-uploaded', mockData)
      progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 100%')
    })
  })

  describe('Data Flow', () => {
    it('stores uploaded data and passes it to plan selection', async () => {
      const mockData = { data: [{ usage: 100, date: '2024-01-01', timePeriod: 'Off-Peak' }] }
      
      // Navigate to step 2
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      
      // Upload data
      await wrapper.findComponent({ name: 'DataUpload' }).vm.$emit('data-uploaded', mockData)
      
      // Check that plan selection receives the data
      const planSelection = wrapper.findComponent({ name: 'PlanSelection' })
      expect(planSelection.props('uploadedData')).toEqual(mockData)
    })

    it('stores selected plans and passes them through props', async () => {
      const mockData = { data: [{ usage: 100, date: '2024-01-01' }] }
      const mockPlans = ['DR', 'TOU-DR1']
      
      // Navigate through steps
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      await wrapper.findComponent({ name: 'DataUpload' }).vm.$emit('data-uploaded', mockData)
      
      // Select plans
      await wrapper.findComponent({ name: 'PlanSelection' }).vm.$emit('plans-selected', mockPlans)
      
      // Verify the component stored the plans
      expect(wrapper.vm.selectedPlans).toEqual(mockPlans)
    })

    it('emits data-uploaded event when data is uploaded', async () => {
      const mockData = { data: [{ usage: 100, date: '2024-01-01' }] }
      
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      await wrapper.findComponent({ name: 'DataUpload' }).vm.$emit('data-uploaded', mockData)
      
      expect(wrapper.emitted('data-uploaded')).toBeTruthy()
      expect(wrapper.emitted('data-uploaded')[0]).toEqual([mockData])
    })

    it('emits plans-selected event when plans are selected', async () => {
      const mockData = { data: [{ usage: 100, date: '2024-01-01' }] }
      const mockPlans = ['DR', 'TOU-DR1']
      
      // Navigate through steps
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      await wrapper.findComponent({ name: 'DataUpload' }).vm.$emit('data-uploaded', mockData)
      await wrapper.findComponent({ name: 'PlanSelection' }).vm.$emit('plans-selected', mockPlans)
      
      expect(wrapper.emitted('plans-selected')).toBeTruthy()
      expect(wrapper.emitted('plans-selected')[0]).toEqual([mockPlans])
    })

    it('emits complete event when wizard is finished', async () => {
      const mockData = { data: [{ usage: 100, date: '2024-01-01' }] }
      const mockPlans = ['DR', 'TOU-DR1']
      
      // Complete the wizard flow
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      await wrapper.findComponent({ name: 'DataUpload' }).vm.$emit('data-uploaded', mockData)
      await wrapper.findComponent({ name: 'PlanSelection' }).vm.$emit('plans-selected', mockPlans)
      
      expect(wrapper.emitted('complete')).toBeTruthy()
      expect(wrapper.emitted('complete')[0]).toEqual([{
        data: mockData,
        plans: mockPlans
      }])
    })
  })

  describe('Edge Cases', () => {
    it('handles navigation when at first step and back is called', async () => {
      // Try to go back from first step (should not crash)
      const currentStep = wrapper.vm.currentStep
      wrapper.vm.handleBack()
      expect(wrapper.vm.currentStep).toBe(currentStep) // Should remain at 0
    })

    it('handles navigation when at last step and next is called', async () => {
      // Navigate to last step
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      const mockData = { data: [{ usage: 100, date: '2024-01-01' }] }
      await wrapper.findComponent({ name: 'DataUpload' }).vm.$emit('data-uploaded', mockData)
      
      // Try to go next from last step (should not crash)
      const currentStep = wrapper.vm.currentStep
      wrapper.vm.handleNext()
      expect(wrapper.vm.currentStep).toBe(currentStep) // Should remain at 2
    })

    it('correctly determines current step component', () => {
      expect(wrapper.vm.currentStepComponent).toBe(PlanEducation)
      
      wrapper.vm.currentStep = 1
      expect(wrapper.vm.currentStepComponent).toBe(DataUpload)
      
      wrapper.vm.currentStep = 2
      expect(wrapper.vm.currentStepComponent).toBe(PlanSelection)
    })

    it('provides correct props for each step', async () => {
      // Step 1 - no props needed
      expect(wrapper.vm.currentStepProps).toEqual({})
      
      // Step 2 - no props needed
      wrapper.vm.currentStep = 1
      expect(wrapper.vm.currentStepProps).toEqual({})
      
      // Step 3 - needs uploaded data and preselected plans
      wrapper.vm.currentStep = 2
      wrapper.vm.uploadedData = { data: [{ usage: 100 }] }
      wrapper.vm.selectedPlans = ['DR']
      
      expect(wrapper.vm.currentStepProps).toEqual({
        uploadedData: { data: [{ usage: 100 }] },
        preSelectedPlans: ['DR']
      })
    })
  })

  describe('Progress Indicator', () => {
    it('marks completed steps correctly', async () => {
      // Complete step 1
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      
      const stepIndicators = wrapper.findAll('.step-indicator')
      expect(stepIndicators[0].classes()).toContain('completed')
      expect(stepIndicators[1].classes()).toContain('active')
      expect(stepIndicators[2].classes()).toContain('upcoming')
      
      // Complete step 2
      const mockData = { data: [{ usage: 100, date: '2024-01-01' }] }
      await wrapper.findComponent({ name: 'DataUpload' }).vm.$emit('data-uploaded', mockData)
      
      expect(stepIndicators[0].classes()).toContain('completed')
      expect(stepIndicators[1].classes()).toContain('completed')
      expect(stepIndicators[2].classes()).toContain('active')
    })

    it('shows checkmarks for completed steps', async () => {
      await wrapper.findComponent({ name: 'PlanEducation' }).vm.$emit('next')
      
      const completedStep = wrapper.findAll('.step-indicator')[0]
      expect(completedStep.classes()).toContain('completed')
      // The checkmark is added via CSS ::after pseudo-element
    })
  })
})