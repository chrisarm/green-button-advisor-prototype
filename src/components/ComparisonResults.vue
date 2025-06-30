<template>
  <div class="comparison-results">
    <!-- Updating Indicator -->
    <div v-if="updating" class="updating-overlay">
      <div class="updating-message">
        <div class="spinner"></div>
        <p>Updating charts and calculations...</p>
      </div>
    </div>
    <!-- Summary Section -->
    <div v-if="overallComparison" class="summary-section">
      <h2>Plan Comparison Summary</h2>
      <p>
        Comparing <strong>{{ overallComparison.plan1.name }}</strong> vs 
        <strong>{{ overallComparison.plan2.name }}</strong>
      </p>
      
      <div class="summary-cards">
        <div class="summary-card plan-left" :class="plan1CostClass">
          <div class="plan-position-label">Plan 1 (Left)</div>
          <h3>{{ overallComparison.plan1.name }}</h3>
          <div class="cost">${{ overallComparison.plan1.totalCost }}</div>
          <div class="rate">Avg: ${{ overallComparison.plan1.averageRate }}/kWh</div>
          <div v-if="isSignificantDifference" class="cost-indicator">
            {{ plan1IsCheaper ? '💰 Cheaper Option' : '💸 More Expensive' }}
          </div>
        </div>
        
        <div class="summary-card comparison">
          <div class="vs">VS</div>
          <div class="savings" :class="savingsClass">
            {{ Math.abs(parseFloat(overallComparison.totalSavings)) > 0.01 ? 
              (parseFloat(overallComparison.totalSavings) > 0 ? 'Save' : 'Cost') : 'Same' }}
          </div>
          <div class="amount" :class="savingsClass">
            ${{ Math.abs(parseFloat(overallComparison.totalSavings)).toFixed(2) }}
          </div>
          <div class="direction" v-if="Math.abs(parseFloat(overallComparison.totalSavings)) > 0.01">
            with {{ overallComparison.savingsDirection }}
          </div>
        </div>
        
        <div class="summary-card plan-right" :class="plan2CostClass">
          <div class="plan-position-label">Plan 2 (Right)</div>
          <h3>{{ overallComparison.plan2.name }}</h3>
          <div class="cost">${{ overallComparison.plan2.totalCost }}</div>
          <div class="rate">Avg: ${{ overallComparison.plan2.averageRate }}/kWh</div>
          <div v-if="isSignificantDifference" class="cost-indicator">
            {{ plan2IsCheaper ? '💰 Cheaper Option' : '💸 More Expensive' }}
          </div>
        </div>
      </div>
      
      <div class="analysis-period">
        <p>
          Analysis based on {{ overallComparison.totalKWh }} kWh over 
          {{ overallComparison.monthsAnalyzed }} month{{ overallComparison.monthsAnalyzed > 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <!-- Period Breakdown -->
    <div v-if="periodComparisons.length > 0" class="period-section">
      <div class="section-header">
        <h2>Usage by Season and Rate Period</h2>
        <button 
          v-if="hasDataBeenModified"
          @click="handleResetUsage" 
          class="reset-button-small"
          data-testid="reset-usage-button-period"
          title="Reset all usage values to original data"
        >
          🔄 Reset Usage
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Season</th>
              <th>Rate Period</th>
              <th>Total kWh</th>
              <th>{{ overallComparison.plan1.name.split(' -')[0] }} Cost</th>
              <th>{{ overallComparison.plan2.name.split(' -')[0] }} Cost</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(period, index) in editablePeriodData" :key="index">
              <td>{{ period.season }}</td>
              <td>{{ period.period }}</td>
              <td>
                <input 
                  type="number" 
                  :value="period.consumption"
                  @blur="updatePeriodUsage(index, $event.target.value)"
                  @keyup.enter="updatePeriodUsage(index, $event.target.value)"
                  class="editable-input"
                  min="0"
                  step="0.01"
                  title="Click to edit usage"
                />
              </td>
              <td>${{ period.plan1Cost }}</td>
              <td>${{ period.plan2Cost }}</td>
              <td :class="getDifferenceClass(period.costDifference)">
                ${{ Math.abs(parseFloat(period.costDifference)).toFixed(2) }}
                {{ parseFloat(period.costDifference) > 0 ? '↑' : parseFloat(period.costDifference) < 0 ? '↓' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Charts Section -->
    <div v-if="chartData.dailyUsage && chartData.dailyUsage.datasets.length > 0" class="charts-section">
      <h2>Usage Visualizations</h2>
      
      <div class="charts-container">
        <div class="chart-wrapper">
          <h3>Daily Usage by Rate Period</h3>
          <BarChart :data="chartData.dailyUsage" :options="dailyChartOptions" />
        </div>
        
        <div v-if="chartData.monthlyComparison && chartData.monthlyComparison.datasets.length > 0" class="chart-wrapper">
          <h3>Monthly Cost Comparison</h3>
          <BarChart :data="chartData.monthlyComparison" :options="monthlyChartOptions" />
        </div>
        
        <div v-if="chartData.monthlySavings && chartData.monthlySavings.datasets.length > 0" class="chart-wrapper">
          <h3>Monthly Savings Potential</h3>
          <BarChart :data="chartData.monthlySavings" :options="savingsChartOptions" />
        </div>
      </div>
    </div>

    <!-- Monthly Details -->
    <div v-if="monthlyComparisons.length > 0" class="monthly-section">
      <div class="section-header">
        <h2>Monthly Breakdown</h2>
        <button 
          v-if="hasDataBeenModified"
          @click="handleResetUsage" 
          class="reset-button-small"
          data-testid="reset-usage-button-monthly"
          title="Reset all usage values to original data"
        >
          🔄 Reset Usage
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>kWh Used</th>
              <th>{{ overallComparison.plan1.name.split(' -')[0] }}</th>
              <th>{{ overallComparison.plan2.name.split(' -')[0] }}</th>
              <th>Monthly Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(month, index) in editableMonthlyData" :key="index">
              <td>{{ formatMonth(month.month) }}</td>
              <td>
                <input 
                  type="number" 
                  :value="month.consumption"
                  @blur="updateMonthlyUsage(index, $event.target.value)"
                  @keyup.enter="updateMonthlyUsage(index, $event.target.value)"
                  class="editable-input"
                  min="0"
                  step="0.01"
                  title="Click to edit usage"
                />
              </td>
              <td>${{ month.plan1TotalCost }}</td>
              <td>${{ month.plan2TotalCost }}</td>
              <td :class="getDifferenceClass(month.monthlySavings)">
                ${{ Math.abs(parseFloat(month.monthlySavings)).toFixed(2) }}
                {{ parseFloat(month.monthlySavings) > 0 ? '↑' : parseFloat(month.monthlySavings) < 0 ? '↓' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { Bar as BarChart } from 'vue-chartjs'

const props = defineProps({
  overallComparison: Object,
  periodComparisons: Array,
  monthlyComparisons: Array,
  chartData: Object,
  hasDataBeenModified: {
    type: Boolean,
    default: false
  },
  updating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-monthly-usage', 'update-period-usage', 'reset-usage'])

// Local refs for editable data
const editableMonthlyData = ref([])
const editablePeriodData = ref([])

// Watch for prop changes and update local editable data
watch(() => props.monthlyComparisons, (newData) => {
  if (newData) {
    editableMonthlyData.value = newData.map(month => ({
      ...month,
      consumption: parseFloat(month.consumption)
    }))
  }
}, { immediate: true })


watch(() => props.periodComparisons, (newData) => {
  if (newData) {
    editablePeriodData.value = newData.map(period => ({
      ...period,
      consumption: parseFloat(period.consumption)
    }))
  }
}, { immediate: true })

// Handle monthly usage updates
const updateMonthlyUsage = (index, newValue) => {
  const numValue = parseFloat(newValue)
  if (!isNaN(numValue) && numValue >= 0) {
    editableMonthlyData.value[index].consumption = numValue
    emit('update-monthly-usage', {
      month: editableMonthlyData.value[index].month,
      consumption: numValue
    })
  }
}

// Handle period usage updates
const updatePeriodUsage = (index, newValue) => {
  const numValue = parseFloat(newValue)
  if (!isNaN(numValue) && numValue >= 0) {
    editablePeriodData.value[index].consumption = numValue
    emit('update-period-usage', {
      season: editablePeriodData.value[index].season,
      period: editablePeriodData.value[index].period,
      consumption: numValue
    })
  }
}

// Handle reset usage
const handleResetUsage = () => {
  const confirmed = window.confirm(
    'Are you sure you want to reset all usage values to the original data? This will undo all your edits.'
  )
  if (confirmed) {
    emit('reset-usage')
  }
}

const savingsClass = computed(() => {
  if (!props.overallComparison) return ''
  const savings = parseFloat(props.overallComparison.totalSavings)
  if (Math.abs(savings) <= 0.01) return 'neutral'
  return savings > 0 ? 'positive' : 'negative'
})

// Plan cost comparison logic
const plan1Cost = computed(() => {
  if (!props.overallComparison) return 0
  return parseFloat(props.overallComparison.plan1.totalCost)
})

const plan2Cost = computed(() => {
  if (!props.overallComparison) return 0
  return parseFloat(props.overallComparison.plan2.totalCost)
})

const costDifference = computed(() => {
  return Math.abs(plan1Cost.value - plan2Cost.value)
})

const isSignificantDifference = computed(() => {
  return costDifference.value > 1.00 // Only show indicators if difference > $1
})

const plan1IsCheaper = computed(() => {
  return plan1Cost.value < plan2Cost.value
})

const plan2IsCheaper = computed(() => {
  return plan2Cost.value < plan1Cost.value
})

const plan1CostClass = computed(() => {
  if (!isSignificantDifference.value) return ''
  return plan1IsCheaper.value ? 'cheaper-plan' : 'expensive-plan'
})

const plan2CostClass = computed(() => {
  if (!isSignificantDifference.value) return ''
  return plan2IsCheaper.value ? 'cheaper-plan' : 'expensive-plan'
})

const getDifferenceClass = (difference) => {
  const diff = parseFloat(difference)
  if (Math.abs(diff) <= 0.01) return 'neutral'
  return diff > 0 ? 'positive' : 'negative'
}

const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-')
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

// Theme-aware chart colors
const chartTextColor = ref('#ffffff')
const chartGridColor = ref('rgba(255, 255, 255, 0.2)')

const updateChartColors = () => {
  const computedStyle = getComputedStyle(document.documentElement)
  chartTextColor.value = computedStyle.getPropertyValue('--chart-text-color').trim() || '#ffffff'
  chartGridColor.value = computedStyle.getPropertyValue('--chart-grid-color').trim() || 'rgba(255, 255, 255, 0.2)'
}

onMounted(() => {
  updateChartColors()
  // Watch for theme changes
  const observer = new MutationObserver(() => {
    updateChartColors()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
})

// Chart options
const baseChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { 
        color: chartTextColor.value
      }
    }
  },
  scales: {
    x: {
      title: { 
        display: true, 
        color: chartTextColor.value
      },
      ticks: { 
        color: chartTextColor.value
      }
    },
    y: {
      title: { 
        display: true, 
        color: chartTextColor.value
      },
      ticks: { 
        color: chartTextColor.value
      },
      grid: { 
        color: chartGridColor.value
      }
    }
  }
}))

const dailyChartOptions = computed(() => ({
  ...baseChartOptions.value,
  scales: {
    ...baseChartOptions.value.scales,
    x: { ...baseChartOptions.value.scales.x, title: { ...baseChartOptions.value.scales.x.title, text: 'Date' }, stacked: true },
    y: { ...baseChartOptions.value.scales.y, title: { ...baseChartOptions.value.scales.y.title, text: 'kWh' }, stacked: true }
  }
}))

const monthlyChartOptions = computed(() => ({
  ...baseChartOptions.value,
  scales: {
    ...baseChartOptions.value.scales,
    x: { ...baseChartOptions.value.scales.x, title: { ...baseChartOptions.value.scales.x.title, text: 'Month' } },
    y: { ...baseChartOptions.value.scales.y, title: { ...baseChartOptions.value.scales.y.title, text: 'Cost ($)' } }
  }
}))

const savingsChartOptions = computed(() => ({
  ...baseChartOptions.value,
  scales: {
    ...baseChartOptions.value.scales,
    x: { ...baseChartOptions.value.scales.x, title: { ...baseChartOptions.value.scales.x.title, text: 'Month' } },
    y: { ...baseChartOptions.value.scales.y, title: { ...baseChartOptions.value.scales.y.title, text: 'Savings ($)' } }
  }
}))
</script>

<style scoped>
.comparison-results {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.summary-section {
  text-align: center;
  margin-bottom: 40px;
}

.summary-cards {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  margin: 30px 0;
  align-items: center;
}

.summary-card {
  background: var(--button-bg);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
}

.summary-card h3 {
  margin: 0 0 15px 0;
  font-size: 1.1em;
  color: var(--link-color);
}

.summary-card .cost {
  font-size: 2em;
  font-weight: bold;
  margin: 10px 0;
  color: var(--text-color);
}

.summary-card .rate {
  color: var(--text-color);
  opacity: 0.7;
  font-size: 0.9em;
}

.plan-position-label {
  font-size: 0.8em;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 8px;
  margin-bottom: 10px;
  text-align: center;
}

.plan-left .plan-position-label {
  background: linear-gradient(135deg, var(--success-color), #45a049);
  color: white;
}

.plan-right .plan-position-label {
  background: linear-gradient(135deg, #FF9800, #f57c00);
  color: white;
}

/* Override position label colors when cost comparison is active */
.cheaper-plan .plan-position-label {
  background: linear-gradient(135deg, var(--success-color), #45a049) !important;
  color: white !important;
}

.expensive-plan .plan-position-label {
  background: linear-gradient(135deg, #FF9800, #f57c00) !important;
  color: white !important;
}

/* Cost comparison styling */
.cheaper-plan {
  border-color: var(--success-color) !important;
  background: rgba(76, 175, 80, 0.1) !important;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2) !important;
}

.expensive-plan {
  border-color: #FF9800 !important;
  background: rgba(255, 152, 0, 0.1) !important;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2) !important;
}

.cost-indicator {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  text-align: center;
}

.cheaper-plan .cost-indicator {
  background: var(--success-color);
  color: white;
}

.expensive-plan .cost-indicator {
  background: #FF9800;
  color: white;
}

.summary-card.comparison {
  border-color: var(--link-color) !important;
  max-width: 200px;
  box-shadow: 0 4px 8px rgba(100, 108, 255, 0.2);
}

/* Light theme comparison card */
:root[data-theme="light"] .summary-card.comparison {
  background: linear-gradient(135deg, #f0f4ff, #e8f0ff) !important;
}

/* Dark theme comparison card */
:root[data-theme="dark"] .summary-card.comparison {
  background: linear-gradient(135deg, var(--button-bg), var(--input-bg)) !important;
}

/* Dark theme overrides for cost comparison */
:root[data-theme="dark"] .cheaper-plan {
  background: rgba(76, 175, 80, 0.15) !important;
}

:root[data-theme="dark"] .expensive-plan {
  background: rgba(255, 152, 0, 0.15) !important;
}

/* Fallback for no theme specified */
.summary-card.comparison {
  background: var(--button-bg) !important;
}

.vs {
  font-size: 1.2em;
  font-weight: bold;
  color: var(--text-color);
  opacity: 0.8;
  margin-bottom: 10px;
}

.savings {
  font-size: 1.3em;
  font-weight: bold;
  margin: 5px 0;
}

.amount {
  font-size: 2.2em;
  font-weight: bold;
  margin: 10px 0;
}

.direction {
  font-size: 0.9em;
  margin-top: 5px;
}

.positive {
  color: var(--success-color);
}

.negative {
  color: var(--error-color);
}

.neutral {
  color: var(--text-color);
  opacity: 0.6;
}

.analysis-period {
  background: rgba(100, 108, 255, 0.1);
  border: 1px solid var(--link-color);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.analysis-period p {
  margin: 0;
  color: var(--text-color);
  opacity: 0.8;
}

.period-section, .monthly-section {
  margin: 40px 0;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--button-bg);
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

th {
  background: var(--input-bg);
  font-weight: 600;
  color: var(--link-color);
  position: sticky;
  top: 0;
}

td {
  color: var(--text-color);
}

tr:hover {
  background: rgba(100, 108, 255, 0.05);
}

[data-theme="dark"] tr:hover {
  background: rgba(100, 108, 255, 0.1);
}

.charts-section {
  margin: 40px 0;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin: 20px 0;
}

.chart-wrapper {
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  height: 400px;
}

.chart-wrapper h3 {
  margin: 0 0 20px 0;
  text-align: center;
  color: var(--link-color);
}


/* Editable input styling */
.editable-input {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  padding: 4px 8px;
  width: 100%;
  max-width: 120px;
  font-size: 0.9em;
  transition: border-color 0.2s ease;
}

.editable-input:focus {
  outline: none;
  border-color: var(--link-color);
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

.editable-input:hover {
  border-color: var(--link-color);
}

/* Section header with reset button */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.section-header h2 {
  margin: 0;
  flex: 1;
}

.reset-button-small {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(255, 152, 0, 0.2);
  white-space: nowrap;
}

.reset-button-small:hover {
  background: linear-gradient(135deg, #f57c00, #ef6c00);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

.reset-button-small:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(255, 152, 0, 0.2);
}

/* Updating overlay */
.updating-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.updating-message {
  background: var(--button-bg);
  border: 2px solid var(--link-color);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  max-width: 300px;
}

.updating-message p {
  margin: 15px 0 0 0;
  color: var(--text-color);
  font-weight: 600;
  font-size: 1.1em;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--link-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .summary-card.comparison {
    max-width: none;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    height: 300px;
    padding: 15px;
  }
  
  table {
    font-size: 0.9em;
  }
  
  th, td {
    padding: 8px 10px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .reset-button-small {
    padding: 6px 12px;
    font-size: 0.8rem;
    align-self: flex-end;
  }
  
  .updating-message {
    padding: 20px;
    max-width: 250px;
  }
  
  .updating-message p {
    font-size: 1em;
  }
  
  .spinner {
    width: 30px;
    height: 30px;
  }
}
</style>