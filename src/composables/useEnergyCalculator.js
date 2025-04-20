import { ref } from "vue";
import {
  parse,
  format,
  getDay,
  getMonth,
  getHours,
  getDate,
  isValid,
} from "date-fns";

// Monthly fixed charge constant
const MONTHLY_FIXED_CHARGE = 16.0;

function parseAndAdjustDate(dateStr, timeStr) {
  try {
    // 1. Format the date part consistently (MM/DD/YYYY -> YYYY-MM-DD)
    const [month, day, year] = dateStr.split("/");
    // Pad month and day with leading zeros if needed
    const formattedDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // 2. Combine with time - Keep the original time format for parsing
    const combinedStr = `${formattedDateStr} ${timeStr}`;

    // 3. Parse using the CORRECT format string for "YYYY-MM-DD h:mm AM/PM"
    //    'h' is for 1-12 hour, 'mm' for minutes, 'a' for AM/PM
    const initialDate = parse(combinedStr, "yyyy-MM-dd h:mm a", new Date());

    // 4. Check if parsing was successful
    if (!isValid(initialDate)) {
      // <-- Use isValid()
      console.warn(
        `Could not parse date/time: ${combinedStr} with format 'yyyy-MM-dd h:mm a'`,
      );
      return null; // Handle invalid dates explicitly
    }

    // 5. Apply the 3-day adjustment (confirm if this is really needed)
    return initialDate;
  } catch (e) {
    console.error(`Error parsing date/time string: "${dateStr} ${timeStr}"`, e);
    return null; // Handle errors during splitting or formatting
  }
}

function getRateDetails(hour, isWeekend, isSummer, isSpring) {
  if (isSummer) {
    if (hour >= 0 && hour < 6)
      return { rate: 0.12017, rate_tier: "Super-Off-Peak" };
    if (hour >= 16 && hour < 21) return { rate: 0.71106, rate_tier: "On-Peak" };
    if (isWeekend && hour >= 0 && hour < 14)
      return { rate: 0.12017, rate_tier: "Super-Off-Peak" };
    return { rate: 0.4546, rate_tier: "Off-Peak" };
  } else if (isSpring) {
    // Added Spring logic based on Python code
    if ((hour >= 0 && hour < 6) || (hour >= 10 && hour < 15))
      return { rate: 0.12017, rate_tier: "Super-Off-Peak" };
    if (hour >= 16 && hour < 21) return { rate: 0.71106, rate_tier: "On-Peak" };
    if (isWeekend && hour >= 0 && hour < 14)
      return { rate: 0.12017, rate_tier: "Super-Off-Peak" };
    return { rate: 0.4546, rate_tier: "Off-Peak" };
  } else {
    // Winter
    if (hour >= 0 && hour < 6)
      return { rate: 0.11381, rate_tier: "Super-Off-Peak" };
    if (isWeekend && hour >= 0 && hour < 14)
      return { rate: 0.11381, rate_tier: "Super-Off-Peak" };
    if (!isWeekend && hour >= 10 && hour < 14)
      return { rate: 0.11381, rate_tier: "Super-Off-Peak" };
    if (hour >= 16 && hour < 21) return { rate: 0.47772, rate_tier: "On-Peak" };
    return { rate: 0.42893, rate_tier: "Off-Peak" };
  }
}

