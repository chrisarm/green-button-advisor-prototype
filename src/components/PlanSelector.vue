<template>
  <div class="plan-selector">
    <h2>SDGE Electric Plan Comparison</h2>
    <p>Select Two (2) Plans below to compare the price difference for your usage.</p>
    
    <div class="plans-container">
      <div 
        v-for="plan in availablePlans" 
        :key="plan.type"
        :class="getPlanClass(plan)"
        @click="togglePlanSelection(plan.type)"
      >
        <div v-if="plan.selected" class="position-indicator">
          <span class="position-badge" :class="getPositionClass(plan.type)">
            {{ getPositionLabel(plan.type) }}
          </span>
        </div>
        
        <h3>{{ plan.type }}</h3>
        <h4>{{ plan.name }}</h4>
        <p>{{ plan.description }}</p>
        
        <div class="plan-details">
          <div class="monthly-charge">
            Monthly Charge: ${{ plan.monthlyCharge.toFixed(2) }}
          </div>
          
          <div v-if="plan.requirements.length > 0" class="requirements">
            <strong>Requirements:</strong>
            <ul>
              <li v-for="req in plan.requirements" :key="req">{{ req }}</li>
            </ul>
          </div>
          
          <div class="plan-type-badge">
            {{ plan.planType === 'time_of_use' ? 'Time of Use' : 'Tiered' }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="selection-status">
      <p v-if="selectedCount === 0">
        Please select 2 plans to compare.
      </p>
      <p v-else-if="selectedCount === 1">
        Please select 1 more plan to compare with <strong>{{ selectedPlanNames[0] }}</strong> (Plan 1 - Left Side).
      </p>
      <p v-else-if="selectedCount === 2" class="ready">
        Ready to compare: <strong>{{ selectedPlanNames[0] }}</strong> (Left) vs <strong>{{ selectedPlanNames[1] }}</strong> (Right)
      </p>
      <p v-else class="error">
        Please select exactly 2 plans. Currently selected: {{ selectedCount }}
      </p>
    </div>
    
    <button 
      @click="$emit('plansSelected')" 
      :disabled="selectedCount !== 2"
      class="next-btn"
    >
      Next - Compare Plans
    </button>
    
    <p class="help-text">
      You'll be able to get personalized advice on how to save money and energy on the next screen.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  availablePlans: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['planToggled', 'plansSelected'])

const selectedPlans = computed(() => 
  props.availablePlans.filter(plan => plan.selected)
)

const selectedCount = computed(() => selectedPlans.value.length)

const selectedPlanNames = computed(() => 
  selectedPlans.value.map(plan => plan.type)
)

const getPlanClass = (plan) => {
  const baseClass = 'plan'
  if (plan.selected) {
    return `${baseClass} selected`
  }
  if (selectedCount.value >= 2 && !plan.selected) {
    return `${baseClass} disabled`
  }
  return baseClass
}

const togglePlanSelection = (planType) => {
  emit('planToggled', planType)
}

const getPositionLabel = (planType) => {
  const index = selectedPlans.value.indexOf(planType)
  if (index === 0) return 'Plan 1 (Left)'
  if (index === 1) return 'Plan 2 (Right)'
  return ''
}

const getPositionClass = (planType) => {
  const index = selectedPlans.value.indexOf(planType)
  if (index === 0) return 'position-left'
  if (index === 1) return 'position-right'
  return ''
}
</script>

<style scoped>
.plan-selector {
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
}

.plans-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 30px 0;
  padding: 0 20px;
}

.plan {
  padding: 20px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--button-bg);
  transition: all 0.25s ease;
  cursor: pointer;
  text-align: left;
  position: relative;
}

.plan:hover:not(.disabled) {
  border-color: var(--link-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.15);
}

.plan.selected {
  border-color: var(--link-color);
  background-color: var(--input-bg);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.2);
}

.plan.selected::after {
  content: '✓';
  position: absolute;
  top: 15px;
  right: 15px;
  color: var(--link-color);
  font-size: 24px;
  font-weight: bold;
}

.position-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
}

.position-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #646cff, #535bf2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.position-badge.position-left {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.position-badge.position-right {
  background: linear-gradient(135deg, #FF9800, #f57c00);
}

.plan.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.plan h3 {
  font-size: 1.5em;
  margin: 0 0 5px 0;
  color: var(--link-color);
}

.plan h4 {
  font-size: 1.1em;
  margin: 0 0 10px 0;
  font-weight: 600;
  color: var(--text-color);
}

.plan > p {
  margin: 0 0 15px 0;
  line-height: 1.4;
  color: var(--text-color);
  opacity: 0.8;
}

.plan-details {
  border-top: 1px solid var(--border-color);
  padding-top: 15px;
  margin-top: 15px;
}

.monthly-charge {
  font-weight: 600;
  color: #4CAF50;
  margin-bottom: 10px;
}

.requirements {
  margin: 10px 0;
  font-size: 0.9em;
}

.requirements ul {
  margin: 5px 0 0 20px;
  padding: 0;
}

.requirements li {
  margin: 3px 0;
  color: #ffa726;
}

.plan-type-badge {
  display: inline-block;
  background-color: var(--border-color);
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 500;
  margin-top: 10px;
}

.selection-status {
  margin: 20px 0;
  padding: 15px;
  border-radius: 8px;
  font-weight: 500;
  color: var(--text-color);
  background-color: var(--button-bg);
  border: 1px solid var(--border-color);
}

.selection-status p {
  margin: 0;
}

.selection-status .ready {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
  border: 1px solid var(--success-color);
}

.selection-status .error {
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--error-color);
  border: 1px solid var(--error-color);
}

.next-btn {
  margin-top: 20px;
  padding: 12px 30px;
  font-size: 1.1em;
  font-weight: 600;
}

.next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.help-text {
  margin-top: 15px;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
}


/* Mobile responsive */
@media (max-width: 768px) {
  .plans-container {
    grid-template-columns: 1fr;
    padding: 0 10px;
  }
  
  .plan {
    padding: 15px;
  }
  
  .plan h3 {
    font-size: 1.3em;
  }
}
</style>