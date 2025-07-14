/**
 * Utility functions for time and date formatting
 */

/**
 * Format a timestamp to a human-readable "time ago" string
 * @param {Date|string|number} timestamp - The timestamp to format
 * @returns {string} A human-readable string (e.g., "5 minutes ago")
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "N/A";
  
  // Convert to Date object if it's not already
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return "Invalid date";
  
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};

/**
 * Format a date to a standard date string
 * @param {Date|string|number} date - The date to format
 * @param {string} format - The format to use (default: 'short')
 * @returns {string} A formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return "N/A";
  
  // Convert to Date object if it's not already
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return "Invalid date";
  
  try {
    switch (format) {
      case 'full':
        return dateObj.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'medium':
        return dateObj.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'time':
        return dateObj.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      case 'short':
      default:
        return dateObj.toLocaleDateString('en-US');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(dateObj);
  }
};