// Updated with rates effective February 1, 2025
function getRateDetails2(hour, isWeekend, isSummer, isSpring) {
  if (isSummer) {
    if (isWeekend && hour >= 0 && hour < 14)
      return { rate: 0.34812, rate_tier: "Super Off-Peak" };
    if (hour >= 0 && hour < 6)
      return { rate: 0.34812, rate_tier: "Super Off-Peak" };
    if (hour >= 16 && hour < 21) return { rate: 0.71412, rate_tier: "On-Peak" };
    return { rate: 0.47416, rate_tier: "Off-Peak" };
  } else if (isSpring) {
    // Maintaining Spring logic but updating rates to match Winter rates
    // as the document only shows Summer and Winter rates
    if (isWeekend && hour >= 0 && hour < 14)
      return { rate: 0.47999, rate_tier: "Super Off-Peak" };
    if ((hour >= 0 && hour < 6) || (hour >= 10 && hour < 15))
      return { rate: 0.47999, rate_tier: "Super Off-Peak" };
    if (hour >= 16 && hour < 21) return { rate: 0.56348, rate_tier: "On-Peak" };
    return { rate: 0.49877, rate_tier: "Off-Peak" };
  } else {
    // Winter
    if (hour >= 0 && hour < 6)
      return { rate: 0.47999, rate_tier: "Super Off-Peak" };
    if (isWeekend && hour >= 0 && hour < 14)
      return { rate: 0.47999, rate_tier: "Super Off-Peak" };
    if (!isWeekend && hour >= 10 && hour < 14)
      return { rate: 0.47999, rate_tier: "Super Off-Peak" };
    if (hour >= 16 && hour < 21) return { rate: 0.56348, rate_tier: "On-Peak" };
    return { rate: 0.49877, rate_tier: "Off-Peak" };
  }
}

