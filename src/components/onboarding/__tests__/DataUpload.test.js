import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DataUpload from '../DataUpload.vue'

// Mock the CSV parser
vi.mock('../../../utils/csvParser.js', () => ({
  parseGreenButtonFile: vi.fn()
}))

// Mock fetch for sample data
global.fetch = vi.fn()

describe('DataUpload', () => {
  let wrapper
  let mockParseGreenButtonFile

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks()
    const { parseGreenButtonFile } = await import('../../../utils/csvParser.js')
    mockParseGreenButtonFile = vi.mocked(parseGreenButtonFile)
    global.fetch.mockClear()
    
    wrapper = mount(DataUpload)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Initial Render', () => {
    it('renders the main title and subtitle', () => {
      expect(wrapper.find('h2').text()).toBe('Upload Your Energy Usage Data')
      expect(wrapper.find('.subtitle').text()).toContain('analyze your actual usage')
    })

    it('renders upload option cards', () => {
      const optionCards = wrapper.findAll('.option-card')
      expect(optionCards).toHaveLength(2)
      
      const cardTitles = optionCards.map(card => card.find('h3').text())
      expect(cardTitles).toEqual(['Upload Your Data', 'Try Sample Data'])
    })

    it('starts with file upload method selected by default', () => {
      const fileCard = wrapper.findAll('.option-card')[0]
      expect(fileCard.classes()).toContain('active')
      
      const sampleCard = wrapper.findAll('.option-card')[1]
      expect(sampleCard.classes()).not.toContain('active')
    })

    it('shows file upload section by default', () => {
      expect(wrapper.find('.upload-section').exists()).toBe(true)
      expect(wrapper.find('.sample-section').exists()).toBe(false)
    })

    it('renders back button', () => {
      const backBtn = wrapper.find('.back-btn')
      expect(backBtn.exists()).toBe(true)
      expect(backBtn.text()).toContain('Back to Plan Overview')
    })
  })

  describe('Upload Method Selection', () => {
    it('allows switching to sample data method', async () => {
      const sampleCard = wrapper.findAll('.option-card')[1]
      await sampleCard.trigger('click')
      
      expect(sampleCard.classes()).toContain('active')
      expect(wrapper.find('.sample-section').exists()).toBe(true)
      expect(wrapper.find('.upload-section').exists()).toBe(false)
    })

    it('allows switching back to file upload method', async () => {
      // Switch to sample
      const sampleCard = wrapper.findAll('.option-card')[1]
      await sampleCard.trigger('click')
      
      // Switch back to file
      const fileCard = wrapper.findAll('.option-card')[0]
      await fileCard.trigger('click')
      
      expect(fileCard.classes()).toContain('active')
      expect(wrapper.find('.upload-section').exists()).toBe(true)
      expect(wrapper.find('.sample-section').exists()).toBe(false)
    })
  })

  describe('File Upload Interface', () => {
    it('renders drag-and-drop area', () => {
      const uploadArea = wrapper.find('.upload-area')
      expect(uploadArea.exists()).toBe(true)
      expect(uploadArea.find('.upload-prompt').exists()).toBe(true)
      expect(uploadArea.find('h3').text()).toBe('Drop your CSV file here')
    })

    it('has hidden file input', () => {
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)
      expect(fileInput.attributes('accept')).toBe('.csv')
      expect(fileInput.attributes('style')).toContain('display: none')
    })

    it('triggers file input when upload area is clicked', async () => {
      const fileInput = wrapper.find('input[type="file"]')
      const clickSpy = vi.spyOn(fileInput.element, 'click')
      
      const uploadArea = wrapper.find('.upload-area')
      await uploadArea.trigger('click')
      
      expect(clickSpy).toHaveBeenCalled()
    })

    it('shows file requirements', () => {
      const requirements = wrapper.find('.file-requirements')
      expect(requirements.exists()).toBe(true)
      expect(requirements.text()).toContain('Accepts: .csv files')
    })
  })

  describe('File Handling', () => {
    it('handles file selection through input', async () => {
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      const fileInput = wrapper.find('input[type="file"]')
      
      // Mock the file input change event
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })
      
      await fileInput.trigger('change')
      
      expect(wrapper.vm.selectedFile).toBe(file)
    })

    it('validates file type - accepts CSV files', async () => {
      const csvFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      
      wrapper.vm.handleFile(csvFile)
      
      expect(wrapper.vm.selectedFile).toBe(csvFile)
      expect(wrapper.vm.uploadError).toBe('')
    })

    it('validates file type - rejects non-CSV files', async () => {
      const txtFile = new File(['test data'], 'test.txt', { type: 'text/plain' })
      
      wrapper.vm.handleFile(txtFile)
      
      expect(wrapper.vm.selectedFile).toBeNull()
      expect(wrapper.vm.uploadError).toContain('Please select a CSV file')
    })

    it('validates file size - rejects large files', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv', { type: 'text/csv' })
      
      wrapper.vm.handleFile(largeFile)
      
      expect(wrapper.vm.selectedFile).toBeNull()
      expect(wrapper.vm.uploadError).toContain('File too large')
    })

    it('shows file preview when file is selected', async () => {
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      
      wrapper.vm.selectedFile = file
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.file-preview').exists()).toBe(true)
      expect(wrapper.find('.file-name').text()).toBe('test.csv')
      expect(wrapper.find('.file-size').text()).toMatch(/\d+\s+\w+/)
    })

    it('allows clearing selected file', async () => {
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      wrapper.vm.selectedFile = file
      await wrapper.vm.$nextTick()
      
      const clearBtn = wrapper.find('.clear-btn')
      await clearBtn.trigger('click')
      
      expect(wrapper.vm.selectedFile).toBeNull()
    })
  })

  describe('Drag and Drop', () => {
    it('handles drag over event', async () => {
      const uploadArea = wrapper.find('.upload-area')
      
      // Call the handler directly since DragEvent is not available in jsdom
      wrapper.vm.handleDragOver({ preventDefault: () => {} })
      
      expect(wrapper.vm.isDragOver).toBe(true)
    })

    it('handles drag leave event', async () => {
      wrapper.vm.isDragOver = true
      await wrapper.vm.$nextTick()
      
      wrapper.vm.handleDragLeave({ preventDefault: () => {} })
      
      expect(wrapper.vm.isDragOver).toBe(false)
    })

    it('handles file drop', async () => {
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      
      // Call the handler directly with mock event
      wrapper.vm.handleDrop({
        preventDefault: () => {},
        dataTransfer: { files: [file] }
      })
      
      expect(wrapper.vm.selectedFile).toBe(file)
      expect(wrapper.vm.isDragOver).toBe(false)
    })
  })

  describe('File Processing', () => {
    it('processes valid file successfully', async () => {
      const mockParsedData = { data: [{ usage: 100, date: '2024-01-01' }] }
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      wrapper.vm.selectedFile = file
      await wrapper.vm.$nextTick()
      
      const processBtn = wrapper.find('.process-btn')
      await processBtn.trigger('click')
      
      expect(wrapper.vm.isUploading).toBe(true)
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(mockParseGreenButtonFile).toHaveBeenCalledWith(file)
      expect(wrapper.emitted('data-uploaded')).toBeTruthy()
      expect(wrapper.emitted('data-uploaded')[0]).toEqual([mockParsedData])
    })

    it('handles file processing errors', async () => {
      const errorMessage = 'Invalid file format'
      mockParseGreenButtonFile.mockRejectedValue(new Error(errorMessage))
      
      const file = new File(['invalid,data'], 'test.csv', { type: 'text/csv' })
      wrapper.vm.selectedFile = file
      await wrapper.vm.$nextTick()
      
      const processBtn = wrapper.find('.process-btn')
      await processBtn.trigger('click')
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(wrapper.vm.isUploading).toBe(false)
      expect(wrapper.vm.uploadError).toContain(errorMessage)
      expect(wrapper.find('.upload-error').exists()).toBe(true)
    })

    it('shows processing state during upload', async () => {
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      wrapper.vm.selectedFile = file
      wrapper.vm.isUploading = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.upload-progress').exists()).toBe(true)
      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.find('.upload-progress h3').text()).toBe('Processing your data...')
    })
  })

  describe('Sample Data', () => {
    it('renders sample data section when selected', async () => {
      const sampleCard = wrapper.findAll('.option-card')[1]
      await sampleCard.trigger('click')
      
      expect(wrapper.find('.sample-section').exists()).toBe(true)
      expect(wrapper.find('.sample-info').exists()).toBe(true)
      expect(wrapper.find('.sample-btn').exists()).toBe(true)
    })

    it('shows sample data details', async () => {
      const sampleCard = wrapper.findAll('.option-card')[1]
      await sampleCard.trigger('click')
      
      const details = wrapper.findAll('.detail')
      expect(details.length).toBeGreaterThan(0)
      
      const labels = details.map(detail => detail.find('.label').text())
      expect(labels).toContain('Data Period:')
      expect(labels).toContain('Average Usage:')
      expect(labels).toContain('Home Type:')
    })

    it('loads sample data successfully', async () => {
      const mockCsvData = 'date,usage\n2024-01-01,100'
      const mockParsedData = { data: [{ usage: 100, date: '2024-01-01' }] }
      
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCsvData)
      })
      mockParseGreenButtonFile.mockResolvedValue(mockParsedData)
      
      const sampleCard = wrapper.findAll('.option-card')[1]
      await sampleCard.trigger('click')
      
      const sampleBtn = wrapper.find('.sample-btn')
      await sampleBtn.trigger('click')
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(global.fetch).toHaveBeenCalled()
      expect(mockParseGreenButtonFile).toHaveBeenCalled()
      expect(wrapper.emitted('data-uploaded')).toBeTruthy()
    })

    it('handles sample data loading errors', async () => {
      global.fetch.mockRejectedValue(new Error('Failed to fetch'))
      
      const sampleCard = wrapper.findAll('.option-card')[1]
      await sampleCard.trigger('click')
      
      const sampleBtn = wrapper.find('.sample-btn')
      await sampleBtn.trigger('click')
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(wrapper.vm.uploadError).toContain('Failed to load sample data')
    })
  })

  describe('Instructions', () => {
    it('has toggle for showing/hiding instructions', () => {
      const instructionsToggle = wrapper.find('.instructions-toggle')
      expect(instructionsToggle.exists()).toBe(true)
      expect(instructionsToggle.text()).toContain('Show Download Instructions')
    })

    it('toggles instructions panel', async () => {
      expect(wrapper.find('.instructions-panel').exists()).toBe(false)
      
      const instructionsToggle = wrapper.find('.instructions-toggle')
      await instructionsToggle.trigger('click')
      
      expect(wrapper.find('.instructions-panel').exists()).toBe(true)
      expect(instructionsToggle.text()).toContain('Hide Download Instructions')
    })

    it('shows detailed download instructions', async () => {
      const instructionsToggle = wrapper.find('.instructions-toggle')
      await instructionsToggle.trigger('click')
      
      const steps = wrapper.findAll('.step')
      expect(steps.length).toBeGreaterThan(0)
      
      const stepNumbers = wrapper.findAll('.step-number')
      expect(stepNumbers[0].text()).toBe('1')
      expect(stepNumbers[1].text()).toBe('2')
      expect(stepNumbers[2].text()).toBe('3')
    })

    it('includes helpful tips', async () => {
      const instructionsToggle = wrapper.find('.instructions-toggle')
      await instructionsToggle.trigger('click')
      
      const tips = wrapper.find('.tips')
      expect(tips.exists()).toBe(true)
      expect(tips.find('h5').text()).toContain('Tips for Best Results')
      
      const tipItems = tips.findAll('li')
      expect(tipItems.length).toBeGreaterThan(0)
    })
  })

  describe('Navigation', () => {
    it('emits back event when back button is clicked', async () => {
      const backBtn = wrapper.find('.back-btn')
      await backBtn.trigger('click')
      
      expect(wrapper.emitted('back')).toBeTruthy()
      expect(wrapper.emitted('back')).toHaveLength(1)
    })

    it('shows process button when file is selected', async () => {
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      wrapper.vm.selectedFile = file
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.process-btn').exists()).toBe(true)
      expect(wrapper.find('.process-btn').text()).toContain('Analyze This File')
    })
  })

  describe('Error Handling', () => {
    it('shows error message when there is an error', async () => {
      wrapper.vm.uploadError = 'Test error message'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.upload-error').exists()).toBe(true)
      expect(wrapper.find('.upload-error h3').text()).toBe('Upload Error')
      expect(wrapper.find('.upload-error p').text()).toBe('Test error message')
    })

    it('allows clearing error and retrying', async () => {
      wrapper.vm.uploadError = 'Test error'
      await wrapper.vm.$nextTick()
      
      const retryBtn = wrapper.find('.retry-btn')
      await retryBtn.trigger('click')
      
      expect(wrapper.vm.uploadError).toBe('')
    })

    it('applies error styling to upload area', async () => {
      wrapper.vm.uploadError = 'Test error'
      await wrapper.vm.$nextTick()
      
      const uploadArea = wrapper.find('.upload-area')
      expect(uploadArea.classes()).toContain('error')
    })
  })

  describe('Utility Functions', () => {
    it('formats file size correctly', () => {
      expect(wrapper.vm.formatFileSize(0)).toBe('0 Bytes')
      expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB')
      expect(wrapper.vm.formatFileSize(1048576)).toBe('1 MB')
      expect(wrapper.vm.formatFileSize(1536)).toBe('1.5 KB')
    })
  })
})