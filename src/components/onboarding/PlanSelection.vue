<template>
  <div class="plan-selection">
    <div class="header">
      <h2>Choose Plans to Compare</h2>
      <p class="subtitle">Based on your usage data, we'll help you select the best plans to compare</p>
    </div>

    <!-- EV Eligibility Question -->
    <div class="ev-eligibility">
      <label class="ev-checkbox">
        <input 
          type="checkbox" 
          v-model="hasEV" 
          @change="handleEVEligibilityChange"
        />
        I own an electric vehicle registered in California
      </label>
      <p class="ev-help">This makes you eligible for the EV-TOU-5 plan with special overnight rates</p>
    </div>

    <!-- Get Recommendations Button -->
    <div class="recommendation-section">
      <button 
        @click="getSmartRecommendations" 
        class="recommendation-btn"
        :disabled="!uploadedData || isLoading"
      >
        <span v-if="!isLoading" class="btn-icon">🧠</span>
        <span v-else class="btn-icon loading">⏳</span>
        {{ isLoading ? 'Analyzing Your Usage...' : 'Get Smart Recommendations' }}
      </button>
      <p class="recommendation-help">
        We'll analyze your usage patterns and recommend the 2 best plans for you
      </p>
    </div>

    <!-- Usage Summary -->
    <div v-if="uploadedData" class="usage-summary">
      <h3>Your Usage Summary</h3>
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <div class="card-value">{{ totalUsage.toFixed(0) }} kWh</div>
            <div class="card-label">Total Usage</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">📅</div>
          <div class="card-content">
            <div class="card-value">{{ monthsAnalyzed }}</div>
            <div class="card-label">Months Analyzed</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">🏠</div>
          <div class="card-content">
            <div class="card-value">{{ averageMonthlyUsage.toFixed(0) }} kWh</div>
            <div class="card-label">Avg Monthly</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">⚡</div>
          <div class="card-content">
            <div class="card-value">{{ peakUsagePercentage.toFixed(0) }}%</div>
            <div class="card-label">Peak Usage</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Smart Recommendations -->
    <div v-if="recommendations.length > 0" class="recommendations">
      <h3>Smart Recommendations</h3>
      <p class="rec-subtitle">Based on your usage patterns</p>
      
      <div class="recommendation-cards">
        <div 
          v-for="rec in recommendations" 
          :key="rec.planType"
          class="recommendation-card"
          :class="{ featured: rec.featured }"
        >
          <div class="rec-header">
            <h4>{{ rec.planType }}</h4>
            <div v-if="rec.featured" class="featured-badge">Recommended</div>
          </div>
          <p class="rec-reason">{{ rec.reason }}</p>
          <div class="rec-highlights">
            <div v-for="highlight in rec.highlights" :key="highlight" class="highlight">
              <span class="highlight-icon">✓</span>
              <span>{{ highlight }}</span>
            </div>
          </div>
          <div class="rec-savings" v-if="rec.potentialSavings">
            <span class="savings-label">Potential Savings:</span>
            <span class="savings-amount">${{ rec.potentialSavings }}/month</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Plan Selection -->
    <div class="plan-selector">
      <h3>Select Two Plans to Compare</h3>
      <p class="selector-subtitle">Choose exactly 2 plans to see detailed cost comparisons</p>
      
      <div class="plans-grid">
        <div 
          v-for="plan in availablePlans" 
          :key="plan.type"
          :class="getPlanClass(plan)"
          @click="togglePlanSelection(plan.type)"
          class="plan-card"
        >
          <div v-if="plan.selected" class="position-indicator">
            <span class="position-badge" :class="getPositionClass(plan.type)">
              {{ getPositionLabel(plan.type) }}
            </span>
          </div>
          
          <div v-if="isRecommended(plan.type)" class="recommended-star">⭐</div>
          
          <div class="plan-header">
            <h4>{{ plan.type }}</h4>
            <div class="monthly-charge">${{ plan.monthlyCharge.toFixed(2) }}/mo</div>
          </div>
          
          <p class="plan-name">{{ plan.name }}</p>
          <p class="plan-description">{{ plan.description }}</p>
          
          <div class="plan-type-badge">
            {{ plan.planType === 'time_of_use' ? 'Time of Use' : 'Tiered' }}
          </div>
          
          <div v-if="plan.requirements && plan.requirements.length > 0" class="requirements">
            <strong>Requirements:</strong>
            <ul>
              <li v-for="req in plan.requirements" :key="req">{{ req }}</li>
            </ul>
          </div>
          
          <!-- Quick Rate Preview -->
          <div class="rate-preview">
            <h5>Rate Preview</h5>
            <div v-if="plan.planType === 'tiered'" class="tiered-preview">
              <div class="rate-item">
                <span>Tier 1:</span>
                <span>${{ plan.rates.summer.tier1.toFixed(3) }}/kWh</span>
              </div>
              <div class="rate-item">
                <span>Tier 2:</span>
                <span>${{ plan.rates.summer.tier2.toFixed(3) }}/kWh</span>
              </div>
            </div>
            <div v-else class="tou-preview">
              <div class="rate-item">
                <span>Peak:</span>
                <span>${{ plan.rates.summer.onPeak.toFixed(3) }}/kWh</span>
              </div>
              <div class="rate-item">
                <span>Off-Peak:</span>
                <span>${{ plan.rates.summer.offPeak.toFixed(3) }}/kWh</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Status -->
    <div class="selection-status">
      <div class="status-content">
        <p v-if="selectedCount === 0" class="status-message">
          Click on 2 plans to compare them
        </p>
        <p v-else-if="selectedCount === 1" class="status-message">
          Select 1 more plan to compare with <strong>{{ selectedPlanNames[0] }}</strong>
        </p>
        <p v-else-if="selectedCount === 2" class="status-message ready">
          Ready to compare: <strong>{{ selectedPlanNames[0] }}</strong> vs <strong>{{ selectedPlanNames[1] }}</strong>
          <br><small>Click on a selected plan to deselect it</small>
        </p>
        <p v-else class="status-message error">
          Please select exactly 2 plans (currently selected: {{ selectedCount }})
        </p>
      </div>
    </div>

    <!-- Navigation -->
    <div class="navigation">
      <button @click="$emit('back')" class="back-btn">
        <span class="arrow">←</span>
        Back to Data Upload
      </button>
      
      <button 
        @click="completeSelection" 
        :disabled="selectedCount !== 2"
        class="complete-btn"
      >
        Start Comparison
        <span class="arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { SDGE_PLANS } from '../../utils/sdgeTariffs.js'

