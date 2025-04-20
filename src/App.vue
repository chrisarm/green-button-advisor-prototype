<template>
  <div id="app">
     <div class="title-container">
      <img
        src="/logo_transparent_small_border_black.png"
        alt="GreenButton Advisor"
        class="site-logo"
        @error="logoError = true"
        v-if="!logoError"
      />
      <h1 v-if="logoError">GreenButton Advisor</h1>
    </div>
    <h2>Let's make the world a bit greener</h2> 
    <p>We'll start by seeing how to save money on your energy costs and get a lower SDGE electrical bill.</p>
    <hr/>
    <!-- Plans Screen -->
    <div v-if="currentPage === 'plans'">
      <h2>SDGE Electric Plan Comparison</h2>
      <p>Select Two (2) Plans below to compare the price difference for your usage.</p> 
      <div class="plans-container">
        <div class="plan selected">
          <h3>TOU-DR-1</h3>
          <p>Time-of-Use plan with different rates for peak and off-peak hours.</p>
        </div>
        <div class="plan selected">
          <h3>EV-TOU-5</h3>
          <p>For EV owners who can charge overnight — very low overnight costs</p>
        </div>
        <div class="plan disabled">
          <h3>TOU-DR-2</h3>
          <p>More consistent pricing with two simple pricing periods</p>
        </div>
        <div class="plan disabled">
          <h3>TOU-DR-P</h3>
          <p>Like TOU-DR1, but with potential added savings on statewide conservation days</p>
	</div>
        <div class="plan disabled">
          <h3>DR-SES</h3>
          <p>Solar Energy - You could earn credits on your bill by sending excess energy back to the grid</p>
        </div>
      </div>
      <button @click="goToMain" class="sample-data-btn">Next</button>
      <p>You'll be able to get personalized advice on how to save money and energy on the next screen.</p>
    </div>

    <!-- Current App Content -->
    <div v-else>

      <div v-if="!overallSummary && !processing">
        <h3>Compare the selected plans (TOU-DR-1 and EV-TOU-5) and see each plan's costs for your usage</h3>
	<p>When you are ready to see the estimated cost difference for your home upload your GreenButton data.</p>
        <FileUpload @file-parsed="handleUploadData" />
        <div class="help-section">
          <a href="#" @click.prevent="showInstructions = !showInstructions">
            {{ showInstructions ? 'Hide Instructions' : 'Show Instructions' }}
          </a>
          <button @click="loadSampleData" class="sample-data-btn">Try Sample Data</button>
	  <p>Click the 'Try Sample Data' to see an example comparison.</p>
        </div>
      </div>

      <div v-if="processing">
        <p>Processing...</p>
      </div>

      <div v-if="showInstructions && !overallSummary" class="instructions-panel">
        <h2>How-To Get Your GreenButton Data</h2>
        <h3>Step 1: Access Your SDGE Account</h3>
        <ul>
          <li>Navigate to SDGE.com and click "My Energy Center" in the page tab navigation</li>
          <li>Enter your username and password to access your account dashboard</li>
        </ul>
        <h3>Step 2: Download Your GreenButton Data</h3>
        <ul>
          <li>From your dashboard, select the "Usage" tab</li>
          <li>Look for the "GreenButton Download" button (typically under the usage charts)</li>
          <li>Select a date range of about 3+ months.</li>
          <li>Select the CSV format option</li>
          <li>Click "Download" to save your CSV file to your computer</li>
          <li>Take note of where you save the file</li>
        </ul>
        <h3>Step 3: Upload Data to GreenButton Advisor</h3>
        <ul>
          <li>Navigate to the GreenButton Advisor website</li>
          <li>Click the browse button and select the CSV file you downloaded</li>
        </ul>
        <h3>Troubleshooting Tips</h3>
        <ul>
          <li><strong>File Format Issues?</strong> Ensure you've selected the CSV format, not XML</li>
          <li><strong>Data Too Limited?</strong> For best results, upload at least 3 months of usage data</li>
          <li><strong>Processing Errors?</strong> Try downloading a fresh copy of your data</li>
        </ul>
      </div>

      <div v-if="error">
        <p style="color: red;">Error: {{ error }}</p>
      </div>

      <div v-if="overallSummary && !processing && !error">
        <!-- Summary Estimate Section -->
        <h2>Summary Estimate</h2>
        <p>This shows the estimated difference between the TOU-DR-1 and the EV-TOU-5 SDGE plans.</p>
        <table>
          <tbody>
            <tr v-for="(value, key) in overallSummary" :key="key">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Usage by Season and Period Section -->
        <h2>Usage by Season and Period</h2>
        <table>
          <thead>
            <tr>
              <th>Season</th>
              <th>Rate Tier</th>
              <th>Total kWh</th>
              <th>TOU-DR-1 ($/kWh)</th>
              <th>EV-TOU-5* ($/kWh)</th>
              <th>Estimated Difference ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in periodSummary" :key="index">
              <td>{{ row.season }}</td>
              <td>{{ row.rate_tier1 }}</td>
              <td>{{ row.Consumption }}</td>
              <td>${{ row.avg_rate2 }}</td>
              <td>${{ row.avg_rate1 }}</td>
              <td>${{ row.costSavings }}</td>
            </tr>
          </tbody>
        </table>
        <p>*This doesn't account for the fixed monthly fee</p>

        <!-- Visualizations Section -->
        <h2>Visualizations</h2>
        <div class="charts-container">
          <div v-if="chartData.dailyUsage && chartData.dailyUsage.datasets.length > 0" class="chart-wrapper">
            <h3>Daily Usage by Rate Period</h3>
            <BarChart :data="chartData.dailyUsage" :options="dailyChartOptions" />
          </div>
          <div v-else>
            <p>No daily usage data to display.</p>
          </div>
        </div>

        <!-- Monthly Savings Section -->
        <div v-if="chartData.monthlyCost && chartData.monthlyCost.datasets.length > 0">
          <h2>Potential Monthly Savings</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total kWh</th>
                <th>Monthly Difference ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in monthlySummary" :key="index">
                <td>{{ row.datetime }}</td>
                <td>{{ row.Consumption }}</td>
                <td>${{ row.total }}</td>
              </tr>
            </tbody>
          </table>
          <div class="charts-container">
            <div class="chart-wrapper">
              <h3>Monthly Plan Cost</h3>
              <BarChart :data="chartData.monthlyCost" :options="monthlyChartOptions" />
            </div>
	    <div class="chart-wrapper">
              <h3>Monthly Savings</h3>
              <BarChart :data="chartData.monthlySavings" :options="monthlySavingsChartOptions" />
            </div>
          </div>
        </div>
        <div v-else-if="!processing && overallSummary">
          <p>No monthly cost data to display.</p>
        </div>
      </div>

      <button @click="goToPlans" class="sample-data-btn">Back</button>
      <button @click="startOver" class="sample-data-btn">Start Over</button>
    </div>
    <hr/>
    <div class="disclaimer">
      <h2>Electric Plan Recommendation Disclaimer</h2>
      <p>This website provides electric plan recommendations based on your GreenButton usage data solely to help you identify potential cost-saving opportunities. Please note:</p>
      <ul>
        <li><strong>We are not affiliated with, endorsed by, or officially connected with SDGE or GreenButton</strong> in any capacity.</li>
        <li><strong>Our recommendations are estimates only</strong> and should not be considered as official pricing for your past or future electric bills. Electric billing includes other considerations that these estimates are missing.</li>
        <li>Electricity pricing information may not be current or accurate as rates change frequently.</li>
        <li><strong>You are responsible for verifying plan details</strong> directly with your utility provider before making any changes.</li>
        <li>Most utility providers limit plan changes to once per year, so please carefully review all information before committing to a new plan.</li>
      </ul>
      <p>By using this service, you acknowledge that we cannot guarantee savings and that you assume all responsibility for decisions made based on the information presented here.</p>
      <p><strong>Your Privacy Matters:</strong> This is a prototype of what we actually hope to build. We plan to make this web app into a comprehensive energy advisor that helps you save energy and money. Since this is a prototype, your energy data never leaves your device. All analysis happens locally in your browser—this site doesn't store or transmit your personal usage information.</p>
      <p>We're working to make this better able to handle up to 12 months for the most accurate analysis. So some charts may look weird until we finish that effort.</p>
      <p>Copyright April 2025. All rights reserved</p>
      <p>https://github.com/chrisarm/green-button-advisor-prototype</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import FileUpload from './components/FileUpload.vue';
