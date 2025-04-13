<template>
  <div id="app">
    <div class="title-container">
      <img 
        src="/logo_transparent_small.png" 
        alt="Green Button Advisor" 
        class="site-logo" 
        @error="logoError = true"
        v-if="!logoError"
      />
      <h1 v-if="logoError">Green Button Advisor</h1>
    </div>
    <h2>We want to make the world a bit greener for everyone</h2>

    <div v-if="!overallSummary && !processing">
      <h4>Upload SDGE Green Button Data</h4>
      <FileUpload @file-parsed="handleUploadData" />
      <div class="help-section">
        <a href="#" @click.prevent="showInstructions = !showInstructions">
          {{ showInstructions ? 'Hide Instructions' : 'Show Instructions' }}
        </a> 
        <button @click="loadSampleData" class="sample-data-btn">
          Try Sample Data
        </button>
      </div>
    </div>

    <!--div v-if="!overallSummary && !processing">
      <h4>Upload SDGE Green Button Data</h4>
      <FileUpload @file-parsed="handleFileUpload" />
      <div class="help-section">
      <a href="#" @click.prevent="showInstructions = !showInstructions">
        {{ showInstructions ? 'Hide Instructions' : 'Show Instructions' }}
      </a> 
      <button @click="loadSampleData" class="sample-data-btn">
        Try Sample Data
      </button>
      </div>
    </div-->

    <!--div class="sample-data-container">
    </div-->

    <div v-if="processing">
      <p>Processing...</p>
    </div>

    
    <div v-if="showInstructions && !overallSummary" class="instructions-panel">
      <h2>How-To Get Your Green Button Data</h2>
    
      <h3>Step 1: Access Your SDGE Account</h3>
      <ul>
        <li>Navigate to SDGE.com and click "My Energy Center" in the page tab navigation</li>
        <li>Enter your username and password to access your account dashboard</li>
      </ul>
    
      <h3>Step 2: Download Your Green Button Data</h3>
      <ul>
        <li>From your dashboard, select the "Usage" tab</li>
        <li>Look for the "Green Button Download" button (typically under the usage charts")</li>
        <li>Select a date range of about 3+ months. </li>
	<li>Select the CSV format option</li>
        <li>Click "Download" to save your CSV file to your computer</li>
	<li>Take note of where you save the file</li>
      </ul>
    
      <h3>Step 3: Upload Data to Green Button Advisor</h3>
      <ul>
        <li>Navigate to the Green Button Advisor website</li>
        <li>Click the browse button and select the CSV file you downloaed</li>
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
      <h2>Summary Estimate</h2>
      <p>This shows the estimated difference between the DR-TOU-1 and the EV-TOU-5 SDGE plans.</p>
      <table>
        <tbody>
          <tr v-for="(value, key) in overallSummary" :key="key">
            <td>{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </table>

      <h2>Usage by Season and Period</h2>
      <table>
        <thead>
          <tr>
            <th>Season</th>
            <th>Rate Tier</th>
            <th>Total kWh</th>
	    <th>DR-TOU-1 ($/kWh)</th>
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

      <h2>Visualizations</h2>
      <div class="charts-container">
        <!-- Only render if there are datasets to show -->
        <div v-if="chartData.dailyUsage && chartData.dailyUsage.datasets.length > 0">
           <h3>Daily Usage by Rate Period</h3>
           <BarChart :data="chartData.dailyUsage" :options="dailyChartOptions" />
        </div>
         <div v-else-if="!processing && overallSummary"> <!-- Show message if processed but no daily data -->
            <p>No daily usage data to display.</p>
         </div>

        <!-- Only render if there are datasets to show -->
        <div v-if="chartData.monthlyCost && chartData.monthlyCost.datasets.length > 0">
            <h3>Savings by Month</h3>
           <BarChart :data="chartData.monthlyCost" :options="monthlyChartOptions" />
        </div>
         <div v-else-if="!processing && overallSummary"> <!-- Show message if processed but no monthly data -->
            <p>No monthly cost data to display.</p>
         </div>
      </div>

      <div class="disclaimer">
        <h2>Electric Plan Recommendation Disclaimer</h2>
      
        <p>This website provides electric plan recommendations based on your Green Button usage data solely to help you identify potential cost-saving opportunities. Please note:</p>
      
        <ul>
          <li><strong>We are not affiliated with, endorsed by, or officially connected with SDGE or Green Button</strong> in any capacity.</li>
          <li><strong>Our recommendations are estimates only</strong> and should not be considered as official pricing for your past or future electric bills. Electric billing includes other considerations that these estimates are missing.</li>
          <li>Electricity pricing information may not be current or accurate as rates change frequently.</li>
          <li><strong>You are responsible for verifying plan details</strong> directly with your utility provider before making any changes.</li>
          <li>Most utility providers limit plan changes to once per year, so please carefully review all information before committing to a new plan.</li>
        </ul>
      
        <p>By using this service, you acknowledge that we cannot guarantee savings and that you assume all responsibility for decisions made based on the information presented here.</p>
        <p><strong>Your Privacy Matters:</strong> This is a prototype of what we actually hope to build. We plan to make this web app into a comprehensive energy advisor that helps you save energy and money.  Since this is a prototype, your energy data never leaves your device. All analysis happens locally in your browser—this site doesn't store or transmit your personal usage information.</p>
        <p>We're working make this better able to handle up to 12 months for the most accurate analysis. So some charts may look wierd until we finish that effort.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import FileUpload from './components/FileUpload.vue';
import { useEnergyCalculator } from './composables/useEnergyCalculator.js';
import { Bar as BarChart } from 'vue-chartjs'; // Use Bar component
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, TimeScale } from 'chart.js'; // Import necessary elements
import { parseGreenButtonCsv } from './utils/csvParser';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);
const showInstructions = ref(false);
const logoError = ref(false);


const {
  processData,
  processing,
  error,
  overallSummary,
  periodSummary,
  monthlySummary,
  chartData
} = useEnergyCalculator();


const loadSampleData = async () => {
  try {
    processing.value = true;
    error.value = null;

    // Use the imported path
    const response = await fetch(sampleCsvPath);

    if (!response.ok) {
      throw new Error(`Failed to load sample data (${response.status})`);
    }

    const csvText = await response.text();

    // Use our shared parsing module
    const parsedData = await parseGreenButtonCsv(csvText);

    // Handle the parsed data same as file upload
    processData(parsedData);

  } catch (err) {
    console.error('Error loading sample data:', err);
    error.value = err.message;
    processing.value = false;
  }
};

const handleUploadData = (parsedData) => {
  console.log("Received parsed data:", parsedData);
  processData(parsedData);
};


// Chart options (customize as needed)
const dailyChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      title: { display: true, text: 'Date' }
    },
    y: {
      stacked: true,
      title: { display: true, text: 'kWh' }
    }
  }
});

const monthlyChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      title: { display: true, text: 'Month' }
    },
    y: {
      stacked: true,
      title: { display: true, text: 'Cost ($)' }
    }
  }
});

</script>
