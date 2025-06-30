<template>
  <div id="app">
    <div class="header-container">
      <img
        src="/Logo.svg"
        class="site-logo"
        @error="logoError = true"
        v-if="!logoError"
        alt="GreenButton Advisor Logo"
      />
      <div class="title-wrapper">
        <h1 class="title">GreenButton Advisor</h1>
      </div>
      <ThemeToggle />
    </div>
    <h2 class="subtitle">Let's make the world a bit greener</h2>
    <p class="motto">We'll start by saving you some green by finding the best SDGE electrical plan for you.</p>
    <hr/>
    <!-- Onboarding Wizard -->
    <div v-if="currentPage === 'onboarding'">
      <OnboardingWizard 
        :recommended-plans="selectedPlans"
        :is-processing="updating"
        :ev-ownership="hasEV"
        @complete="handleOnboardingComplete"
        @data-analyzed="handleAnalyzeData"
        @plans-selected="handleOnboardingPlansSelected"
        @ev-eligibility-changed="handleEVEligibilityChange"
        @get-recommendations="handleGetRecommendations"
      />
    </div>

    <!-- Legacy Plans Screen (for existing users) -->
    <div v-if="currentPage === 'plans'">
      <PlanSelector 
        :available-plans="getSelectablePlans()"
        :has-usage-data="usageData.length > 0"
        :is-recommendation-mode="isRecommendationMode"
        @plan-toggled="handlePlanToggle"
        @plans-selected="goToMain"
        @ev-eligibility-changed="handleEVEligibilityChange"
        @get-recommendations="handleGetRecommendations"
      />
    </div>

    <!-- Current App Content -->
    <div v-else-if="currentPage === 'main'">

      <div v-if="!overallComparison && !processing">
        <h3>Compare {{ selectedPlansText }} and see each plan's costs for your usage</h3>
	<p>When you are ready to see the estimated cost difference for your home, analyze your GreenButton data.</p>
        <FileUpload @file-parsed="handleAnalyzeData" />
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

      <div v-if="showInstructions && !overallComparison" class="instructions-panel">
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
        <h3>Step 3: Analyze Data with GreenButton Advisor</h3>
        <ul>
          <li>Navigate to the GreenButton Advisor website</li>
          <li>Click the browse button and select the CSV file you downloaded</li>
        </ul>
        <h3>Troubleshooting Tips</h3>
        <ul>
          <li><strong>File Format Issues?</strong> Ensure you've selected the CSV format, not XML</li>
          <li><strong>Data Too Limited?</strong> For best results, analyze at least 3 months of usage data</li>
          <li><strong>Processing Errors?</strong> Try downloading a fresh copy of your data</li>
        </ul>
      </div>

      <div v-if="error">
        <p style="color: red;">Error: {{ error }}</p>
      </div>

      <div v-if="overallComparison && !processing && !error">
        <ComparisonResults 
          :overall-comparison="overallComparison"
          :period-comparisons="periodComparisons"
          :monthly-comparisons="monthlyComparisons"
          :chart-data="chartData"
          :has-data-been-modified="hasDataBeenModified"
          :updating="updating"
          @update-monthly-usage="updateMonthlyUsage"
          @update-period-usage="updatePeriodUsage"
          @reset-usage="resetUsageToOriginal"
        />
      </div>

      <button @click="goToPlans" class="sample-data-btn">Back</button>
      <button @click="startOver" class="sample-data-btn">Start Over</button>
    </div>

    <!-- Results from Onboarding -->
    <div v-else-if="currentPage === 'results'">
      <div v-if="processing">
        <p>Processing...</p>
      </div>

      <div v-if="error">
        <p style="color: red;">Error: {{ error }}</p>
      </div>

      <div v-if="overallComparison && !processing && !error">
        <ComparisonResults 
          :overall-comparison="overallComparison"
          :period-comparisons="periodComparisons"
          :monthly-comparisons="monthlyComparisons"
          :chart-data="chartData"
          :has-data-been-modified="hasDataBeenModified"
          :updating="updating"
          @update-monthly-usage="updateMonthlyUsage"
          @update-period-usage="updatePeriodUsage"
          @reset-usage="resetUsageToOriginal"
        />
      </div>

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
import { ref, computed } from 'vue';
import FileUpload from './components/FileUpload.vue';
import PlanSelector from './components/PlanSelector.vue';
import ComparisonResults from './components/ComparisonResults.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import OnboardingWizard from './components/OnboardingWizard.vue';
import { useMultiPlanCalculator } from './composables/useMultiPlanCalculator.js';
import { Bar as BarChart } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, TimeScale } from 'chart.js';
import { parseGreenButtonCsv } from './utils/csvParser';
import sampleCsvPath from './assets/sample.csv?url';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// Define reactive variables
const currentPage = ref('onboarding'); // Start with onboarding wizard
const showInstructions = ref(false);
const logoError = ref(false);

