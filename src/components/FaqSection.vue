<template>
  <div class="faq-container">
    <h2>Frequently Asked Questions</h2>

    <div v-for="(faq, index) in faqs" :key="index" class="faq-item">
      <div 
        class="faq-question" 
        @click="toggleFaq(index)" 
        :class="{ 'active': openFaq === index }"
      >
        <span>{{ faq.question }}</span>
        <span class="toggle-icon">{{ openFaq === index ? '−' : '+' }}</span>
      </div>
      <div class="faq-answer" v-show="openFaq === index">
        <p v-html="faq.answer"></p>
      </div>
    </div>

    <div class="back-button">
      <button @click="$emit('close')">Back to Analyzer</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const openFaq = ref(null);

const toggleFaq = (index) => {
  openFaq.value = openFaq.value === index ? null : index;
};

const faqs = [
  {
    question: "What is the Green Button Advisor?",
    answer: "The Green Button Advisor is a tool that helps SDGE customers analyze their energy usage data and compare different rate plans to find potential cost savings."
  },
  {
    question: "How do I get my Green Button data?",
    answer: "You can download your Green Button data from your SDGE account dashboard. Go to the 'Energy Usage' section, find the 'Green Button' option, and select 'Download My Data' with hourly intervals. For detailed instructions, click 'Show Instructions' on our main page."
  },
  {
    question: "How much data should I analyze?",
    answer: "For the most accurate results, we recommend analyzing at least 3 months of hourly interval data. This provides enough usage patterns to make reliable comparisons between rate plans."
  },
  {
    question: "Are my energy usage data and results saved?",
    answer: "No, your data is processed entirely in your browser and is never sent to or stored on our servers. Once you close or refresh the page, all data is cleared."
  },
  {
    question: "How accurate are the savings estimates?",
    answer: "Our estimates are based on historical usage patterns and current rate information. Actual savings may vary due to changes in your energy usage, updated utility rates, or other factors. We recommend using these estimates as a guide rather than exact predictions."
  },
  {
    question: "What rate plans are compared?",
    answer: "Currently, the Green Button Advisor compares SDGE's EV-TOU-5 and DR-TOU-1 rate plans. We may add more plans in future updates."
  },
  {
    question: "I'm getting an error when analyzing my file. What should I do?",
    answer: "Make sure you're analyzing a CSV file downloaded from SDGE's Green Button 'Download My Data' option with hourly intervals. XML files or data from other sources may not work properly. If you continue to have issues, try downloading a fresh copy of your data from SDGE."
  },
  {
    question: "How do I switch to a new rate plan if I find potential savings?",
    answer: "If our analysis indicates potential savings, you can contact SDGE directly to discuss switching your rate plan. Remember to verify current rates and terms with SDGE, as they may have changed since our last update."
  }
];

defineEmits(['close']);
</script>

<style scoped>
.faq-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.faq-item {
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.faq-question {
  padding: 15px;
  background-color: #f8f8f8;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-question.active {
  background-color: #e8e8e8;
}

.toggle-icon {
  font-size: 20px;
  font-weight: bold;
}

.faq-answer {
  padding: 15px;
  background-color: white;
  border-top: 1px solid #eee;
}

.back-button {
  margin-top: 30px;
  text-align: center;
}

.back-button button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.back-button button:hover {
  background-color: #3e8e41;
}
</style>

