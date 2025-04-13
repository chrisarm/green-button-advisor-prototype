<template>
  <div>
    <label for="csvFile">Upload Energy Usage CSV:</label>
    <input type="file" id="csvFile" @change="handleFileUpload" accept=".csv" />
  </div>
</template>
<script setup>
import { parseGreenButtonFile } from '../utils/csvParser';
import Papa from 'papaparse';
import { defineEmits, ref } from 'vue';

const showInstructions = ref(false);

const emit = defineEmits(['file-parsed', 'file-error']);
const errorMessage = ref('');

const handleFileUpload = async (event) => {
  errorMessage.value = '';
  const file = event.target.files[0];

  try {
    if (!file) return;

    const parsedData = await parseGreenButtonFile(file);
    emit('file-parsed', parsedData); // Make sure this emits just the parsed data
  } catch (error) {
    errorMessage.value = error.message;
    emit('file-error', errorMessage.value);
  }
};
</script>
