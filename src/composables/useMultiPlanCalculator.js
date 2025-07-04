import { ref, nextTick } from "vue";
import {
  parse,
  format,
  getDay,
  getMonth,
  getHours,
  getDate,
  isValid,
} from "date-fns";
import {
  getSeason,
  calculateRate,
  getAvailablePlans,
  getPlanInfo,
  SDGE_PLANS
} from "../utils/sdgeTariffs.js";

function parseAndAdjustDate(dateStr, timeStr) {
  try {
    const [month, day, year] = dateStr.split("/");
    const formattedDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const combinedStr = `${formattedDateStr} ${timeStr}`;
    const initialDate = parse(combinedStr, "yyyy-MM-dd h:mm a", new Date());

    if (!isValid(initialDate)) {
      console.warn(`Could not parse date/time: ${combinedStr}`);
      return null;
    }

    return initialDate;
  } catch (e) {
    console.error(`Error parsing date/time string: "${dateStr} ${timeStr}"`, e);
    return null;
  }
}

// Deep clone function that preserves Date objects
function deepCloneWithDates(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepCloneWithDates(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepCloneWithDates(obj[key]);
    }
  }
  
  return cloned;
}

export function useMultiPlanCalculator() {
  const usageData = ref([]);
  const originalUsageData = ref([]);
  const selectedPlans = ref(['TOU-DR1', 'EV-TOU-5']); // Default selection
  const planComparisons = ref({});
  const overallComparison = ref(null);
  const periodComparisons = ref([]);
  const monthlyComparisons = ref([]);
  const chartData = ref({
    dailyUsage: { labels: [], datasets: [] },
    monthlyComparison: { labels: [], datasets: [] },
    monthlySavings: { labels: [], datasets: [] }
  });

  const processing = ref(false);
  const error = ref(null);
  const hasDataBeenModified = ref(false);
  const updating = ref(false);
  const hasEV = ref(false);
  const isRecommendationMode = ref(false);

  /**
   * Sets the plans to compare
   * @param {Array<string>} plans - Array of 0-2 plan type keys
   */
  const setSelectedPlans = (plans) => {
    console.log('MultiPlanCalculator: setSelectedPlans called with:', plans);
    if (plans.length > 2) {
      throw new Error('Maximum of two plans can be selected for comparison');
    }
    selectedPlans.value = [...plans];
    console.log('MultiPlanCalculator: selectedPlans.value set to:', selectedPlans.value);
  };

  /**
   * Gets all available plans for selection
   * @returns {Array<object>} Array of plan objects with selection state
   */
  const getSelectablePlans = () => {
    return getAvailablePlans().map(planKey => {
      const planInfo = getPlanInfo(planKey);
      return {
        key: planKey,  // The plan identifier (DR, TOU-DR1, etc.)
        type: planKey,  // Also keep as type for backward compatibility
        name: planInfo.name,
        description: planInfo.description,
        planType: planInfo.type,  // Rename this to avoid confusion
        monthlyCharge: planInfo.monthlyCharge,
        requirements: planInfo.requirements || [],
        selected: selectedPlans.value.includes(planKey)
      };
    });
  };

  const processData = (rawData) => {
    processing.value = true;
    error.value = null;
    
    try {
      // Check if we have exactly 2 plans selected
      if (selectedPlans.value.length !== 2) {
        error.value = 'Please select exactly 2 plans for comparison';
        processing.value = false;
        return;
      }
      // 1. Process and enrich raw usage data
      const processed = rawData
        .map((row) => {
          const dateStr = row["Date"];
          const timeStr = row["Start Time"];
          const consumption = parseFloat(row["Consumption"]);

          if (!dateStr || !timeStr || isNaN(consumption)) {
            return null;
          }

          const dateTime = parseAndAdjustDate(dateStr, timeStr);
          if (!dateTime) return null;

          const month = getMonth(dateTime);
          const hour = getHours(dateTime);
          const dayOfWeek = getDay(dateTime);

          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const season = getSeason(month);

          return {
            ...row,
            datetime: dateTime,
            Consumption: consumption,
            hour: hour,
            is_weekend: isWeekend,
            month: month + 1,
            day: getDate(dateTime),
            season: season,
            month_year_key: format(dateTime, "yyyy-MM"),
            date_key: format(dateTime, "yyyy-MM-dd")
          };
        })
        .filter((row) => row !== null);

      // 2. Calculate daily consumption totals for tiered plan calculations
      const dailyConsumption = {};
      processed.forEach(row => {
        if (!dailyConsumption[row.date_key]) {
          dailyConsumption[row.date_key] = 0;
        }
        dailyConsumption[row.date_key] += row.Consumption;
      });

      // 3. Calculate costs for both selected plans
      const costCalculated = processed.map((row) => {
        const plan1Type = selectedPlans.value[0];
        const plan2Type = selectedPlans.value[1];
        
        const dailyTotal = dailyConsumption[row.date_key];

        const rate1Info = calculateRate(plan1Type, row.hour, row.is_weekend, row.season, row.Consumption, dailyTotal);
        const rate2Info = calculateRate(plan2Type, row.hour, row.is_weekend, row.season, row.Consumption, dailyTotal);

        return {
          ...row,
          plan1: {
            type: plan1Type,
            rate: rate1Info.rate,
            cost: rate1Info.baseCost,
            period: rate1Info.period
          },
          plan2: {
            type: plan2Type,
            rate: rate2Info.rate,
            cost: rate2Info.baseCost,
            period: rate2Info.period
          }
        };
      });

      usageData.value = costCalculated;
      
      // Store original data for reset functionality (preserving Date objects)
      originalUsageData.value = deepCloneWithDates(costCalculated);
      hasDataBeenModified.value = false;

      // 4. Generate summaries and comparisons
      const finalData = generateComparisons(costCalculated);
      
      // Update usageData if plans were swapped
      if (finalData) {
        usageData.value = finalData;
        originalUsageData.value = deepCloneWithDates(finalData);
      }

      // 5. Prepare chart data
      prepareChartData(finalData || costCalculated);

    } catch (err) {
      console.error("Error processing data:", err);
      error.value = "Failed to process energy data. " + err.message;
      resetState();
    } finally {
      processing.value = false;
    }
  };

  const generateComparisons = (data) => {
    const originalPlan1Type = selectedPlans.value[0];
    const originalPlan2Type = selectedPlans.value[1];
    const originalPlan1Info = getPlanInfo(originalPlan1Type);
    const originalPlan2Info = getPlanInfo(originalPlan2Type);

    // Calculate total costs including monthly charges for initial ordering
    const uniqueMonths = new Set(data.map(row => row.month_year_key));
    const totalMonths = uniqueMonths.size;

    const totalOriginalPlan1Cost = data.reduce((sum, row) => sum + row.plan1.cost, 0) + (originalPlan1Info.monthlyCharge * totalMonths);
    const totalOriginalPlan2Cost = data.reduce((sum, row) => sum + row.plan2.cost, 0) + (originalPlan2Info.monthlyCharge * totalMonths);
    
    // Reorder plans so cheaper plan is on the right (plan2)
    let plan1Type, plan2Type, plan1Info, plan2Info;
    let totalPlan1Cost, totalPlan2Cost;
    let shouldSwapPlans = false;
    
    if (totalOriginalPlan1Cost < totalOriginalPlan2Cost) {
      // Original plan1 is cheaper, so swap to put it on the right
      plan1Type = originalPlan2Type;
      plan2Type = originalPlan1Type;
      plan1Info = originalPlan2Info;
      plan2Info = originalPlan1Info;
      totalPlan1Cost = totalOriginalPlan2Cost;
      totalPlan2Cost = totalOriginalPlan1Cost;
      shouldSwapPlans = true;
    } else {
      // Original plan2 is cheaper or same, keep original order
      plan1Type = originalPlan1Type;
      plan2Type = originalPlan2Type;
      plan1Info = originalPlan1Info;
      plan2Info = originalPlan2Info;
      totalPlan1Cost = totalOriginalPlan1Cost;
      totalPlan2Cost = totalOriginalPlan2Cost;
    }

    // If we swapped plans, we need to swap the row data too
    let processedData = data;
    if (shouldSwapPlans) {
      processedData = data.map(row => ({
        ...row,
        plan1: row.plan2,  // Swap plan2 to plan1
        plan2: row.plan1   // Swap plan1 to plan2
      }));
    }

    const totalKWh = data.reduce((sum, row) => sum + row.Consumption, 0);
    const totalSavings = totalPlan1Cost - totalPlan2Cost;

    // Overall comparison
    overallComparison.value = {
      plan1: {
        type: plan1Type,
        name: plan1Info.name,
        totalCost: totalPlan1Cost.toFixed(2),
        averageRate: (totalPlan1Cost / totalKWh).toFixed(5)
      },
      plan2: {
        type: plan2Type,
        name: plan2Info.name,
        totalCost: totalPlan2Cost.toFixed(2),
        averageRate: (totalPlan2Cost / totalKWh).toFixed(5)
      },
      totalKWh: totalKWh.toFixed(2),
      totalSavings: totalSavings.toFixed(2),
      savingsDirection: totalSavings > 0 ? plan2Type : plan1Type,
      monthsAnalyzed: totalMonths
    };

    // Period-based comparison
    const periodMap = {};
    processedData.forEach((row) => {
      // Use plan1 period as the grouping key (they may differ for different plan types)
      const key = `${row.season}-${row.plan1.period}`;
      if (!periodMap[key]) {
        periodMap[key] = {
          season: row.season,
          period: row.plan1.period,
          consumption: 0,
          plan1Cost: 0,
          plan2Cost: 0
        };
      }
      periodMap[key].consumption += row.Consumption;
      periodMap[key].plan1Cost += row.plan1.cost;
      periodMap[key].plan2Cost += row.plan2.cost;
    });

    periodComparisons.value = Object.values(periodMap)
      .map((summary) => ({
        ...summary,
        consumption: summary.consumption.toFixed(2),
        plan1Cost: summary.plan1Cost.toFixed(2),
        plan2Cost: summary.plan2Cost.toFixed(2),
        costDifference: (summary.plan1Cost - summary.plan2Cost).toFixed(2),
        plan1AvgRate: (summary.consumption > 0 ? summary.plan1Cost / summary.consumption : 0).toFixed(5),
        plan2AvgRate: (summary.consumption > 0 ? summary.plan2Cost / summary.consumption : 0).toFixed(5)
      }))
      .sort((a, b) => a.season.localeCompare(b.season) || a.period.localeCompare(b.period));

    // Monthly comparison
    const monthlyMap = {};
    processedData.forEach((row) => {
      const key = row.month_year_key;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: key,
          consumption: 0,
          plan1Cost: 0,
          plan2Cost: 0
        };
      }
      monthlyMap[key].consumption += row.Consumption;
      monthlyMap[key].plan1Cost += row.plan1.cost;
      monthlyMap[key].plan2Cost += row.plan2.cost;
    });

    monthlyComparisons.value = Object.values(monthlyMap)
      .map((summary) => ({
        ...summary,
        consumption: summary.consumption.toFixed(2),
        plan1TotalCost: (summary.plan1Cost + plan1Info.monthlyCharge).toFixed(2),
        plan2TotalCost: (summary.plan2Cost + plan2Info.monthlyCharge).toFixed(2),
        monthlySavings: (summary.plan1Cost + plan1Info.monthlyCharge - summary.plan2Cost - plan2Info.monthlyCharge).toFixed(2),
        plan1MonthlyCharge: plan1Info.monthlyCharge.toFixed(2),
        plan2MonthlyCharge: plan2Info.monthlyCharge.toFixed(2)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
      
    // Return the processed data in case plans were swapped
    return shouldSwapPlans ? processedData : null;
  };

  const prepareChartData = (data) => {
    try {
      const plan1Info = getPlanInfo(selectedPlans.value[0]);
      const plan2Info = getPlanInfo(selectedPlans.value[1]);

      // Daily usage chart (grouped by rate periods for plan1)
      const dailyUsageMap = {};
      data.forEach((row) => {
        if (row.datetime && isValid(row.datetime)) {
          const dateKey = format(row.datetime, "yyyy-MM-dd");
          if (!dailyUsageMap[dateKey]) {
            dailyUsageMap[dateKey] = {};
          }
          if (!dailyUsageMap[dateKey][row.plan1.period]) {
            dailyUsageMap[dateKey][row.plan1.period] = 0;
          }
          dailyUsageMap[dateKey][row.plan1.period] += row.Consumption;
        }
      });

      const sortedDates = Object.keys(dailyUsageMap).sort();
      const periods = [...new Set(data.map(row => row.plan1.period))].sort();
      
      const colors = ['#4CAF50', '#FF9800', '#F44336', '#2196F3', '#9C27B0'];
      
      chartData.value.dailyUsage = {
        labels: sortedDates,
        datasets: periods.map((period, index) => ({
          label: period,
          data: sortedDates.map(date => dailyUsageMap[date][period] || 0),
          backgroundColor: colors[index % colors.length]
        }))
      };

      // Monthly cost comparison
      if (monthlyComparisons.value.length > 0) {
        chartData.value.monthlyComparison = {
          labels: monthlyComparisons.value.map(m => m.month),
          datasets: [
            {
              label: plan1Info.name,
              data: monthlyComparisons.value.map(m => parseFloat(m.plan1TotalCost)),
              backgroundColor: '#4CAF50'
            },
            {
              label: plan2Info.name,
              data: monthlyComparisons.value.map(m => parseFloat(m.plan2TotalCost)),
              backgroundColor: '#F44336'
            }
          ]
        };

        chartData.value.monthlySavings = {
          labels: monthlyComparisons.value.map(m => m.month),
          datasets: [
            {
              label: 'Monthly Savings',
              data: monthlyComparisons.value.map(m => parseFloat(m.monthlySavings)),
              backgroundColor: monthlyComparisons.value.map(m => parseFloat(m.monthlySavings) > 0 ? '#4CAF50' : '#F44336')
            }
          ]
        };
      }

    } catch (err) {
      console.error("Error preparing chart data:", err);
      resetState();
    }
  };

  const resetState = () => {
    usageData.value = [];
    originalUsageData.value = [];
    overallComparison.value = null;
    periodComparisons.value = [];
    monthlyComparisons.value = [];
    chartData.value = {
      dailyUsage: { labels: [], datasets: [] },
      monthlyComparison: { labels: [], datasets: [] },
      monthlySavings: { labels: [], datasets: [] }
    };
    hasDataBeenModified.value = false;
    updating.value = false;
  };

  // Reset usage data to original values
  const resetUsageToOriginal = async () => {
    if (!originalUsageData.value.length) {
      return; // No original data to reset to
    }
    
    // Show updating indicator
    updating.value = true;
    
    try {
      // Wait for next tick to ensure UI updates before heavy computation
      await nextTick();
      
      // Deep clone the original data to restore (preserving Date objects)
      usageData.value = deepCloneWithDates(originalUsageData.value);
      hasDataBeenModified.value = false;
      
      // Regenerate all comparisons and charts
      generateComparisons(usageData.value);
      prepareChartData(usageData.value);
    } finally {
      updating.value = false;
    }
  };

  // Handle manual usage updates
  const updateMonthlyUsage = async (monthUpdate) => {
    if (!usageData.value.length) return;
    
    // Find all data points for this month and update proportionally
    const monthData = usageData.value.filter(row => row.month_year_key === monthUpdate.month);
    if (monthData.length === 0) return;
    
    // Mark data as modified and show updating indicator
    hasDataBeenModified.value = true;
    updating.value = true;
    
    try {
      // Wait for next tick to ensure UI updates before heavy computation
      await nextTick();
      
      const currentTotal = monthData.reduce((sum, row) => sum + row.Consumption, 0);
      const newTotal = monthUpdate.consumption;
      const scaleFactor = newTotal / currentTotal;
      
      // Update the consumption values proportionally
      usageData.value.forEach(row => {
        if (row.month_year_key === monthUpdate.month) {
          row.Consumption = row.Consumption * scaleFactor;
          
          // Recalculate costs with new consumption
          const plan1Type = selectedPlans.value[0];
          const plan2Type = selectedPlans.value[1];
          
          const rate1Info = calculateRate(plan1Type, row.hour, row.is_weekend, row.season, row.Consumption, newTotal);
          const rate2Info = calculateRate(plan2Type, row.hour, row.is_weekend, row.season, row.Consumption, newTotal);
          
          row.plan1.cost = rate1Info.baseCost;
          row.plan1.rate = rate1Info.rate;
          row.plan2.cost = rate2Info.baseCost;
          row.plan2.rate = rate2Info.rate;
        }
      });
      
      // Regenerate all comparisons and charts
      generateComparisons(usageData.value);
      prepareChartData(usageData.value);
    } finally {
      updating.value = false;
    }
  };
  
  const updatePeriodUsage = async (periodUpdate) => {
    if (!usageData.value.length) return;
    
    // Find all data points for this season/period combination
    const periodData = usageData.value.filter(row => 
      row.season === periodUpdate.season && row.plan1.period === periodUpdate.period
    );
    if (periodData.length === 0) return;
    
    // Mark data as modified and show updating indicator
    hasDataBeenModified.value = true;
    updating.value = true;
    
    try {
      // Period updates are computationally intensive, so add a small delay
      // to ensure the loading indicator is visible to users
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const currentTotal = periodData.reduce((sum, row) => sum + row.Consumption, 0);
      const newTotal = periodUpdate.consumption;
      const scaleFactor = newTotal / currentTotal;
      
      // Update the consumption values proportionally
      usageData.value.forEach(row => {
        if (row.season === periodUpdate.season && row.plan1.period === periodUpdate.period) {
          row.Consumption = row.Consumption * scaleFactor;
          
          // Recalculate costs with new consumption
          const plan1Type = selectedPlans.value[0];
          const plan2Type = selectedPlans.value[1];
          
          // For daily total, we need to recalculate for the entire day
          const dailyData = usageData.value.filter(r => r.date_key === row.date_key);
          const dailyTotal = dailyData.reduce((sum, r) => sum + r.Consumption, 0);
          
          const rate1Info = calculateRate(plan1Type, row.hour, row.is_weekend, row.season, row.Consumption, dailyTotal);
          const rate2Info = calculateRate(plan2Type, row.hour, row.is_weekend, row.season, row.Consumption, dailyTotal);
          
          row.plan1.cost = rate1Info.baseCost;
          row.plan1.rate = rate1Info.rate;
          row.plan2.cost = rate2Info.baseCost;
          row.plan2.rate = rate2Info.rate;
        }
      });
      
      // Regenerate all comparisons and charts
      generateComparisons(usageData.value);
      prepareChartData(usageData.value);
    } finally {
      updating.value = false;
    }
  };

  /**
   * Calculates the total cost for a given plan using current usage data
   * @param {string} planType - Plan type key
   * @param {Array} data - Usage data array
   * @returns {number} Total cost including monthly charges
   */
  const calculatePlanTotalCost = (planType, data) => {
    const planInfo = getPlanInfo(planType);
    const uniqueMonths = new Set(data.map(row => row.month_year_key));
    const totalMonths = uniqueMonths.size;
    
    // Pre-calculate daily totals once to avoid repeated filtering
    const dailyTotals = {};
    data.forEach(row => {
      if (!dailyTotals[row.date_key]) {
        dailyTotals[row.date_key] = 0;
      }
      dailyTotals[row.date_key] += row.Consumption;
    });
    
    // Calculate consumption costs
    const consumptionCost = data.reduce((sum, row) => {
      const dailyTotal = dailyTotals[row.date_key];
      const rateInfo = calculateRate(planType, row.hour, row.is_weekend, row.season, row.Consumption, dailyTotal);
      return sum + rateInfo.baseCost;
    }, 0);
    
    // Add monthly charges
    return consumptionCost + (planInfo.monthlyCharge * totalMonths);
  };

  /**
   * Recommends the best 2 plans based on usage data
   * @returns {Promise<Array<string>>} Array of 2 recommended plan types
   */
  const getRecommendedPlans = async () => {
    if (!usageData.value.length) {
      throw new Error('No usage data available for recommendations');
    }
    
    // Get eligible plans based on EV ownership
    console.log('getRecommendedPlans: hasEV.value =', hasEV.value);
    const eligiblePlans = getAvailablePlans().filter(planType => {
      if (planType === 'EV-TOU-5') {
        const isEligible = hasEV.value;
        console.log(`getRecommendedPlans: EV-TOU-5 eligibility = ${isEligible} (hasEV = ${hasEV.value})`);
        return isEligible; // Only include EV plan if user has EV
      }
      return true;
    });
    
    console.log('getRecommendedPlans: eligible plans =', eligiblePlans);
    
    // Calculate total cost for each eligible plan with async breaks
    const planCosts = [];
    for (const planType of eligiblePlans) {
      // Allow UI to update between calculations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const totalCost = calculatePlanTotalCost(planType, usageData.value);
      planCosts.push({ planType, totalCost });
    }
    
    // Sort by total cost (lowest first)
    planCosts.sort((a, b) => a.totalCost - b.totalCost);
    
    // Return the 2 cheapest plans
    return planCosts.slice(0, 2).map(plan => plan.planType);
  };

  /**
   * Sets EV eligibility status
   * @param {boolean} eligibility - Whether user has EV
   */
  const setEVEligibility = (eligibility) => {
    hasEV.value = eligibility;
  };

  /**
   * Applies recommended plans as selection
   */
  const applyRecommendedPlans = async () => {
    try {
      updating.value = true;
      const recommended = await getRecommendedPlans();
      setSelectedPlans(recommended);
      isRecommendationMode.value = true;
      return recommended;
    } catch (err) {
      console.error('Error getting recommendations:', err);
      error.value = err.message;
      return null;
    } finally {
      updating.value = false;
    }
  };

  return {
    // Data
    usageData,
    originalUsageData,
    selectedPlans,
    overallComparison,
    periodComparisons,
    monthlyComparisons,
    chartData,
    processing,
    error,
    hasDataBeenModified,
    updating,
    hasEV,
    isRecommendationMode,

    // Methods
    processData,
    setSelectedPlans,
    getSelectablePlans,
    resetState,
    updateMonthlyUsage,
    updatePeriodUsage,
    resetUsageToOriginal,
    setEVEligibility,
    getRecommendedPlans,
    applyRecommendedPlans
  };
}