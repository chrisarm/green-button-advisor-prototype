import { describe, it, expect } from 'vitest'
import {
  getSeason,
  getTimePeriod,
  calculateRate,
  getAvailablePlans,
  getPlanInfo,
  SDGE_PLANS
} from '../sdgeTariffs.js'

describe('SDGE Tariffs', () => {
  describe('getSeason', () => {
    it('should return summer for June through October', () => {
      expect(getSeason(5)).toBe('summer') // June (0-indexed)
      expect(getSeason(6)).toBe('summer') // July
      expect(getSeason(7)).toBe('summer') // August
      expect(getSeason(8)).toBe('summer') // September
      expect(getSeason(9)).toBe('summer') // October
    })

    it('should return winter for November through May', () => {
      expect(getSeason(10)).toBe('winter') // November
      expect(getSeason(11)).toBe('winter') // December
      expect(getSeason(0)).toBe('winter')  // January
      expect(getSeason(1)).toBe('winter')  // February
      expect(getSeason(2)).toBe('winter')  // March
      expect(getSeason(3)).toBe('winter')  // April
      expect(getSeason(4)).toBe('winter')  // May
    })
  })

  describe('getTimePeriod', () => {
    describe('TOU-DR1 plan', () => {
      it('should return superOffPeak for overnight hours (0-6)', () => {
        expect(getTimePeriod(0, false, 'summer', 'TOU-DR1')).toBe('superOffPeak')
        expect(getTimePeriod(3, false, 'summer', 'TOU-DR1')).toBe('superOffPeak')
        expect(getTimePeriod(5, false, 'summer', 'TOU-DR1')).toBe('superOffPeak')
      })

      it('should return onPeak for peak hours (16-21)', () => {
        expect(getTimePeriod(16, false, 'summer', 'TOU-DR1')).toBe('onPeak')
        expect(getTimePeriod(18, false, 'summer', 'TOU-DR1')).toBe('onPeak')
        expect(getTimePeriod(20, false, 'summer', 'TOU-DR1')).toBe('onPeak')
      })

      it('should return offPeak for other hours', () => {
        expect(getTimePeriod(10, false, 'summer', 'TOU-DR1')).toBe('offPeak')
        expect(getTimePeriod(14, false, 'summer', 'TOU-DR1')).toBe('offPeak')
        expect(getTimePeriod(22, false, 'summer', 'TOU-DR1')).toBe('offPeak')
      })

      it('should handle weekend special periods', () => {
        expect(getTimePeriod(10, true, 'summer', 'TOU-DR1')).toBe('superOffPeak')
        expect(getTimePeriod(12, true, 'summer', 'TOU-DR1')).toBe('superOffPeak')
      })
    })

    describe('TOU-DR2 plan (no super off-peak)', () => {
      it('should return offPeak for overnight hours when no superOffPeak exists', () => {
        expect(getTimePeriod(3, false, 'summer', 'TOU-DR2')).toBe('offPeak')
      })
    })
  })

  describe('calculateRate', () => {
    describe('TOU-DR1 plan', () => {
      it('should calculate correct summer rates', () => {
        const result = calculateRate('TOU-DR1', 18, false, 'summer', 1.5) // On-peak
        expect(result.rate).toBe(0.71412)
        expect(result.baseCost).toBe(1.5 * 0.71412)
        expect(result.period).toBe('On Peak')
        expect(result.planType).toBe('TOU-DR1')
      })

      it('should calculate correct winter rates', () => {
        const result = calculateRate('TOU-DR1', 3, false, 'winter', 2.0) // Super off-peak
        expect(result.rate).toBe(0.47999)
        expect(result.baseCost).toBe(2.0 * 0.47999)
        expect(result.period).toBe('Super Off Peak')
      })
    })

    describe('EV-TOU-5 plan', () => {
      it('should calculate correct summer super off-peak rates', () => {
        const result = calculateRate('EV-TOU-5', 3, false, 'summer', 5.0)
        expect(result.rate).toBe(0.12017)
        expect(result.baseCost).toBe(5.0 * 0.12017)
      })

      it('should calculate correct winter rates', () => {
        const result = calculateRate('EV-TOU-5', 18, false, 'winter', 3.0) // On-peak
        expect(result.rate).toBe(0.47772)
        expect(result.baseCost).toBe(3.0 * 0.47772)
      })
    })

    describe('DR (tiered) plan', () => {
      it('should calculate tier 1 rates within baseline', () => {
        const result = calculateRate('DR', 12, false, 'summer', 2.0, 10.0) // Daily consumption within baseline
        expect(result.rate).toBe(0.40692 + (-0.10544)) // Tier 1 + baseline credit
        expect(result.period).toBe('Tier 1')
      })

      it('should calculate tier 2 rates above baseline', () => {
        const result = calculateRate('DR', 12, false, 'summer', 2.0, 20.0) // Daily consumption above baseline
        expect(result.rate).toBe(0.51236)
        expect(result.period).toBe('Tier 2')
      })
    })

    it('should throw error for unknown plan', () => {
      expect(() => {
        calculateRate('UNKNOWN-PLAN', 12, false, 'summer', 1.0)
      }).toThrow('Unknown plan type: UNKNOWN-PLAN')
    })
  })

  describe('getAvailablePlans', () => {
    it('should return all plan types', () => {
      const plans = getAvailablePlans()
      expect(plans).toContain('DR')
      expect(plans).toContain('TOU-DR1')
      expect(plans).toContain('TOU-DR2')
      expect(plans).toContain('TOU-DR-P')
      expect(plans).toContain('EV-TOU-5')
      expect(plans.length).toBe(5)
    })
  })

  describe('getPlanInfo', () => {
    it('should return correct plan information', () => {
      const planInfo = getPlanInfo('EV-TOU-5')
      expect(planInfo.name).toBe('EV-TOU-5 - Electric Vehicle Time of Use')
      expect(planInfo.monthlyCharge).toBe(16.00)
      expect(planInfo.requirements).toContain('Must own electric vehicle registered with California DMV')
    })

    it('should return undefined for unknown plan', () => {
      const planInfo = getPlanInfo('UNKNOWN')
      expect(planInfo).toBeUndefined()
    })
  })

  describe('Rate validation', () => {
    it('should have valid rates for all plans and seasons', () => {
      const plans = getAvailablePlans()
      const seasons = ['summer', 'winter']
      
      plans.forEach(planType => {
        const plan = getPlanInfo(planType)
        seasons.forEach(season => {
          expect(plan.rates[season]).toBeDefined()
          
          if (plan.type === 'time_of_use') {
            expect(typeof plan.rates[season].onPeak).toBe('number')
            expect(typeof plan.rates[season].offPeak).toBe('number')
            // superOffPeak is optional for some plans
          } else if (plan.type === 'tiered') {
            expect(typeof plan.rates[season].tier1).toBe('number')
            expect(typeof plan.rates[season].tier2).toBe('number')
          }
        })
      })
    })

    it('should have valid monthly charges', () => {
      const plans = getAvailablePlans()
      plans.forEach(planType => {
        const plan = getPlanInfo(planType)
        expect(typeof plan.monthlyCharge).toBe('number')
        expect(plan.monthlyCharge).toBeGreaterThanOrEqual(0)
      })
    })
  })
})