// utils/chartAnalytics.js

/**
 * Calculate simple moving average for prediction/forecast
 * @param {Array} data - Array of numeric values
 * @param {number} windowSize - Size of the moving average window
 * @returns {Array} Array of moving averages
 */
export const calculateMovingAverage = (data, windowSize = 3) => {
  if (!data || data.length < windowSize) return [];

  const movingAverages = [];
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
    movingAverages.push(Math.round(average * 100) / 100); // Round to 2 decimal places
  }
  return movingAverages;
};

/**
 * Generate forecast/prediction based on linear regression
 * @param {Array} data - Array of numeric values
 * @param {number} forecastPoints - Number of points to forecast
 * @returns {Array} Array of predicted values
 */
export const generateLinearForecast = (data, forecastPoints = 2) => {
  if (!data || data.length < 2) return [];

  // Simple linear regression
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y = data;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate forecast points
  const forecast = [];
  for (let i = 1; i <= forecastPoints; i++) {
    const predictedValue = slope * (n + i) + intercept;
    forecast.push(Math.max(0, Math.round(predictedValue * 100) / 100)); // Ensure non-negative
  }

  return forecast;
};

/**
 * Find the highest value and its index in the data
 * @param {Array} data - Array of numeric values
 * @returns {Object} Object containing value, index, and percentage
 */
export const findHighestReach = (data) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data);
  const maxIndex = data.indexOf(maxValue);
  const totalSum = data.reduce((a, b) => a + b, 0);
  const percentage = totalSum > 0 ? Math.round((maxValue / totalSum) * 100) : 0;

  return {
    value: maxValue,
    index: maxIndex,
    percentage: percentage,
    label: `Peak: ${maxValue}`,
  };
};

/**
 * Generate trend analysis data including prediction and highest reach
 * @param {Object} alertDatasets - Object containing alert type arrays
 * @param {Array} labels - Array of chart labels
 * @returns {Object} Object containing prediction data and highest reach info
 */
export const generateTrendAnalysis = (alertDatasets, labels) => {
  if (!alertDatasets || !labels) return { predictions: {}, highestReach: {} };

  const predictions = {};
  const highestReach = {};

  // Process each alert type
  Object.entries(alertDatasets).forEach(([alertType, data]) => {
    if (Array.isArray(data) && data.length > 0) {
      // Generate prediction
      const forecast = generateLinearForecast(data, 2);
      const movingAvg = calculateMovingAverage(data, 3);

      // Find highest reach
      const highest = findHighestReach(data);

      predictions[alertType] = {
        forecast: forecast,
        movingAverage: movingAvg,
        trend:
          forecast.length > 0
            ? forecast[0] > data[data.length - 1]
              ? "increasing"
              : "decreasing"
            : "stable",
      };

      highestReach[alertType] = highest;
    }
  });

  return { predictions, highestReach };
};

/**
 * Create extended chart data with prediction lines
 * @param {Object} originalData - Original chart data
 * @param {Object} trendAnalysis - Trend analysis data
 * @returns {Object} Extended chart data with predictions
 */
export const createPredictionChartData = (originalData, trendAnalysis) => {
  if (!originalData || !trendAnalysis) return originalData;

  const { predictions, highestReach } = trendAnalysis;
  const extendedLabels = [...originalData.labels];
  const extendedDatasets = [];

  // Add prediction labels
  const lastLabel = originalData.labels[originalData.labels.length - 1];
  extendedLabels.push("Forecast +1", "Forecast +2");

  // Process each dataset
  if (originalData.alertDatasets) {
    Object.entries(originalData.alertDatasets).forEach(([alertType, data]) => {
      if (
        predictions[alertType] &&
        predictions[alertType].forecast.length > 0
      ) {
        // Add prediction points to the data
        const predictionData = [...data, ...predictions[alertType].forecast];

        // Create main dataset
        extendedDatasets.push({
          data: predictionData,
          color: originalData.alertDatasets[alertType].color || (() => "#666"),
          strokeWidth: 2,
          withDots: true,
        });

        // Create prediction dataset (dotted line)
        const predictionOnlyData = [
          ...Array(data.length - 1).fill(null),
          data[data.length - 1],
          ...predictions[alertType].forecast,
        ];

        extendedDatasets.push({
          data: predictionOnlyData,
          color: () => "#999",
          strokeWidth: 1,
          strokeDashArray: [5, 5], // This might not work in react-native-chart-kit
          withDots: false,
        });
      }
    });
  }

  return {
    ...originalData,
    labels: extendedLabels,
    datasets:
      extendedDatasets.length > 0 ? extendedDatasets : originalData.datasets,
    trendAnalysis: trendAnalysis,
  };
};