export function useEnergyCalculator() {
  const usageData = ref([]);
  const overallSummary = ref(null);
  const periodSummary = ref([]);
  const monthlySummary = ref([]);

  // Initialize with a valid empty structure
  const chartData = ref({
    dailyUsage: { labels: [], datasets: [] },
    monthlyCost: { labels: [], datasets: [] },
  });

  const processing = ref(false);
  const error = ref(null);

  const processData = (rawData) => {
    processing.value = true;
    error.value = null;
    try {
      // 1. Load and prepare (similar to load_usage_data)
      const processed = rawData
        .map((row) => {
          // Ensure required columns exist and handle potential missing data
          const dateStr = row["Date"]; // Adjust key if CSV header is different
          const timeStr = row["Start Time"]; // Adjust key if CSV header is different
          const consumption = parseFloat(row["Consumption"]); // Adjust key

          if (!dateStr || !timeStr || isNaN(consumption)) {
            // console.warn("Skipping row with missing data:", row);
            return null; // Skip rows with missing essential data
          }

          const dateTime = parseAndAdjustDate(dateStr, timeStr);
          if (!dateTime) return null; // Skip if date parsing failed

          const month = getMonth(dateTime); // 0-indexed (Jan=0)
          const hour = getHours(dateTime);
          const dayOfWeek = getDay(dateTime); // 0=Sunday, 6=Saturday

          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          // Adjust month check for 0-indexing: Jun=5, Oct=9, Nov=10, Mar=2, May=4
          const isSummer = month >= 5 && month <= 9; // June to October
          const isSpring = month >= 2 && month < 4; // March to April (inclusive start, exclusive end)
          const season = isSummer ? "Summer" : "Winter"; // Simplified season based on Python logic

          return {
            ...row, // Keep original data if needed
            datetime: dateTime,
            Consumption: consumption, // Ensure it's a number
            hour: hour,
            is_weekend: isWeekend,
            month: month + 1, // Store as 1-indexed for consistency with Python output
            day: getDate(dateTime),
            is_summer: isSummer,
            is_spring: isSpring, // Added spring flag
            season: season,
          };
        })
        .filter((row) => row !== null); // Remove skipped/invalid rows

      // 2. Calculate Costs (similar to calculate_costs)
      let totalFixedCharge = 0;
      const uniqueMonths = new Set();

      const costCalculated = processed.map((row) => {
        // Get rate details from both functions
        const rateInfo1 = getRateDetails(
          row.hour,
          row.is_weekend,
          row.is_summer,
          row.is_spring,
        );

        const rateInfo2 = getRateDetails2(
          row.hour,
          row.is_weekend,
          row.is_summer,
          row.is_spring,
        );

        // Calculate the difference in rates
        const rateDifference = rateInfo2.rate - rateInfo1.rate;

        // Calculate costs using both rates
        const cost1 = row.Consumption * rateInfo1.rate;
        const cost2 = row.Consumption * rateInfo2.rate;

        // Track unique months for fixed charge calculation
        const monthYearKey = format(row.datetime, "yyyy-MM");
        uniqueMonths.add(monthYearKey);

        return {
          ...row,
          rate_difference: rateDifference,
          rate_tier1: rateInfo1.rate_tier,
          rate_tier2: rateInfo2.rate_tier,
          cost1: cost1,
          cost2: cost2,
          month_year_key: monthYearKey, // For grouping
        };
      });

      totalFixedCharge = uniqueMonths.size * MONTHLY_FIXED_CHARGE;

      usageData.value = costCalculated; // Store detailed data

      // 3. Generate Summaries (similar to generate_summary)
      generateSummaries(costCalculated, totalFixedCharge);

      // 4. Prepare Chart Data (similar to visualize_costs data prep)
      prepareChartData(costCalculated);
    } catch (err) {
      console.error("Error processing data:", err);
      error.value = "Failed to process energy data. " + err.message;
      // Reset states
      usageData.value = [];
      overallSummary.value = null;
      periodSummary.value = [];
      monthlySummary.value = [];
      chartData.value = {
        dailyUsage: { labels: [], datasets: [] },
        monthlyCost: { labels: [], datasets: [] },
      };
    } finally {
      processing.value = false;
    }
  };

  const generateSummaries = (data, fixedCharge) => {
    // Overall Summary
    const totalKWh = data.reduce((sum, row) => sum + row.Consumption, 0);
    const total_Cost1 =
      data.reduce((sum, row) => sum + row.cost1, 0) + fixedCharge;
    const total_Cost2 = data.reduce((sum, row) => sum + row.cost2, 0);

    const total_Savings = total_Cost2 - total_Cost1;

    overallSummary.value = {
      "Total kWh": totalKWh.toFixed(2),
      "Total Cost Savings ($)": total_Savings.toFixed(2),
    };

    // Season/Period Summary
    const periodMap = {};

    data.forEach((row) => {
      const key = `${row.season}-${row.rate_tier1}`;
      if (!periodMap[key]) {
        periodMap[key] = {
          season: row.season,
          rate_tier1: row.rate_tier1,
          Consumption: 0,
          cost1: 0,
          cost2: 0,
          costDiff: 0,
        };
      }
      periodMap[key].Consumption += row.Consumption;
      periodMap[key].cost1 += row.cost1;
      periodMap[key].cost2 += row.cost2;
      periodMap[key].costDiff += row.cost2 - row.cost1;
    });

    periodSummary.value = Object.values(periodMap)
      .map((summary) => ({
        ...summary,
        avg_rate1: (summary.Consumption > 0
          ? summary.cost1 / summary.Consumption
          : 0
        ).toFixed(5),
        avg_rate2: (summary.Consumption > 0
          ? summary.cost2 / summary.Consumption
          : 0
        ).toFixed(5),
        Consumption: summary.Consumption.toFixed(2),
        cost1: summary.cost1.toFixed(2),
        cost2: summary.cost2.toFixed(2),
        costSavings: Math.abs(summary.costDiff).toFixed(2),
      }))
      .sort(
        (a, b) =>
          a.season.localeCompare(b.season) ||
          a.rate_tier1.localeCompare(b.rate_tier1),
      );

    // Monthly Summary
    const monthlyMap = {};
    data.forEach((row) => {
      const key = row.month_year_key;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { datetime: key, Consumption: 0, cost1: 0, cost2: 0 };
      }
      monthlyMap[key].Consumption += row.Consumption;
      monthlyMap[key].cost1 += row.cost1;
      monthlyMap[key].cost2 += row.cost2;
    });
    monthlySummary.value = Object.values(monthlyMap)
      .map((summary) => ({
        ...summary,
        fixed_charge: MONTHLY_FIXED_CHARGE.toFixed(2),
        total: (summary.cost2 - summary.cost1 + MONTHLY_FIXED_CHARGE).toFixed(
          2,
        ),
        Consumption: summary.Consumption.toFixed(2),
        cost_tier1: summary.cost1.toFixed(2),
        cost_tier2: summary.cost2.toFixed(2),
        costSavings: (
          summary.cost2 -
          (summary.cost1 + MONTHLY_FIXED_CHARGE)
        ).toFixed(2),
      }))
      .sort((a, b) => a.datetime.localeCompare(b.datetime)); // Sort by month
  };

  const prepareChartData = (data) => {
    // Initialize temporary holders with empty arrays
    let dailyLabels = [];
    let dailyDatasets = [];
    let monthlyLabels = [];
    let monthlyCostsDatasets = [];
    let monthlySavingsDatasets = [];

    try {
      // Check if data is valid and has entries before processing
      if (data && data.length > 0) {
        // --- Daily Usage Chart Data ---
        const dailyUsageMap = {};
        data.forEach((row) => {
          // Ensure datetime is valid before formatting
          if (row.datetime && isValid(row.datetime)) {
            const dateKey = format(row.datetime, "yyyy-MM-dd");
            if (!dailyUsageMap[dateKey]) {
              dailyUsageMap[dateKey] = {
                "Super-Off-Peak": 0,
                "Off-Peak": 0,
                "On-Peak": 0,
              };
            }
            if (row.rate_tier1 in dailyUsageMap[dateKey]) {
              dailyUsageMap[dateKey][row.rate_tier1] += row.Consumption;
            }
          } else {
            console.warn(
              "Skipping row in chart prep due to invalid datetime:",
              row,
            );
          }
        });

        const sortedDates = Object.keys(dailyUsageMap).sort();
        if (sortedDates.length > 0) {
          // Only populate if there's data
          dailyLabels = sortedDates;
          // Use optional chaining (?.) for safety when accessing map keys
          dailyDatasets = [
            {
              label: "Super-Off-Peak",
              data: sortedDates.map(
                (date) => dailyUsageMap[date]?.["Super-Off-Peak"] || 0,
              ),
              backgroundColor: "green",
            },
            {
              label: "Off-Peak",
              data: sortedDates.map(
                (date) => dailyUsageMap[date]?.["Off-Peak"] || 0,
              ),
              backgroundColor: "orange",
            },
            {
              label: "On-Peak",
              data: sortedDates.map(
                (date) => dailyUsageMap[date]?.["On-Peak"] || 0,
              ),
              backgroundColor: "red",
            },
          ];
        }

        // Ensure monthlySummary.value is valid and populated before mapping
        if (
          monthlySummary.value &&
          Array.isArray(monthlySummary.value) &&
          monthlySummary.value.length > 0
        ) {
          monthlyLabels = monthlySummary.value.map((m) => m.datetime);
          monthlySavingsDatasets = [
            // Add fallback || 0 for safety during parseFloat
            {
              label: "Cost Savings",
              data: monthlySummary.value.map(
                (m) => parseFloat(m.costSavings) || 0,
              ),
              backgroundColor: "green",
            },
          ];
          monthlyCostsDatasets = [
            {
              label: "Cost EV-TOU-5",
              data: monthlySummary.value.map(
                (m) => parseFloat(m.cost_tier1) || 0,
              ),
              backgroundColor: "green",
            },
            {
              label: "Cost TOU-DR-1",
              data: monthlySummary.value.map(
                (m) => parseFloat(m.cost_tier2) || 0,
              ),
              backgroundColor: "red",
            },
          ];
        } // If no monthlySummary data, monthlyLabels/Datasets remain empty arrays
      }

      // Ensure datasets are always properly initialized arrays
      chartData.value = {
        dailyUsage: {
          labels: dailyLabels || [],
          datasets: dailyDatasets || [],
        },
        monthlyCost: {
          labels: monthlyLabels || [],
          datasets: monthlyCostsDatasets || [],
        },
        monthlySavings: {
          labels: monthlyLabels || [],
          datasets: monthlySavingsDatasets || [],
        },
      };
    } catch (err) {
      console.error("Error preparing chart data:", err);
      // Reset to valid empty state
      chartData.value = {
        dailyUsage: { labels: [], datasets: [] },
        monthlyCost: { labels: [], datasets: [] },
      };
    }
  };

  return {
    processData,
    processing,
    error,
    usageData,
    overallSummary,
    periodSummary,
    monthlySummary,
    chartData,
  };
}
