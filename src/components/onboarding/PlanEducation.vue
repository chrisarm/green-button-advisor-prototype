<template>
  <div class="plan-education">
    <div class="header">
      <h2>Understanding SDGE Electric Plans</h2>
      <p class="subtitle">Learn about the different plan types before choosing which ones to compare</p>
    </div>

    <!-- Plan Type Comparison -->
    <div class="plan-types">
      <div class="plan-type-card" :class="{ active: selectedType === 'tiered' }" @click="selectedType = 'tiered'">
        <div class="plan-type-header">
          <h3>Tiered Plans</h3>
          <div class="plan-count">1 plan available</div>
        </div>
        <div class="plan-description">
          <p>Traditional pricing where rates increase as you use more electricity each month.</p>
          <div class="features">
            <div class="feature">
              <span class="icon">📊</span>
              <span>Simple usage-based pricing</span>
            </div>
            <div class="feature">
              <span class="icon">⬆️</span>
              <span>Higher rates for heavy usage</span>
            </div>
            <div class="feature">
              <span class="icon">🏠</span>
              <span>Good for consistent usage</span>
            </div>
          </div>
        </div>
      </div>

      <div class="plan-type-card" :class="{ active: selectedType === 'time_of_use' }" @click="selectedType = 'time_of_use'">
        <div class="plan-type-header">
          <h3>Time-of-Use Plans</h3>
          <div class="plan-count">4 plans available</div>
        </div>
        <div class="plan-description">
          <p>Rates vary by time of day and season. Lower rates during off-peak hours.</p>
          <div class="features">
            <div class="feature">
              <span class="icon">🕐</span>
              <span>Time-based pricing</span>
            </div>
            <div class="feature">
              <span class="icon">💡</span>
              <span>Rewards off-peak usage</span>
            </div>
            <div class="feature">
              <span class="icon">🔄</span>
              <span>Good for flexible schedules</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Plan View -->
    <div class="detailed-plans" v-if="selectedType">
      <h3>{{ selectedType === 'tiered' ? 'Tiered Plan Details' : 'Time-of-Use Plan Options' }}</h3>
      
      <div class="plans-grid">
        <div 
          v-for="plan in filteredPlans" 
          :key="plan.type"
          class="plan-detail-card"
        >
          <div class="plan-header">
            <h4>{{ plan.type }}</h4>
            <div v-if="plan.monthlyCharge >= 1" class="monthly-charge">
              ${{ plan.monthlyCharge.toFixed(2) }}/month SDGE fee
            </div>
          </div>
          <p class="plan-name">{{ plan.name }}</p>
          <p class="plan-desc">{{ plan.description }}</p>
          
          <div class="plan-type-badge">
            {{ plan.planType === 'time_of_use' ? 'Time of Use' : 'Tiered' }}
          </div>
          
          <!-- Rate Structure Visualization -->
          <div class="rate-structure">
            <h5>Rate Structure</h5>
            <div v-if="plan.planType === 'tiered'" class="tiered-rates">
              <div class="rate-tier">
                <span class="tier-label">Tier 1 (up to 130% baseline)</span>
                <span class="rate-value">${{ plan.rates.summer.tier1.toFixed(3) }}/kWh</span>
              </div>
              <div class="rate-tier">
                <span class="tier-label">Tier 2 (above 130% baseline)</span>
                <span class="rate-value">${{ plan.rates.summer.tier2.toFixed(3) }}/kWh</span>
              </div>
            </div>
            
            <div v-else class="tou-rates">
              <div class="season-rates">
                <h6>Summer Rates (Jun-Oct)</h6>
                <div v-if="plan.rates.summer.onPeak" class="rate-period">
                  <span class="period-label">On-Peak (4-9 PM)</span>
                  <span class="rate-value">${{ plan.rates.summer.onPeak.toFixed(3) }}/kWh</span>
                </div>
                <div v-if="plan.rates.summer.offPeak" class="rate-period">
                  <span class="period-label">Off-Peak</span>
                  <span class="rate-value">${{ plan.rates.summer.offPeak.toFixed(3) }}/kWh</span>
                </div>
                <div v-if="plan.rates.summer.superOffPeak" class="rate-period">
                  <span class="period-label">Super Off-Peak (12-6 AM)</span>
                  <span class="rate-value">${{ plan.rates.summer.superOffPeak.toFixed(3) }}/kWh</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="plan.requirements && plan.requirements.length > 0" class="requirements">
            <h5>Requirements</h5>
            <ul>
              <li v-for="req in plan.requirements" :key="req">{{ req }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Insights -->
    <div class="insights">
      <h3>Key Insights</h3>
      <div class="insight-cards">
        <div class="insight-card">
          <div class="insight-icon">💰</div>
          <h4>Save Money</h4>
          <p>Time-of-use plans can save money if you can shift usage to off-peak hours (evenings and weekends).</p>
        </div>
        <div class="insight-card">
          <div class="insight-icon">📈</div>
          <h4>Usage Patterns</h4>
          <p>Your actual usage data will show which plan type works best for your household's energy patterns.</p>
        </div>
        <div class="insight-card">
          <div class="insight-icon">🎯</div>
          <h4>Compare Plans</h4>
          <p>We'll help you compare exactly 2 plans using your real usage data to find potential savings.</p>
        </div>
      </div>
    </div>

    <!-- Action -->
    <div class="action-section">
      <p class="action-text">Ready to see how these plans compare with your actual usage data?</p>
      <button @click="$emit('next')" class="next-btn">
        Next: Analyze Your Data
        <span class="arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SDGE_PLANS } from '../../utils/sdgeTariffs.js'

defineEmits(['next'])

const selectedType = ref('tiered')

const planData = computed(() => {
  return Object.entries(SDGE_PLANS).map(([planKey, plan]) => ({
    ...plan,
    type: planKey,  // The plan identifier (DR, TOU-DR1, etc.)
    planType: plan.type  // The internal type (tiered, time_of_use)
  }))
})

const filteredPlans = computed(() => {
  return planData.value.filter(plan => plan.planType === selectedType.value)
})
</script>

<style scoped>
.plan-education {
  max-width: 900px;
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

.plan-types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}

.plan-type-card {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--input-bg);
}

