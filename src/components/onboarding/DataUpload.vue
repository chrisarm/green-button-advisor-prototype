<template>
  <div class="data-upload">
    <div class="header">
      <h2>Upload Your Energy Usage Data</h2>
      <p class="subtitle">We'll analyze your actual usage to find the best plan for you</p>
    </div>

    <!-- Upload Options -->
    <div class="upload-options">
      <div class="option-card" :class="{ active: uploadMethod === 'file' }" @click="uploadMethod = 'file'">
        <div class="option-icon">📁</div>
        <h3>Upload Your Data</h3>
        <p>Upload your SDGE Green Button CSV file for the most accurate analysis</p>
        <div class="option-badge">Recommended</div>
      </div>
      
      <div class="option-card" :class="{ active: uploadMethod === 'sample' }" @click="uploadMethod = 'sample'">
        <div class="option-icon">📊</div>
        <h3>Try Sample Data</h3>
        <p>See how the comparison works with example data before uploading yours</p>
        <div class="option-badge sample">Demo</div>
      </div>
    </div>

    <!-- File Upload Section -->
    <div v-if="uploadMethod === 'file'" class="upload-section">
      <div class="upload-area" 
           :class="{ 
             'drag-over': isDragOver, 
             'has-file': selectedFile,
             'uploading': isUploading,
             'error': uploadError 
           }"
           @drop="handleDrop"
           @dragover="handleDragOver"
           @dragleave="handleDragLeave"
           @click="triggerFileInput">
        
        <input 
          ref="fileInput"
          type="file" 
          accept=".csv"
          @change="handleFileSelect"
          style="display: none"
        />
        
        <div v-if="!selectedFile && !isUploading" class="upload-prompt">
          <div class="upload-icon">📤</div>
          <h3>Drop your CSV file here</h3>
          <p>or <span class="link-text">click to browse</span></p>
          <div class="file-requirements">
            <small>Accepts: .csv files from SDGE Green Button download</small>
          </div>
        </div>
        
        <div v-if="selectedFile && !isUploading" class="file-preview">
          <div class="file-icon">📄</div>
          <div class="file-info">
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
          </div>
          <button @click.stop="clearFile" class="clear-btn">✕</button>
        </div>
        
        <div v-if="isUploading" class="upload-progress">
          <div class="spinner"></div>
          <h3>Processing your data...</h3>
          <p>This may take a few moments</p>
        </div>
        
        <div v-if="uploadError" class="upload-error">
          <div class="error-icon">⚠️</div>
          <h3>Upload Error</h3>
          <p>{{ uploadError }}</p>
          <button @click="clearError" class="retry-btn">Try Again</button>
        </div>
      </div>
      
      <div v-if="selectedFile && !isUploading && !uploadError" class="upload-actions">
        <button @click="processFile" class="process-btn">
          Analyze This File
          <span class="arrow">→</span>
        </button>
      </div>
      
      <!-- Instructions -->
      <div class="instructions">
        <button @click="showInstructions = !showInstructions" class="instructions-toggle">
          {{ showInstructions ? 'Hide' : 'Show' }} Download Instructions
        </button>
        
        <div v-if="showInstructions" class="instructions-panel">
          <h4>How to Download Your SDGE Data</h4>
          <div class="instruction-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h5>Login to SDGE</h5>
                <p>Go to <a href="https://sdge.com" target="_blank" rel="noopener">sdge.com</a> and click "My Energy Center"</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h5>Find Usage Data</h5>
                <p>Navigate to the "Usage" tab in your account dashboard</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h5>Download Green Button Data</h5>
                <p>Look for "Green Button Download" and select <strong>CSV format</strong> with at least 3 months of data</p>
              </div>
            </div>
          </div>
          
          <div class="tips">
            <h5>💡 Tips for Best Results</h5>
            <ul>
              <li>Download at least 3-6 months of data for accurate analysis</li>
              <li>Make sure to select CSV format (not XML)</li>
              <li>Include both summer and winter months if possible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Sample Data Section -->
    <div v-if="uploadMethod === 'sample'" class="sample-section">
      <div class="sample-info">
        <div class="sample-icon">📊</div>
        <h3>Sample Household Data</h3>
        <p>We'll use example data from a typical San Diego household to demonstrate how plan comparison works.</p>
        
        <div class="sample-details">
          <div class="detail">
            <span class="label">Data Period:</span>
            <span class="value">6 months</span>
          </div>
          <div class="detail">
            <span class="label">Average Usage:</span>
            <span class="value">~850 kWh/month</span>
          </div>
          <div class="detail">
            <span class="label">Home Type:</span>
            <span class="value">Single family, AC usage</span>
          </div>
        </div>
      </div>
      
      <button @click="loadSampleData" class="sample-btn" :disabled="isUploading">
        <span v-if="!isUploading">Use Sample Data</span>
        <span v-else>Loading...</span>
        <span v-if="!isUploading" class="arrow">→</span>
      </button>
    </div>

    <!-- Back Navigation -->
    <div class="navigation">
      <button @click="$emit('back')" class="back-btn">
        <span class="arrow">←</span>
        Back to Plan Overview
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { parseGreenButtonFile } from '../../utils/csvParser.js'
import sampleCsvPath from '../../assets/sample.csv?url'

