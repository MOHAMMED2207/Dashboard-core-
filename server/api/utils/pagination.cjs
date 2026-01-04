// server/api/utils/pagination.cjs

/**
 * Paginate query results
 * @param {Object} query - Mongoose query
 * @param {Number} page - Page number (starting from 1)
 * @param {Number} limit - Items per page
 * @returns {Promise<Object>} Paginated results
 */
exports.paginateResults = async (query, page = 1, limit = 20) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query with pagination
  const results = await query.skip(skip).limit(limitNum);

  // Get total count (use countDocuments on model)
  const model = query.model;
  const conditions = query.getQuery();
  const total = await model.countDocuments(conditions);

  return {
    data: results,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
    },
  };
};

// ========================================

// server/api/utils/dateHelpers.cjs

/**
 * Get date range for different periods
 * @param {String} period - Period type (today, yesterday, last7days, last30days, thisMonth, lastMonth, custom)
 * @param {Object} customRange - Custom date range {start, end}
 * @returns {Object} Date range {start, end}
 */
exports.getDateRange = (period, customRange = null) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;

    case "yesterday":
      start = new Date(now.setDate(now.getDate() - 1));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;

    case "last7days":
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 7);
      break;

    case "last30days":
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 30);
      break;

    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case "lastMonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    case "thisYear":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    case "custom":
      if (customRange && customRange.start && customRange.end) {
        start = new Date(customRange.start);
        end = new Date(customRange.end);
      } else {
        throw new Error("Custom range requires start and end dates");
      }
      break;

    default:
      // Default to last 30 days
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @param {String} format - Format type (short, long, iso)
 * @returns {String} Formatted date
 */
exports.formatDate = (date, format = "short") => {
  if (!date) return "";

  const d = new Date(date);

  switch (format) {
    case "short":
      return d.toLocaleDateString();

    case "long":
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    case "iso":
      return d.toISOString();

    case "time":
      return d.toLocaleTimeString();

    case "datetime":
      return d.toLocaleString();

    default:
      return d.toLocaleDateString();
  }
};

/**
 * Get time difference in human readable format
 * @param {Date} date - Date to compare
 * @returns {String} Time difference (e.g., "2 hours ago")
 */
exports.timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [name, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
    }
  }

  return "just now";
};

// ========================================

// server/api/utils/calculations.cjs

/**
 * Calculate percentage change
 * @param {Number} current - Current value
 * @param {Number} previous - Previous value
 * @returns {Number} Percentage change
 */
exports.calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Calculate growth rate
 * @param {Number} start - Starting value
 * @param {Number} end - Ending value
 * @returns {Number} Growth rate
 */
exports.calculateGrowthRate = (start, end) => {
  if (start === 0) return end > 0 ? 100 : 0;
  return ((end - start) / start) * 100;
};

/**
 * Calculate average
 * @param {Array<Number>} values - Array of numbers
 * @returns {Number} Average
 */
exports.calculateAverage = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calculate standard deviation
 * @param {Array<Number>} values - Array of numbers
 * @returns {Number} Standard deviation
 */
exports.calculateStdDev = (values) => {
  if (!values || values.length === 0) return 0;

  const avg = exports.calculateAverage(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const avgSquaredDiff = exports.calculateAverage(squaredDiffs);

  return Math.sqrt(avgSquaredDiff);
};

/**
 * Calculate median
 * @param {Array<Number>} values - Array of numbers
 * @returns {Number} Median
 */
exports.calculateMedian = (values) => {
  if (!values || values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Format number with thousand separators
 * @param {Number} num - Number to format
 * @param {Number} decimals - Number of decimal places
 * @returns {String} Formatted number
 */
exports.formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format currency
 * @param {Number} amount - Amount to format
 * @param {String} currency - Currency code (USD, EUR, etc.)
 * @returns {String} Formatted currency
 */
exports.formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Determine trend based on values
 * @param {Array<Number>} values - Array of values
 * @returns {String} Trend (up, down, stable, volatile)
 */
exports.determineTrend = (values) => {
  if (!values || values.length < 2) return "stable";

  const changes = [];
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1]);
  }

  const avgChange = exports.calculateAverage(changes);
  const stdDev = exports.calculateStdDev(changes);

  // Volatile if standard deviation is high
  if (stdDev > Math.abs(avgChange) * 2) return "volatile";

  // Trending up if average change is positive
  if (avgChange > 0) return "up";

  // Trending down if average change is negative
  if (avgChange < 0) return "down";

  return "stable";
};

// ========================================

// server/api/utils/validators.cjs

/**
 * Validate MongoDB ObjectId
 * @param {String} id - ID to validate
 * @returns {Boolean} Is valid ObjectId
 */
exports.isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate email
 * @param {String} email - Email to validate
 * @returns {Boolean} Is valid email
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL
 * @param {String} url - URL to validate
 * @returns {Boolean} Is valid URL
 */
exports.isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize input to prevent XSS
 * @param {String} input - Input to sanitize
 * @returns {String} Sanitized input
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};