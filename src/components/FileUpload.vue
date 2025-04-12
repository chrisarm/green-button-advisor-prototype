<template>
  <div>
    <label for="csvFile">Upload Energy Usage CSV:</label>
    <input type="file" id="csvFile" @change="handleFileUpload" accept=".csv" />
  </div>
</template>
<script setup>
import Papa from 'papaparse';
import { defineEmits, ref } from 'vue';

const showInstructions = ref(false);

const emit = defineEmits(['file-parsed', 'file-error']);
const errorMessage = ref('');

const expectedHeaderPrefixes = [
  'Name',
  'Address',
  'Account',
  'Disclaimer',
  'Title',
  'Resource',
  'Meter',
  'Interval',
  'Reading',
  'Reading',
  'Total',
  'Total',
  'UOM',
  'Meter'  // Last line needs more validation as it's the column headers
];

const handleFileUpload = (event) => {
  errorMessage.value = '';
  const file = event.target.files[0];

  // Check if file exists and is CSV
  if (!file) {
    return;
  }

  if (!file.name.endsWith('.csv')) {
    errorMessage.value = 'Please upload a CSV file only. See instructions.';
    emit('file-error', errorMessage.value);
    return;
  }

  // First read the file as text to check headers
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const lines = content.split('\n').slice(0, 14);

    // Check if headers match expected format (only first word)
    let isValidFormat = true;
    for (let i = 0; i < Math.min(lines.length, expectedHeaderPrefixes.length); i++) {
      // For the last line (column headers), check more thoroughly
      const expectedWord = expectedHeaderPrefixes[i].trim();
      const firstWord = lines[i].split(',')[0].trim().split(' ')[0].trim();
      const expectedFirstWord = expectedWord;

      if (firstWord !== expectedFirstWord) {
        isValidFormat = false;
        console.error("Error: Missing headers found! {expectedWord}")
        console.error(expectedWord)
        break;
      }
    }

    if (!isValidFormat) {
      errorMessage.value = 'The CSV file does not match the expected Green Button format.';
      emit('file-error', errorMessage.value);
      return;
    }

    // If headers are valid, proceed with parsing
    Papa.parse(file, {
      skipFirstNLines: 13,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Parsed Data:", results.data);
        emit('file-parsed', results.data);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        errorMessage.value = `Error parsing CSV: ${error.message}`;
        emit('file-error', errorMessage.value);
      }
    });
  };

  reader.onerror = () => {
    errorMessage.value = 'Error reading the file.';
    emit('file-error', errorMessage.value);
  };

  reader.readAsText(file);
};

</script>