const emit = defineEmits(['back', 'data-uploaded'])

const uploadMethod = ref('file')
const selectedFile = ref(null)
const isUploading = ref(false)
const uploadError = ref('')
const isDragOver = ref(false)
const showInstructions = ref(false)
const fileInput = ref(null)

const handleDragOver = (e) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  isDragOver.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragOver.value = false
  
  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFile(files[0])
  }
}

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    handleFile(file)
  }
}

const handleFile = (file) => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    uploadError.value = 'Please select a CSV file. Make sure you downloaded the CSV format from SDGE, not XML.'
    return
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    uploadError.value = 'File too large. Please ensure your file is under 10MB.'
    return
  }
  
  selectedFile.value = file
  uploadError.value = ''
}

const clearFile = () => {
  selectedFile.value = null
  uploadError.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const clearError = () => {
  uploadError.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const processFile = async () => {
  if (!selectedFile.value) return
  
  isUploading.value = true
  uploadError.value = ''
  
  try {
    const parsedData = await parseGreenButtonFile(selectedFile.value)
    emit('data-uploaded', parsedData)
  } catch (error) {
    console.error('File processing error:', error)
    uploadError.value = error.message || 'Failed to process the file. Please check that it\'s a valid SDGE Green Button CSV file.'
    isUploading.value = false
  }
}

const loadSampleData = async () => {
  isUploading.value = true
  uploadError.value = ''
  
  try {
    const response = await fetch(sampleCsvPath)
    if (!response.ok) {
      throw new Error(`Failed to load sample data (${response.status})`)
    }
    const csvText = await response.text()
    
    // Create a File object from the CSV text to use same parsing logic
    const blob = new Blob([csvText], { type: 'text/csv' })
    const file = new File([blob], 'sample-data.csv', { type: 'text/csv' })
    
    const parsedData = await parseGreenButtonFile(file)
    emit('data-uploaded', parsedData)
  } catch (error) {
    console.error('Sample data loading error:', error)
    uploadError.value = 'Failed to load sample data. Please try again or upload your own file.'
    isUploading.value = false
  }
}
</script>

<style scoped>
.data-upload {
  max-width: 800px;
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

.upload-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}

.option-card {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--input-bg);
  position: relative;
}

.option-card:hover {
  border-color: var(--link-color);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 108, 255, 0.15);
}

.option-card.active {
  border-color: var(--link-color);
  background: rgba(100, 108, 255, 0.05);
  box-shadow: 0 4px 20px rgba(100, 108, 255, 0.2);
}

.option-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.option-card h3 {
  margin: 0 0 10px 0;
  color: var(--text-color);
}

.option-card p {
  margin: 0;
  color: var(--text-color);
  opacity: 0.8;
  font-size: 0.9em;
  line-height: 1.4;
}

.option-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: var(--success-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
}

.option-badge.sample {
  background: #ff9800;
}

.upload-section {
  margin-bottom: 40px;
}

.upload-area {
  border: 3px dashed var(--border-color);
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--input-bg);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover:not(.uploading) {
  border-color: var(--link-color);
  background: rgba(100, 108, 255, 0.02);
}

.upload-area.drag-over {
  border-color: var(--link-color);
  background: rgba(100, 108, 255, 0.05);
  transform: scale(1.02);
}