import { useEnergyCalculator } from './composables/useEnergyCalculator.js';
import { Bar as BarChart } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, TimeScale } from 'chart.js';
import { parseGreenButtonCsv } from './utils/csvParser';
import sampleCsvPath from './assets/sample.csv?url';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// Define reactive variables
const currentPage = ref('plans'); // Start on the plans screen
const showInstructions = ref(false);
const logoError = ref(false);

// Energy calculator composable
const {
  processData,
  processing,
  error,
  overallSummary,
  periodSummary,
  monthlySummary,
  chartData
} = useEnergyCalculator();

// Function to navigate to the main app
const goToMain = () => {
  currentPage.value = 'main';
};

// Function to navigate back to the plans screen
const goToPlans = () => {
  currentPage.value = 'plans';
};

// Function to refresh the page
const startOver = () => {
  window.location.reload();
};

// Load sample data
const loadSampleData = async () => {
  try {
    processing.value = true;
    error.value = null;
    const response = await fetch(sampleCsvPath);
    if (!response.ok) {
      throw new Error(`Failed to load sample data (${response.status})`);
    }
    const csvText = await response.text();
    const parsedData = await parseGreenButtonCsv(csvText);
    processData(parsedData);
  } catch (err) {
    console.error('Error loading sample data:', err);
    error.value = err.message;
    processing.value = false;
  }
};

