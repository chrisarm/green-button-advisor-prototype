<template>
  <div class="comparison-results">
    <!-- Summary Section -->
    <div v-if="overallComparison" class="summary-section">
      <h2>Plan Comparison Summary</h2>
      <p>
        Comparing <strong>{{ overallComparison.plan1.name }}</strong> vs 
        <strong>{{ overallComparison.plan2.name }}</strong>
      </p>
      
      <div class="summary-cards">
        <div class="summary-card plan-left">
          <div class="plan-position-label">Plan 1 (Left)</div>
          <h3>{{ overallComparison.plan1.name }}</h3>
          <div class="cost">${{ overallComparison.plan1.totalCost }}</div>
          <div class="rate">Avg: ${{ overallComparison.plan1.averageRate }}/kWh</div>
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
        
        <div class="summary-card plan-right">
          <div class="plan-position-label">Plan 2 (Right)</div>
          <h3>{{ overallComparison.plan2.name }}</h3>
          <div class="cost">${{ overallComparison.plan2.totalCost }}</div>
          <div class="rate">Avg: ${{ overallComparison.plan2.averageRate }}/kWh</div>
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
      <h2>Usage by Season and Rate Period</h2>
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
            <tr v-for="(period, index) in periodComparisons" :key="index">
              <td>{{ period.season }}</td>
              <td>{{ period.period }}</td>
              <td>{{ period.consumption }}</td>
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
      <h2>Monthly Breakdown</h2>
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
            <tr v-for="(month, index) in monthlyComparisons" :key="index">
              <td>{{ formatMonth(month.month) }}</td>
              <td>{{ month.consumption }}</td>
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
  chartData: Object
})

const savingsClass = computed(() => {
  if (!props.overallComparison) return ''
  const savings = parseFloat(props.overallComparison.totalSavings)
  if (Math.abs(savings) <= 0.01) return 'neutral'
  return savings > 0 ? 'positive' : 'negative'
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
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.plan-right .plan-position-label {
  background: linear-gradient(135deg, #FF9800, #f57c00);
  color: white;
}

.summary-card.comparison {
  background: linear-gradient(135deg, #2a2a3a, #1a1a1a);
  border-color: #646cff;
  max-width: 200px;
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
  color: #4CAF50;
}

.negative {
  color: #F44336;
}

.neutral {
  color: #ccc;
}

.analysis-period {
  background: rgba(100, 108, 255, 0.1);
  border: 1px solid #646cff;
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
}
</style>