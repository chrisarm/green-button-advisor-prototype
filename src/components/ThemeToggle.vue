<template>
  <div class="theme-toggle">
    <div class="theme-switch">
      <span class="theme-icon sun">☀️</span>
      <label class="switch">
        <input 
          type="checkbox" 
          :checked="currentTheme === 'dark'" 
          @change="toggleTheme"
        />
        <span class="slider"></span>
      </label>
      <span class="theme-icon moon">🌙</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentTheme = ref('light')

const updateTheme = () => {
  document.documentElement.setAttribute('data-theme', currentTheme.value)
  localStorage.setItem('theme', currentTheme.value)
}

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  updateTheme()
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  currentTheme.value = savedTheme
  updateTheme()
})
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-icon {
  font-size: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--link-color);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.slider:hover {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}
</style>