// Handle uploaded data
const handleUploadData = (parsedData) => {
  console.log("Received parsed data:", parsedData);
  processData(parsedData);
};

// Chart options
const dailyChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,

  scales: {
    x: {
      stacked: true,
      title: { display: true, text: 'Date', color: 'white' },
      ticks: {
        color: 'white'  // Y-axis tick labels (e.g., values)
      }

    },
    y: {
      stacked: true,
      title: { display: true, text: 'kWh', color: 'white' },
      ticks: {
        color: 'white'  // Y-axis tick labels (e.g., values)
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.2)'  // Light gray grid lines
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: 'white'  // Legend labels
      }
    }
  }
});


const monthlyChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: false,
      title: { display: true, text: 'Month', color: 'white' },
      ticks: {
        color: 'white'  // Y-axis tick labels (e.g., values)
      }
    },
    y: {
      stacked: false,
      title: { display: true, text: 'Cost ($)', color: 'white' },
      ticks: {
        color: 'white'  // Y-axis tick labels (e.g., values)
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.2)'  // Light gray grid lines
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: 'white'  // Legend labels
      }
    }
  }
});

const monthlySavingsChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: false,
      title: { display: true, text: 'Month', color: 'white' },
      ticks: {
        color: 'white'  // Y-axis tick labels (e.g., values)
      }
    },
    y: {
      stacked: false,
      title: { display: true, text: 'Savings ($)', color: 'white' },
      ticks: {
        color: 'white'  // Y-axis tick labels (e.g., values)
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.2)'  // Light gray grid lines
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: 'white'  // Legend labels
      }
    }
  }
});
</script>

<style scoped>
.plans-container {
  display: flex;
  flex-direction: row;
  gap: 30px; /* Matches charts-container gap */
  justify-content: center;
  margin: 20px 0; /* Matches charts-container margin-top */
  flex-wrap: wrap; /* Allows stacking on smaller screens */
}

.plan {
  flex: 1;
  min-width: 250px; /* Ensures readability on smaller screens */
  max-width: 400px; /* Prevents overly wide cards */
  padding: 2em; /* Matches .card padding */
  border: 1px solid #ddd; /* Matches table border */
  border-radius: 8px; /* Matches button border-radius */
  background-color: #1a1a1a; /* Matches button background in dark mode */
  text-align: left; /* Matches disclaimer text-align */
  transition: border-color 0.25s, background-color 0.25s; /* Matches button transition */
}

.plan.selected {
  border-color: #646cff; /* Matches link color for emphasis */
  background-color: #2a2a3a; /* Slightly lighter than #1a1a1a for contrast */
  position: relative; /* For potential pseudo-elements like checkmarks */
}

.plan.selected::after {
  content: '✔';
  position: absolute;
  top: 10px;
  right: 10px;
  color: #646cff; /* Matches selected border */
  font-size: 1.2em;
}

.plan.disabled {
  opacity: 0.5; /* Reduced opacity for disabled look */
  background-color: #333; /* Darker gray to indicate inactivity */
  cursor: not-allowed; /* Indicates non-interactable */
  border-color: #555; /* Muted border color */
}

@media (prefers-color-scheme: light) {
  .plan {
    background-color: #f9f9f9; /* Matches button background in light mode */
  }
  .plan.selected {
    background-color: #e6e6ff; /* Light purple tint for selection */
    border-color: #535bf2; /* Matches link hover color */
  }
  .plan.selected::after {
    color: #535bf2; /* Matches selected border in light mode */
  }
  .plan.disabled {
    background-color: #ccc; /* Light gray for disabled in light mode */
    border-color: #999; /* Muted border color */
  }
}

.plan h3 {
  font-size: 1.5em; /* Slightly smaller than h2, consistent with table th */
  margin-top: 0;
}

.plan p {
  margin: 0.5em 0 0; /* Tight spacing for content */
}

button {
  /* Inherits global button styles from :root */
  margin-top: 20px; /* Adds spacing above button */
}
</style>