.upload-area.has-file {
  border-color: var(--success-color);
  border-style: solid;
  background: rgba(76, 175, 80, 0.05);
}

.upload-area.uploading {
  border-color: var(--link-color);
  background: rgba(100, 108, 255, 0.05);
  cursor: default;
}

.upload-area.error {
  border-color: var(--error-color);
  background: rgba(244, 67, 54, 0.05);
}

.upload-prompt h3 {
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.upload-prompt p {
  margin: 0 0 20px 0;
  color: var(--text-color);
  opacity: 0.7;
}

.link-text {
  color: var(--link-color);
  font-weight: 600;
}

.upload-icon {
  font-size: 3em;
  margin-bottom: 20px;
  opacity: 0.7;
}

.file-requirements {
  margin-top: 15px;
}

.file-requirements small {
  color: var(--text-color);
  opacity: 0.6;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  background: var(--button-bg);
  padding: 15px 20px;
  border-radius: 8px;
  border: 1px solid var(--success-color);
}

.file-icon {
  font-size: 2em;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: 600;
  color: var(--text-color);
}

.file-size {
  font-size: 0.8em;
  color: var(--text-color);
  opacity: 0.7;
}

.clear-btn {
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
}

.upload-progress h3, .upload-error h3 {
  margin: 15px 0 8px 0;
  color: var(--text-color);
}

.upload-progress p, .upload-error p {
  margin: 0;
  color: var(--text-color);
  opacity: 0.7;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--link-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 2.5em;
  margin-bottom: 15px;
}

.retry-btn, .process-btn, .sample-btn {
  background: linear-gradient(135deg, var(--link-color), #535bf2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}

.process-btn, .sample-btn {
  font-size: 1.1em;
  padding: 15px 30px;
}

.retry-btn:hover, .process-btn:hover, .sample-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 108, 255, 0.3);
}

.upload-actions {
  text-align: center;
  margin-top: 20px;
}

.sample-section {
  text-align: center;
  padding: 40px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 40px;
}

.sample-icon {
  font-size: 3em;
  margin-bottom: 20px;
}

.sample-info h3 {
  margin: 0 0 15px 0;
  color: var(--text-color);
}

.sample-info p {
  margin: 0 0 25px 0;
  color: var(--text-color);
  opacity: 0.8;
  line-height: 1.5;
}

.sample-details {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-size: 0.8em;
  color: var(--text-color);
  opacity: 0.7;
}

.value {
  font-weight: 600;
  color: var(--link-color);
}

.instructions {
  margin-top: 30px;
}

.instructions-toggle {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--link-color);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.instructions-toggle:hover {
  background: var(--link-color);
  color: white;
}

.instructions-panel {
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 25px;
  margin-top: 15px;
  text-align: left;
}

.instructions-panel h4 {
  margin: 0 0 20px 0;
  color: var(--link-color);
}

.instruction-steps {
  margin-bottom: 25px;
}

.step {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.step-number {
  background: var(--link-color);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h5 {
  margin: 0 0 5px 0;
  color: var(--text-color);
}

.step-content p {
  margin: 0;
  color: var(--text-color);
  opacity: 0.8;
  font-size: 0.9em;
  line-height: 1.4;
}

.step-content a {
  color: var(--link-color);
  text-decoration: none;
}

.tips h5 {
  margin: 0 0 10px 0;
  color: var(--text-color);
}

.tips ul {
  margin: 0;
  padding-left: 20px;
}

.tips li {
  color: var(--text-color);
  opacity: 0.8;
  font-size: 0.9em;
  margin: 5px 0;
  line-height: 1.4;
}

.navigation {
  text-align: center;
}

.back-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover {
  border-color: var(--link-color);
  color: var(--link-color);
}

.arrow {
  transition: transform 0.3s ease;
}

.process-btn:hover .arrow, .sample-btn:hover .arrow {
  transform: translateX(5px);
}

.back-btn:hover .arrow {
  transform: translateX(-5px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .upload-options {
    grid-template-columns: 1fr;
  }
  
  .upload-area {
    padding: 40px 20px;
  }
  
  .sample-details {
    flex-direction: column;
    gap: 15px;
  }
  
  .step {
    flex-direction: column;
    gap: 10px;
  }
  
  .step-number {
    align-self: flex-start;
  }
}
</style>