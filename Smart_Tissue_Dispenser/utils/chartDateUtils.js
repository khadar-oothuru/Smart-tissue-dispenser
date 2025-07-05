// Utility functions for formatting dates in analytics charts

/**
 * Format a date string for display in charts based on backend period naming convention
 * Backend sends period_name like: "Day 2024-01-15", "Week 2024-W25", "Month 2024-06", etc.
 * @param {string} periodName - Period name from backend (e.g., "Week 2024-W25")
 * @param {string} period - Raw period value (e.g., "2024-W25")
 * @param {number} index - Index for generating unique labels
 * @returns {string} Formatted date string for chart labels
 */
export const formatChartDate = (periodName, period, index = 0) => {
  try {
    // ALWAYS generate unique sequential dates based on index to ensure uniqueness
    const baseDate = new Date();

    // Handle different period types and generate unique dates
    if (periodName && typeof periodName === "string") {
      // For weekly data
      if (periodName.includes("Week")) {
        // Try to parse actual week if available
        const weekStr = periodName.replace("Week ", "");
        if (weekStr.includes("-W")) {
          const [year, week] = weekStr.split("-W");
          const weekNum = parseInt(week);
          try {
            const date = getDateFromWeek(parseInt(year), weekNum);
            // Adjust by index to ensure uniqueness
            date.setDate(date.getDate() + index * 7);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          } catch (_e) {
            // Fallback to sequential weeks
            baseDate.setDate(baseDate.getDate() - index * 7);
            return baseDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }
        } else {
          // Generate sequential weekly dates
          baseDate.setDate(baseDate.getDate() - index * 7);
          return baseDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
      }

      // For daily data
      if (periodName.includes("Day")) {
        // Try to parse actual date if available
        const dateStr = periodName.replace("Day ", "");
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          // Adjust by index to ensure uniqueness
          parsedDate.setDate(parsedDate.getDate() + index);
          return parsedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        } else {
          // Generate sequential daily dates
          baseDate.setDate(baseDate.getDate() - index);
          return baseDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
      }

      // For monthly data
      if (periodName.includes("Month")) {
        const monthStr = periodName.replace("Month ", "");
        if (monthStr.includes("-")) {
          const [year, month] = monthStr.split("-");
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          // Adjust by index to ensure uniqueness
          date.setMonth(date.getMonth() + index);
          return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
        } else {
          // Generate sequential monthly dates
          baseDate.setMonth(baseDate.getMonth() - index);
          return baseDate.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
        }
      }

      // For quarterly data
      if (periodName.includes("Quarter")) {
        const quarterStr = periodName.replace("Quarter ", "");
        if (quarterStr.includes("-Q")) {
          const [year, quarter] = quarterStr.split("-Q");
          const adjustedQuarter = parseInt(quarter) + Math.floor(index / 4);
          const adjustedYear =
            parseInt(year) + Math.floor((parseInt(quarter) + index - 1) / 4);
          const finalQuarter = ((adjustedQuarter - 1) % 4) + 1;
          return `Q${finalQuarter} ${adjustedYear.toString().slice(-2)}`;
        } else {
          // Generate sequential quarterly dates
          baseDate.setMonth(baseDate.getMonth() - index * 3);
          const quarter = Math.floor(baseDate.getMonth() / 3) + 1;
          return `Q${quarter} ${baseDate.getFullYear().toString().slice(-2)}`;
        }
      }

      // For yearly data
      if (periodName.includes("Year")) {
        const yearMatch = periodName.match(/\d{4}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0]) + index;
          return year.toString();
        } else {
          const year = baseDate.getFullYear() - index;
          return year.toString();
        }
      }
    }

    // Fallback to raw period value with index adjustment
    if (period && typeof period === "string") {
      return formatDateByType(period, detectPeriodType(period), index);
    }

    // Final fallback: generate sequential weekly dates
    baseDate.setDate(baseDate.getDate() - index * 7);
    return baseDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch (_error) {
    // Error formatting chart date
    // Sequential fallback dates based on index
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - index * 7);
    return baseDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

/**
 * Format date based on detected period type
 * @param {string} dateStr - Date string to format
 * @param {string} periodType - Detected period type
 * @param {number} index - Index for fallback
 * @returns {string} Formatted date
 */
const formatDateByType = (dateStr, periodType, index) => {
  let date;

  try {
    // Parse different date formats
    if (/^\d{4}-W\d{1,2}$/.test(dateStr)) {
      // Week format: 2024-W25
      const [year, week] = dateStr.split("-W");
      date = getDateFromWeek(parseInt(year), parseInt(week));
    } else if (/^\d{4}-Q\d$/.test(dateStr)) {
      // Quarter format: 2024-Q2
      const [year, quarter] = dateStr.split("-Q");
      const month = (parseInt(quarter) - 1) * 3;
      date = new Date(parseInt(year), month, 1);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      // Full date: 2024-01-15
      date = new Date(dateStr);
    } else if (/^\d{4}-\d{2}$/.test(dateStr)) {
      // Month format: 2024-06
      const [year, month] = dateStr.split("-");
      date = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else if (/^\d{4}$/.test(dateStr)) {
      // Year format: 2024
      date = new Date(parseInt(dateStr), 0, 1);
    } else {
      // Try general parsing
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      // Generate fallback date instead of "Period X"
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - index * 7);
      return baseDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    // Format based on period type
    switch (periodType) {
      case "day":
      case "daily":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "week":
      case "weekly":
        // For weekly, show the Monday of that week
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "month":
      case "monthly":
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
      case "quarter":
      case "quarterly":
        const q = Math.floor(date.getMonth() / 3) + 1;
        return `Q${q} ${date.getFullYear().toString().slice(-2)}`;
      case "year":
      case "yearly":
        return date.getFullYear().toString();
      default:
        // Default to month-day format for uniqueness
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
    }
  } catch (_error) {
    // Error in formatDateByType
    // Generate fallback date instead of "Period X"
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - index * 7);
    return baseDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

/**
 * Detect period type from date string format
 * @param {string} dateStr - Date string to analyze
 * @returns {string} Detected period type
 */
const detectPeriodType = (dateStr) => {
  if (/^\d{4}-W\d{1,2}$/.test(dateStr)) return "weekly";
  if (/^\d{4}-Q\d$/.test(dateStr)) return "quarterly";
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return "daily";
  if (/^\d{4}-\d{2}$/.test(dateStr)) return "monthly";
  if (/^\d{4}$/.test(dateStr)) return "yearly";
  return "weekly"; // default
};

/**
 * Get date from week number
 * @param {number} year - Year
 * @param {number} week - Week number
 * @returns {Date} Date object for the start of that week
 */
const getDateFromWeek = (year, week) => {
  const date = new Date(year, 0, 1);
  const dayOfWeek = date.getDay();
  const diff = (week - 1) * 7 - dayOfWeek + 1;
  date.setDate(date.getDate() + diff);
  return date;
};

/**
 * Truncate long labels for better chart display
 * @param {string} label - Original label
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated label
 */
export const truncateLabel = (label, maxLength = 8) => {
  if (!label || label.length <= maxLength) return label;
  return label.substring(0, maxLength - 1) + "…";
};

/**
 * Generate unique chart labels based on index and period type
 * @param {number} index - The index of the period
 * @param {number} totalPeriods - Total number of periods
 * @param {string} periodType - Type of period (daily, weekly, monthly, etc.)
 * @returns {string} Unique label
 */
export const generateUniqueLabel = (
  index,
  totalPeriods,
  periodType = "weekly"
) => {
  const currentDate = new Date();

  switch (periodType) {
    case "daily":
      currentDate.setDate(currentDate.getDate() - (totalPeriods - 1 - index));
      return currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "weekly":
      currentDate.setDate(
        currentDate.getDate() - (totalPeriods - 1 - index) * 7
      );
      return currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "monthly":
      currentDate.setMonth(currentDate.getMonth() - (totalPeriods - 1 - index));
      return currentDate.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
    case "quarterly":
      const quarterDate = new Date(currentDate);
      quarterDate.setMonth(
        quarterDate.getMonth() - (totalPeriods - 1 - index) * 3
      );
      const q = Math.floor(quarterDate.getMonth() / 3) + 1;
      return `Q${q} ${quarterDate.getFullYear().toString().slice(-2)}`;
    case "yearly":
      const yearDate = new Date(currentDate);
      yearDate.setFullYear(yearDate.getFullYear() - (totalPeriods - 1 - index));
      return yearDate.getFullYear().toString();
    default:
      return `Period ${index + 1}`;
  }
};

/**
 * Generate sequential dates for periods to ensure uniqueness
 * @param {Array} periods - Array of period objects
 * @param {string} periodType - Type of periods (daily, weekly, monthly)
 * @returns {Array} Array of unique formatted date strings
 */
export const generateSequentialDates = (periods, periodType = "weekly") => {
  const today = new Date();
  const labels = [];

  periods.forEach((_period, index) => {
    const date = new Date(today);

    switch (periodType.toLowerCase()) {
      case "daily":
        // Go backwards in time for older periods
        date.setDate(today.getDate() - (periods.length - 1 - index));
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
        break;
      case "weekly":
        // Go backwards by weeks for older periods
        date.setDate(today.getDate() - (periods.length - 1 - index) * 7);
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
        break;
      case "monthly":
        // Go backwards by months for older periods
        date.setMonth(today.getMonth() - (periods.length - 1 - index));
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        );
        break;
      case "quarterly":
        // Go backwards by quarters for older periods
        date.setMonth(today.getMonth() - (periods.length - 1 - index) * 3);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        labels.push(`Q${quarter} ${date.getFullYear().toString().slice(-2)}`);
        break;
      case "yearly":
        // Go backwards by years for older periods
        date.setFullYear(today.getFullYear() - (periods.length - 1 - index));
        labels.push(date.getFullYear().toString());
        break;
      default:
        // Default to weekly
        date.setDate(today.getDate() - (periods.length - 1 - index) * 7);
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
    }
  });

  return labels; // Don't reverse, keep chronological order (oldest to newest)
};