.plan-type-card:hover {
  border-color: var(--link-color);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 108, 255, 0.15);
}

.plan-type-card.active {
  border-color: var(--link-color);
  background: rgba(100, 108, 255, 0.05);
  box-shadow: 0 4px 20px rgba(100, 108, 255, 0.2);
}

.plan-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.plan-type-header h3 {
  margin: 0;
  color: var(--text-color);
}

.plan-count {
  background: var(--link-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.plan-description p {
  margin: 0 0 15px 0;
  color: var(--text-color);
  opacity: 0.9;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.8;
}

.icon {
  font-size: 1.2em;
}

.detailed-plans {
  margin-bottom: 40px;
}

.detailed-plans h3 {
  margin: 0 0 20px 0;
  color: var(--link-color);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.plan-detail-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  background: var(--button-bg);
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
  font-size: 1.2em;
}

.monthly-charge {
  background: var(--border-color);
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8em;
  font-weight: 500;
  opacity: 0.8;
}

.plan-name {
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.plan-desc {
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.8;
  margin: 0 0 10px 0;
}

.plan-type-badge {
  display: inline-block;
  background: var(--border-color);
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  margin-bottom: 15px;
  font-weight: 500;
}

.rate-structure h5 {
  margin: 0 0 10px 0;
  color: var(--text-color);
  font-size: 0.9em;
}

.rate-tier, .rate-period {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color);
}

.rate-tier:last-child, .rate-period:last-child {
  border-bottom: none;
}

.tier-label, .period-label {
  font-size: 0.8em;
  color: var(--text-color);
  opacity: 0.8;
}

.rate-value {
  font-weight: 600;
  color: var(--link-color);
  font-size: 0.9em;
}

.season-rates h6 {
  margin: 10px 0 8px 0;
  color: var(--text-color);
  font-size: 0.8em;
}

.requirements {
  margin-top: 15px;
}

.requirements h5 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 0.9em;
}

.requirements ul {
  margin: 0;
  padding-left: 20px;
}

.requirements li {
  font-size: 0.8em;
  color: #ffa726;
  margin: 3px 0;
}

.insights {
  margin-bottom: 40px;
}

.insights h3 {
  margin: 0 0 20px 0;
  color: var(--link-color);
  text-align: center;
}

.insight-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.insight-card {
  text-align: center;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
}

.insight-icon {
  font-size: 2em;
  margin-bottom: 10px;
}

.insight-card h4 {
  margin: 0 0 10px 0;
  color: var(--text-color);
}

.insight-card p {
  margin: 0;
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.8;
  line-height: 1.4;
}

.action-section {
  text-align: center;
  padding: 30px;
  background: rgba(100, 108, 255, 0.05);
  border: 1px solid var(--link-color);
  border-radius: 12px;
}

.action-text {
  margin: 0 0 20px 0;
  font-size: 1.1em;
  color: var(--text-color);
}

.next-btn {
  background: linear-gradient(135deg, var(--link-color), #535bf2);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 108, 255, 0.3);
}

.arrow {
  transition: transform 0.3s ease;
}

.next-btn:hover .arrow {
  transform: translateX(5px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .plan-types {
    grid-template-columns: 1fr;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .insight-cards {
    grid-template-columns: 1fr;
  }
  
  .plan-type-card, .action-section {
    padding: 20px;
  }
}
</style>