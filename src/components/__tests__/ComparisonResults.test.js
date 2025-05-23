import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ComparisonResults from '../ComparisonResults.vue'

// Mock Chart.js
vi.mock('vue-chartjs', () => ({
  Bar: {
    name: 'Bar',
    props: ['data', 'options'],
    template: '<div data-testid="mock-chart"></div>'
  }
}))

describe('ComparisonResults Reset Functionality', () => {
  const mockProps = {
    overallComparison: {
      plan1: { name: 'TOU-DR1', totalCost: '100.00', averageRate: '0.25000' },
      plan2: { name: 'EV-TOU-5', totalCost: '90.00', averageRate: '0.23000' },
      totalKWh: '400.00',
      totalSavings: '10.00',
      savingsDirection: 'EV-TOU-5',
      monthsAnalyzed: 3
    },
    periodComparisons: [
      {
        season: 'summer',
        period: 'Peak',
        consumption: 100.0,
        plan1Cost: '25.00',
        plan2Cost: '22.00',
        costDifference: '3.00'
      }
    ],
    monthlyComparisons: [
      {
        month: '2024-06',
        consumption: 150.0,
        plan1TotalCost: '40.00',
        plan2TotalCost: '35.00',
        monthlySavings: '5.00'
      }
    ],
    chartData: {
      dailyUsage: { labels: [], datasets: [] },
      monthlyComparison: { labels: [], datasets: [] },
      monthlySavings: { labels: [], datasets: [] }
    }
  }

  it('should render reset button when data has been modified', () => {
    const wrapper = mount(ComparisonResults, {
      props: {
        ...mockProps,
        hasDataBeenModified: true
      }
    })

    const resetButtonPeriod = wrapper.find('[data-testid="reset-usage-button-period"]')
    const resetButtonMonthly = wrapper.find('[data-testid="reset-usage-button-monthly"]')
    
    expect(resetButtonPeriod.exists()).toBe(true)
    expect(resetButtonMonthly.exists()).toBe(true)
    expect(resetButtonPeriod.text()).toContain('Reset Usage')
    expect(resetButtonMonthly.text()).toContain('Reset Usage')
  })

  it('should not render reset button when data has not been modified', () => {
    const wrapper = mount(ComparisonResults, {
      props: {
        ...mockProps,
        hasDataBeenModified: false
      }
    })

    const resetButtonPeriod = wrapper.find('[data-testid="reset-usage-button-period"]')
    const resetButtonMonthly = wrapper.find('[data-testid="reset-usage-button-monthly"]')
    
    expect(resetButtonPeriod.exists()).toBe(false)
    expect(resetButtonMonthly.exists()).toBe(false)
  })

  it('should emit reset-usage event when reset button is clicked', async () => {
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    const wrapper = mount(ComparisonResults, {
      props: {
        ...mockProps,
        hasDataBeenModified: true
      }
    })

    const resetButton = wrapper.find('[data-testid="reset-usage-button-period"]')
    await resetButton.trigger('click')

    expect(wrapper.emitted('reset-usage')).toBeTruthy()
    expect(wrapper.emitted('reset-usage')).toHaveLength(1)
    
    confirmSpy.mockRestore()
  })

  it('should show confirmation message when resetting', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    const wrapper = mount(ComparisonResults, {
      props: {
        ...mockProps,
        hasDataBeenModified: true
      }
    })

    const resetButton = wrapper.find('[data-testid="reset-usage-button-monthly"]')
    await resetButton.trigger('click')

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to reset all usage values to the original data? This will undo all your edits.'
    )
    
    confirmSpy.mockRestore()
  })

  it('should not emit event if user cancels confirmation', async () => {
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    const wrapper = mount(ComparisonResults, {
      props: {
        ...mockProps,
        hasDataBeenModified: true
      }
    })

    const resetButton = wrapper.find('[data-testid="reset-usage-button-period"]')
    await resetButton.trigger('click')

    expect(wrapper.emitted('reset-usage')).toBeFalsy()
    
    confirmSpy.mockRestore()
  })

  it('should have proper styling for reset button', () => {
    const wrapper = mount(ComparisonResults, {
      props: {
        ...mockProps,
        hasDataBeenModified: true
      }
    })

    const resetButton = wrapper.find('[data-testid="reset-usage-button-period"]')
    expect(resetButton.classes()).toContain('reset-button-small')
  })

  it('should show updating indicator when updating is true', () => {
    const wrapper = mount(ComparisonResults, {
      props: {
        ...mockProps,
        updating: true
      }
    })

    const updatingOverlay = wrapper.find('.updating-overlay')
    const updatingMessage = wrapper.find('.updating-message')
    const spinner = wrapper.find('.spinner')
    
    expect(updatingOverlay.exists()).toBe(true)
    expect(updatingMessage.exists()).toBe(true)
    expect(spinner.exists()).toBe(true)
    expect(updatingMessage.text()).toContain('Updating charts and calculations')
  })

  it('should not show updating indicator when updating is false', () => {
    const wrapper = mount(ComparisonResults, {
      props: {
        ...mockProps,
        updating: false
      }
    })

    const updatingOverlay = wrapper.find('.updating-overlay')
    expect(updatingOverlay.exists()).toBe(false)
  })
})