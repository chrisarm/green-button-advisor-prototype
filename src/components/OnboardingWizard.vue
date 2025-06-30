<template>
  <div class="onboarding-wizard">
    <!-- Progress Indicator -->
    <div class="progress-indicator">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <div class="step-indicators">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          :class="getStepClass(index)"
          class="step-indicator"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-label">{{ step.label }}</div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <component 
        :is="currentStepComponent" 
        v-bind="currentStepProps"
        @next="handleNext"
        @back="handleBack"
        @complete="handleComplete"
        @data-uploaded="handleDataUploaded"
        @plans-selected="handlePlansSelected"
        @ev-eligibility-changed="handleEVEligibilityChanged"
        @get-recommendations="handleGetRecommendations"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits, defineProps, watch } from 'vue'
import PlanEducation from './onboarding/PlanEducation.vue'
import DataUpload from './onboarding/DataUpload.vue'
import PlanSelection from './onboarding/PlanSelection.vue'

const props = defineProps({
  recommendedPlans: {
    type: Array,
    default: () => []
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  evOwnership: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['complete', 'data-uploaded', 'plans-selected', 'ev-eligibility-changed', 'get-recommendations'])

const currentStep = ref(0)
const uploadedData = ref(null)
const selectedPlans = ref([])

// Watch for recommended plans and update selected plans
watch(() => props.recommendedPlans, (newRecommended) => {
  if (newRecommended && newRecommended.length === 2) {
    selectedPlans.value = [...newRecommended]
  }
}, { immediate: true })

const steps = [
  { label: 'Learn Plans', component: 'PlanEducation' },
  { label: 'Upload Data', component: 'DataUpload' },
  { label: 'Choose Plans', component: 'PlanSelection' }
]

const progressPercentage = computed(() => 
  ((currentStep.value + 1) / steps.length) * 100
)

const currentStepComponent = computed(() => {
  const stepMap = {
    'PlanEducation': PlanEducation,
    'DataUpload': DataUpload,
    'PlanSelection': PlanSelection
  }
  return stepMap[steps[currentStep.value].component]
})

const currentStepProps = computed(() => {
  switch (currentStep.value) {
    case 1: // DataUpload
      return {}
    case 2: // PlanSelection
      return {
        uploadedData: uploadedData.value,
        preSelectedPlans: selectedPlans.value,
        isLoading: props.isProcessing,
        evOwnership: props.evOwnership
      }
    default:
      return {}
  }
})

const getStepClass = (index) => {
  if (index < currentStep.value) return 'completed'
  if (index === currentStep.value) return 'active'
  return 'upcoming'
}

const handleNext = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const handleBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleDataUploaded = (data) => {
  uploadedData.value = data
  emit('data-uploaded', data)
  handleNext()
}

const handlePlansSelected = (plans) => {
  selectedPlans.value = plans
  emit('plans-selected', plans)
  handleComplete()
}

const handleEVEligibilityChanged = (hasEV) => {
  emit('ev-eligibility-changed', hasEV)
}

const handleGetRecommendations = () => {
  emit('get-recommendations')
}

const handleComplete = () => {
  emit('complete', {
    data: uploadedData.value,
    plans: selectedPlans.value
  })
}
</script>

<style scoped>
.onboarding-wizard {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.progress-indicator {
  margin-bottom: 40px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--link-color), #535bf2);
  transition: width 0.3s ease;
}

.step-indicators {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 0.9em;
  font-weight: 500;
  transition: color 0.3s ease;
}

/* Step indicator states */
.step-indicator.upcoming .step-number {
  background: var(--button-bg);
  border: 2px solid var(--border-color);
  color: var(--text-color);
}

.step-indicator.upcoming .step-label {
  color: var(--text-color);
  opacity: 0.6;
}

.step-indicator.active .step-number {
  background: var(--link-color);
  border: 2px solid var(--link-color);
  color: white;
  box-shadow: 0 0 0 4px rgba(100, 108, 255, 0.2);
}

.step-indicator.active .step-label {
  color: var(--link-color);
  font-weight: 600;
}

.step-indicator.completed .step-number {
  background: var(--success-color);
  border: 2px solid var(--success-color);
  color: white;
}

.step-indicator.completed .step-number::after {
  content: '✓';
  font-size: 18px;
}

.step-indicator.completed .step-label {
  color: var(--success-color);
}

.step-content {
  min-height: 500px;
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 30px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .onboarding-wizard {
    padding: 15px;
  }
  
  .step-indicators {
    flex-direction: column;
    gap: 15px;
  }
  
  .step-indicator {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    width: 100%;
  }
  
  .step-number {
    margin-right: 15px;
    margin-bottom: 0;
  }
  
  .step-content {
    padding: 20px;
  }
}
</style>