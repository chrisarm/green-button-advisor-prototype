// SDGE 2025 Residential Tariff Schedules
// Effective Date: February 1, 2025

// Time period definitions
export const TIME_PERIODS = {
  SUMMER: {
    months: [5, 6, 7, 8, 9], // June-October (0-indexed: May-September)
    periods: {
      SUPER_OFF_PEAK: { start: 0, end: 6 },
      ON_PEAK: { start: 16, end: 21 },
      OFF_PEAK: 'default'
    }
  },
  WINTER: {
    months: [10, 11, 0, 1, 2, 3, 4], // November-May (0-indexed)
    periods: {
      SUPER_OFF_PEAK: { start: 0, end: 6 },
      ON_PEAK: { start: 16, end: 21 },
      OFF_PEAK: 'default'
    }
  }
}

// SDGE Tariff Plans
export const SDGE_PLANS = {
  'DR': {
    name: 'DR - Standard Residential',
    description: 'Standard UDC schedule for domestic residential electric service',
    type: 'tiered',
    monthlyCharge: 0.402,
    requirements: [],
    rates: {
      summer: {
        tier1: 0.40692, // up to 130% of baseline
        tier2: 0.51236  // above 130% of baseline
      },
      winter: {
        tier1: 0.40692,
        tier2: 0.51236
      }
    },
    baselineCredit: -0.10544
  },

  'TOU-DR1': {
    name: 'TOU-DR1 - Time of Use Service',
    description: 'Time-of-use option for residential customers',
    type: 'time_of_use',
    monthlyCharge: 0.402,
    requirements: [],
    rates: {
      summer: {
        onPeak: 0.71412,
        offPeak: 0.47416,
        superOffPeak: 0.34812
      },
      winter: {
        onPeak: 0.56348,
        offPeak: 0.49877,
        superOffPeak: 0.47999
      }
    },
    baselineCredit: -0.10544
  },

  'TOU-DR2': {
    name: 'TOU-DR2 - Time of Use Service',
    description: 'Time-of-use option for residential customers',
    type: 'time_of_use',
    monthlyCharge: 0.402,
    requirements: [],
    rates: {
      summer: {
        onPeak: 0.71987,
        offPeak: 0.41964
      },
      winter: {
        onPeak: 0.56348,
        offPeak: 0.49012
      }
    },
    baselineCredit: -0.10544
  },

  'TOU-DR-P': {
    name: 'TOU-DR-P - Time of Use Plus Service',
    description: 'Time-of-use option for customers who manage costs by reducing use during events',
    type: 'time_of_use',
    monthlyCharge: 0.402,
    requirements: [],
    rates: {
      summer: {
        onPeak: 0.51244,
        offPeak: 0.48655,
        superOffPeak: 0.37526
      },
      winter: {
        onPeak: 0.54726,
        offPeak: 0.48967,
        superOffPeak: 0.47297
      }
    },
    baselineCredit: -0.10544,
    ryuAdder: 1.16
  },

  'EV-TOU-5': {
    name: 'EV-TOU-5 - Electric Vehicle Time of Use',
    description: 'Residential service for customers with qualifying electric vehicles',
    type: 'time_of_use',
    monthlyCharge: 16.00,
    requirements: ['Must own electric vehicle registered with California DMV'],
    rates: {
      summer: {
        onPeak: 0.71106,
        offPeak: 0.45460,
        superOffPeak: 0.12017
      },
      winter: {
        onPeak: 0.47772,
        offPeak: 0.42893,
        superOffPeak: 0.11381
      }
    }
  }
}

// Baseline allocation (example - actual varies by climate zone)
export const BASELINE_ALLOCATION = {
  summer: 11.2, // kWh per day
  winter: 9.6   // kWh per day
}

/**
 * Determines the season based on month (0-indexed)
 * @param {number} month - Month (0-11)
 * @returns {string} 'summer' or 'winter'
 */
export function getSeason(month) {
  return TIME_PERIODS.SUMMER.months.includes(month) ? 'summer' : 'winter'
}

/**
 * Determines the time period for TOU plans
 * @param {number} hour - Hour (0-23)
 * @param {boolean} isWeekend - Whether it's a weekend
 * @param {string} season - 'summer' or 'winter'
 * @param {string} planType - Plan type from SDGE_PLANS
 * @returns {string} Time period name
 */
export function getTimePeriod(hour, isWeekend, season, planType) {
  const plan = SDGE_PLANS[planType]
  
  if (plan.type !== 'time_of_use') {
    return 'flat'
  }

  // Weekend logic for some plans
  if (isWeekend && hour >= 0 && hour < 14) {
    return plan.rates[season].superOffPeak !== undefined ? 'superOffPeak' : 'offPeak'
  }

  // Super off-peak period (overnight)
  if (hour >= 0 && hour < 6) {
    return plan.rates[season].superOffPeak !== undefined ? 'superOffPeak' : 'offPeak'
  }

  // On-peak period
  if (hour >= 16 && hour < 21) {
    return 'onPeak'
  }

  // Special case for TOU-DR-P and some plans: additional super off-peak during weekdays
  if (planType === 'TOU-DR-P' && !isWeekend && season === 'summer' && hour >= 10 && hour < 15) {
    return 'superOffPeak'
  }

  // Default to off-peak
  return 'offPeak'
}

/**
 * Calculates the rate for a specific hour and consumption
 * @param {string} planType - Plan type key from SDGE_PLANS
 * @param {number} hour - Hour (0-23)
 * @param {boolean} isWeekend - Whether it's a weekend
 * @param {string} season - 'summer' or 'winter'
 * @param {number} consumption - kWh consumption for this hour
 * @param {number} dailyConsumption - Total daily consumption for baseline calculation
 * @returns {object} Rate details
 */
export function calculateRate(planType, hour, isWeekend, season, consumption, dailyConsumption = 0) {
  const plan = SDGE_PLANS[planType]
  
  if (!plan) {
    throw new Error(`Unknown plan type: ${planType}`)
  }

  if (plan.type === 'tiered') {
    // For tiered plans, determine if consumption is within baseline
    const baselineAllowance = BASELINE_ALLOCATION[season]
    const isWithinBaseline = dailyConsumption <= (baselineAllowance * 1.3) // 130% of baseline
    
    const rate = isWithinBaseline ? plan.rates[season].tier1 : plan.rates[season].tier2
    const baselineCredit = isWithinBaseline && plan.baselineCredit ? plan.baselineCredit : 0
    
    return {
      rate: rate + baselineCredit,
      baseCost: consumption * rate,
      baselineCreditAmount: consumption * baselineCredit,
      period: isWithinBaseline ? 'Tier 1' : 'Tier 2',
      planType
    }
  } else {
    // Time-of-use plans
    const period = getTimePeriod(hour, isWeekend, season, planType)
    const rate = plan.rates[season][period]
    
    if (rate === undefined) {
      throw new Error(`No rate defined for ${planType} ${season} ${period}`)
    }

    return {
      rate,
      baseCost: consumption * rate,
      period: period.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      planType
    }
  }
}

/**
 * Gets all available plan types
 * @returns {Array<string>} Array of plan type keys
 */
export function getAvailablePlans() {
  return Object.keys(SDGE_PLANS)
}

/**
 * Gets plan information
 * @param {string} planType - Plan type key
 * @returns {object} Plan information
 */
export function getPlanInfo(planType) {
  return SDGE_PLANS[planType]
}