// Multi-plan calculator composable
const {
  processData,
  processing,
  error,
  selectedPlans,
  overallComparison,
  periodComparisons,
  monthlyComparisons,
  chartData,
  setSelectedPlans,
  getSelectablePlans,
  updateMonthlyUsage,
  updatePeriodUsage,
  resetUsageToOriginal,
  hasDataBeenModified,
  updating,
  hasEV,
  isRecommendationMode,
  setEVEligibility,
  getRecommendedPlans,
  applyRecommendedPlans,
  usageData
} = useMultiPlanCalculator();

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

// Handle onboarding completion
const handleOnboardingComplete = (data) => {
  console.log('App: Received onboarding completion data:', data);
  if (data.plans && data.plans.length === 2) {
    console.log('App: Setting selected plans:', data.plans);
    setSelectedPlans(data.plans);
  }
  if (data.data) {
    processData(data.data);
  }
  currentPage.value = 'results';
};

// Handle onboarding plan selection
const handleOnboardingPlansSelected = (plans) => {
  setSelectedPlans(plans);
};

// Handle plan selection toggle
const handlePlanToggle = (planType) => {
  const currentSelected = selectedPlans.value;
  const isSelected = currentSelected.includes(planType);
  
  if (isSelected) {
    // Remove from selection
    const newSelection = currentSelected.filter(p => p !== planType);
    if (newSelection.length === 2) {
      setSelectedPlans(newSelection);
    } else if (newSelection.length === 1) {
      // Only one plan left selected - keep it selected but don't force a second plan
      setSelectedPlans([newSelection[0]]);
    } else {
      // No plans selected - reset to empty selection
      setSelectedPlans([]);
    }
  } else {
    // Add to selection
    if (currentSelected.length === 0) {
      // First plan selected
      setSelectedPlans([planType]);
    } else if (currentSelected.length === 1) {
      // Second plan selected - now we have a valid comparison
      setSelectedPlans([...currentSelected, planType]);
    } else {
      // Already have 2 plans - replace the first one with the new selection
      setSelectedPlans([planType, currentSelected[1]]);
    }
  }
};

// Computed property for selected plans text
const selectedPlansText = computed(() => {
  if (selectedPlans.value.length === 2) {
    return `the selected plans (${selectedPlans.value[0]} and ${selectedPlans.value[1]})`;
  }
  return 'your selected plans';
});

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

// Handle analyzed data
const handleAnalyzeData = (parsedData) => {
  console.log("Received parsed data:", parsedData);
  processData(parsedData);
};

// Handle EV eligibility change
const handleEVEligibilityChange = (eligibility) => {
  setEVEligibility(eligibility);
};

// Handle get recommendations
const handleGetRecommendations = async () => {
  if (usageData.value.length === 0) {
    error.value = 'Please analyze your usage data first to get recommendations';
    return;
  }
  
  try {
    const recommended = await applyRecommendedPlans();
    if (recommended) {
      console.log('Recommended plans:', recommended);
      // For onboarding, we don't automatically proceed to main view
      // The user will click "Start Comparison" when ready
    }
  } catch (err) {
    console.error('Error applying recommendations:', err);
    error.value = 'Failed to generate recommendations: ' + err.message;
  }
};

</script>

<style scoped>
h2, h3, h4, h5, h6 {
  padding-top: 0.25rem;
  margin: 0;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
  margin: 0;
}

.header-container {
  display: flex;
  align-items: center; 
  padding: 2rem;
  width: 100%;
  max-width: 1280px; 
  margin: 0 auto;
  min-height: 120px;
  position: relative;
}

.site-logo {
  width: 100px;
  height: auto;
  flex-shrink: 0; 
  max-width: 20vw;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center; 
  justify-content: center; 
  flex: 1; 
  text-align: center;
  width: 100%;
}

.title {
  font-size: 2.5em;
  margin: 0;
  line-height: 1.2;
  color: var(--title-color);
}

.subtitle {
  font-size: 1.5em;
  margin: 0.5rem 0;
  font-weight: 400;
}

.motto {
  font-size: 1.1em;
  margin: 0.5rem 0;
}

/* Mobile responsive design */
@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    padding: 1rem;
  }

  .site-logo {
    position: static;
    margin-bottom: 1rem;
    width: 80px; /* Adjust as needed */
    max-width: 30vw;
  }

  .title-wrapper {
    flex: none; 
    margin-right: 0;
    max-width: 100%;
  }

  .title {
    font-size: 2em;
  }

  .subtitle {
    font-size: 1.2em;
  }

  .motto {
    font-size: 1em;
    padding: 0 1rem;
  }

  #app {
    padding: 1rem; /* Reduce padding on small screens */
  }
}


button {
  /* Inherits global button styles from :root */
  margin-top: 20px; /* Adds spacing above button */
}
</style>