const props = defineProps({
  uploadedData: Object,
  preSelectedPlans: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  evOwnership: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back', 'plans-selected', 'ev-eligibility-changed', 'get-recommendations'])

const selectedPlans = ref([...props.preSelectedPlans])
const hasEV = ref(props.evOwnership)
const smartRecommendationsUsed = ref(false)

// Watch for changes in EV ownership from parent
watch(() => props.evOwnership, (newValue) => {
  hasEV.value = newValue
  console.log('PlanSelection: EV ownership changed to:', newValue)
}, { immediate: true })

// Watch for changes in preSelectedPlans (from parent recommendations)
watch(() => props.preSelectedPlans, (newPlans) => {
  if (newPlans && newPlans.length > 0) {
    selectedPlans.value = [...newPlans]
    smartRecommendationsUsed.value = true
    console.log('PlanSelection: Updated selectedPlans from props:', selectedPlans.value)
  }
}, { immediate: true, deep: true })

const availablePlans = computed(() => {
  const plans = Object.entries(SDGE_PLANS).map(([planKey, plan]) => ({
    ...plan,
    type: planKey, // The plan key like 'DR', 'TOU-DR1' (must come after ...plan to override)
    planType: plan.type, // The internal type like 'tiered', 'time_of_use'
    selected: selectedPlans.value.includes(planKey)
  }))
  
  console.log('PlanSelection: availablePlans computed, selectedPlans:', selectedPlans.value);
  console.log('PlanSelection: Plans with selected state:', plans.map(p => ({ type: p.type, selected: p.selected })));
  
  return plans
})

const selectedCount = computed(() => selectedPlans.value.length)

const selectedPlanNames = computed(() => selectedPlans.value)

// Usage analysis
const totalUsage = computed(() => {
  if (!props.uploadedData || !Array.isArray(props.uploadedData)) return 0
  return props.uploadedData.reduce((sum, row) => {
    const consumption = parseFloat(row.Consumption || row.consumption || 0)
    return sum + (isNaN(consumption) ? 0 : consumption)
  }, 0)
})

const monthsAnalyzed = computed(() => {
  if (!props.uploadedData || !Array.isArray(props.uploadedData)) return 0
  const months = new Set()
  props.uploadedData.forEach(row => {
    const dateStr = row.Date || row.date
    if (dateStr) {
      // Handle various date formats and extract year-month
      const month = dateStr.substring(0, 7) // Assumes YYYY-MM format or MM/DD/YYYY
      months.add(month)
    }
  })
  return months.size
})

const averageMonthlyUsage = computed(() => {
  if (monthsAnalyzed.value === 0) return 0
  return totalUsage.value / monthsAnalyzed.value
})

// For peak usage calculation, we need to estimate since we don't have processed time periods yet
const peakUsagePercentage = computed(() => {
  if (!props.uploadedData || !Array.isArray(props.uploadedData)) return 0
  
  // Estimate peak usage by time of day (4PM - 9PM weekdays roughly)
  const peakUsage = props.uploadedData.reduce((sum, row) => {
    const timeStr = row['Start Time'] || row.startTime || ''
    const consumption = parseFloat(row.Consumption || row.consumption || 0)
    
    if (isNaN(consumption)) return sum
    
    // Simple peak time detection (4 PM - 9 PM)
    const isPeakTime = timeStr.includes('4:00 PM') || timeStr.includes('5:00 PM') || 
                      timeStr.includes('6:00 PM') || timeStr.includes('7:00 PM') || 
                      timeStr.includes('8:00 PM')
    
    return isPeakTime ? sum + consumption : sum
  }, 0)
  
  return totalUsage.value > 0 ? (peakUsage / totalUsage.value) * 100 : 0
})

// Smart recommendations
const recommendations = ref([])

const generateRecommendations = () => {
  if (!props.uploadedData?.data) return

  const avgMonthly = averageMonthlyUsage.value
  const peakPercent = peakUsagePercentage.value
  
  console.log('PlanSelection: Generating recommendations with avgMonthly:', avgMonthly, 'peakPercent:', peakPercent);
  
  const recs = []

  // Always recommend DR as baseline
  recs.push({
    planType: 'DR',
    reason: 'Simple, predictable pricing structure',
    highlights: [
      'No time-of-use complexity',
      'Good for consistent usage patterns',
      'Easy to understand bills'
    ],
    featured: avgMonthly < 600 || peakPercent > 40
  })

  // Recommend TOU plans based on usage patterns
  if (peakPercent < 25) {
    recs.push({
      planType: 'TOU-DR1',
      reason: 'Low peak usage suggests good potential for time-of-use savings',
      highlights: [
        'Lowest off-peak rates',
        'Super off-peak discounts',
        'Good for flexible schedules'
      ],
      featured: true,
      potentialSavings: Math.round(avgMonthly * 0.15)
    })
  }

  if (avgMonthly > 800) {
    recs.push({
      planType: 'TOU-DR2',
      reason: 'High usage households often benefit from TOU-DR2 structure',
      highlights: [
        'Competitive rates for high usage',
        'No super off-peak complexity',
        'Balanced time-of-use option'
      ],
      featured: peakPercent < 30,
      potentialSavings: Math.round(avgMonthly * 0.12)
    })
  }

  recommendations.value = recs.slice(0, 3) // Limit to 3 recommendations
}

const isRecommended = (planType) => {
  return recommendations.value.some(rec => rec.planType === planType && rec.featured)
}

const getPlanClass = (plan) => {
  const classes = []
  
  if (plan.selected) classes.push('selected')
  if (selectedCount.value >= 2 && !plan.selected) classes.push('disabled')
  if (isRecommended(plan.type)) classes.push('recommended')
  
  const result = classes.join(' ')
  console.log(`PlanSelection: getPlanClass for ${plan.type}: selected=${plan.selected}, classes="${result}"`);
  
  return result
}

const togglePlanSelection = (planType) => {
  console.log('PlanSelection: togglePlanSelection called with:', planType);
  console.log('PlanSelection: Current selectedPlans:', selectedPlans.value);
  
  // Don't allow interaction with disabled plans
  if (selectedPlans.value.length >= 2 && !selectedPlans.value.includes(planType)) {
    console.log('PlanSelection: Blocked - already have 2 plans and this is not selected');
    return
  }
  
  const currentIndex = selectedPlans.value.indexOf(planType)
  console.log('PlanSelection: currentIndex:', currentIndex);
  
  if (currentIndex > -1) {
    // Remove from selection
    selectedPlans.value.splice(currentIndex, 1)
    console.log('PlanSelection: Removed plan, new selectedPlans:', selectedPlans.value);
  } else {
    // Add to selection if we have space
    if (selectedPlans.value.length < 2) {
      selectedPlans.value.push(planType)
      console.log('PlanSelection: Added plan, new selectedPlans:', selectedPlans.value);
    } else {
      console.log('PlanSelection: Cannot add - already have 2 plans');
    }
  }
}

const getPositionLabel = (planType) => {
  const index = selectedPlans.value.indexOf(planType)
  if (index === 0) return 'Plan 1'
  if (index === 1) return 'Plan 2'
  return ''
}

const getPositionClass = (planType) => {
  const index = selectedPlans.value.indexOf(planType)
  if (index === 0) return 'position-left'
  if (index === 1) return 'position-right'
  return ''
}

const handleEVEligibilityChange = () => {
  emit('ev-eligibility-changed', hasEV.value)
}

const getSmartRecommendations = async () => {
  if (!props.uploadedData) return
  
  // Emit to parent to handle the recommendation logic
  emit('get-recommendations')
}

const completeSelection = () => {
  if (selectedCount.value === 2) {
    console.log('PlanSelection: Emitting selected plans:', selectedPlans.value)
    emit('plans-selected', selectedPlans.value)
  }
}

onMounted(() => {
  generateRecommendations()
  
  console.log('PlanSelection: onMounted - recommendations:', recommendations.value);
  console.log('PlanSelection: onMounted - selectedPlans before auto-select:', selectedPlans.value);
  
  // Auto-select recommended plans if none selected
  if (selectedPlans.value.length === 0 && recommendations.value.length >= 2) {
    const featuredRecs = recommendations.value.filter(rec => rec.featured)
    console.log('PlanSelection: Featured recommendations:', featuredRecs);
    
    if (featuredRecs.length >= 2) {
      selectedPlans.value = [featuredRecs[0].planType, featuredRecs[1].planType]
      console.log('PlanSelection: Auto-selected 2 featured plans:', selectedPlans.value);
    } else if (featuredRecs.length === 1) {
      selectedPlans.value = [featuredRecs[0].planType, 'DR']
      console.log('PlanSelection: Auto-selected 1 featured + DR:', selectedPlans.value);
    }
  }
})
</script>

<style scoped>
.plan-selection {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h2 {
  margin: 0 0 10px 0;
  color: var(--link-color);
}

.subtitle {
  color: var(--text-color);
  opacity: 0.8;
  font-size: 1.1em;
  margin: 0;
}

.usage-summary {
  margin-bottom: 40px;
}

.usage-summary h3 {
  margin: 0 0 20px 0;
  color: var(--text-color);
  text-align: center;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 15px;
}

.summary-card {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.1);
}

.card-icon {
  font-size: 2em;
  margin-bottom: 10px;
  opacity: 0.8;
}

.card-value {
  font-size: 1.5em;
  font-weight: bold;
  color: var(--link-color);
  margin-bottom: 5px;
}

.card-label {
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.7;
}

.recommendations {
  margin-bottom: 40px;
}

.recommendations h3 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  text-align: center;
}

.rec-subtitle {
  text-align: center;
  color: var(--text-color);
  opacity: 0.7;
  margin: 0 0 20px 0;
}

.recommendation-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.recommendation-card {
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  position: relative;
}

.recommendation-card.featured {
  border-color: var(--success-color);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rec-header h4 {
  margin: 0;
  color: var(--link-color);
}

.featured-badge {
  background: var(--success-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
}

.rec-reason {
  color: var(--text-color);
  opacity: 0.9;
  margin: 0 0 15px 0;
  font-size: 0.9em;
}

.rec-highlights {
  margin-bottom: 15px;
}

.highlight {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 5px 0;
  font-size: 0.8em;
  color: var(--text-color);
  opacity: 0.8;
}

.highlight-icon {
  color: var(--success-color);
  font-weight: bold;
}

.rec-savings {
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.savings-label {
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.8;
}

.savings-amount {
  font-weight: bold;
  color: var(--success-color);
}

.plan-selector {
  margin-bottom: 30px;
}

.plan-selector h3 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  text-align: center;
}

.selector-subtitle {
  text-align: center;
  color: var(--text-color);
  opacity: 0.7;
  margin: 0 0 25px 0;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.plan-card {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  background: var(--input-bg);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.plan-card:hover:not(.disabled) {
  border-color: var(--link-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.15);
}

.plan-card.selected {
  border-color: var(--link-color);
  background: rgba(100, 108, 255, 0.05);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.2);
}

.plan-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.plan-card.recommended {
  border-color: var(--success-color);
}

.plan-card.recommended::before {
  content: '⭐ Recommended';
  position: absolute;
  top: -10px;
  left: 15px;
  background: var(--success-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
}

.position-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
}

.position-badge {
  background: var(--link-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
}

.position-badge.position-left {
  background: var(--success-color);
}

.position-badge.position-right {
  background: #ff9800;
}

.recommended-star {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 1.2em;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.plan-header h4 {
  margin: 0;
  color: var(--link-color);
}

.monthly-charge {
  background: var(--link-color);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8em;
  font-weight: 600;
}

.plan-name {
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.plan-description {
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.8;
  margin: 0 0 15px 0;
}

.plan-type-badge {
  display: inline-block;
  background: var(--border-color);
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  margin-bottom: 15px;
}

.requirements {
  margin-bottom: 15px;
  font-size: 0.9em;
}

.requirements ul {
  margin: 5px 0 0 20px;
  padding: 0;
}

.requirements li {
  color: #ffa726;
  margin: 3px 0;
}

.rate-preview h5 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 0.9em;
}

.rate-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: var(--text-color);
  margin: 3px 0;
}

.selection-status {
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: center;
}

.status-message {
  margin: 0;
  font-weight: 500;
  color: var(--text-color);
}

.status-message.ready {
  color: var(--success-color);
}

.status-message.error {
  color: var(--error-color);
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.back-btn, .complete-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.back-btn:hover {
  border-color: var(--link-color);
  color: var(--link-color);
}

.complete-btn {
  background: linear-gradient(135deg, var(--link-color), #535bf2);
  color: white;
  border: none;
}

.complete-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 108, 255, 0.3);
}

.complete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arrow {
  transition: transform 0.3s ease;
}

.complete-btn:hover .arrow {
  transform: translateX(5px);
}

.back-btn:hover .arrow {
  transform: translateX(-5px);
}

/* EV eligibility and recommendations */
.ev-eligibility {
  margin: 30px 0;
  padding: 20px;
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-align: center;
}

.ev-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 10px;
}

.ev-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.ev-help {
  margin: 0;
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
}

.recommendation-section {
  margin: 30px 0;
  text-align: center;
}

.recommendation-btn {
  padding: 15px 30px;
  font-size: 1.1em;
  font-weight: 600;
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.recommendation-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
}

.recommendation-btn:disabled {
  background: var(--border-color);
  color: var(--text-color);
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 1.2em;
}

.recommendation-help {
  margin-top: 10px;
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
}

.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .recommendation-cards, .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .navigation {
    flex-direction: column;
  }
  
  .back-btn, .complete-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>