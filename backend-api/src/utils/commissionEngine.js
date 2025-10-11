/**
 * Commission Calculation Engine for Field Marketing Agents
 * Handles activity-based commission rules, automated calculations, and payment tracking
 */

/**
 * Commission rule types
 */
const COMMISSION_TYPES = {
  FIXED: 'fixed',           // Fixed amount per activity
  PERCENTAGE: 'percentage', // Percentage of value
  TIERED: 'tiered',        // Different rates based on quantity/performance
  BONUS: 'bonus',          // Bonus for achieving targets
  PENALTY: 'penalty'       // Deduction for non-compliance
};

/**
 * Activity-based commission rates (default configuration)
 */
const DEFAULT_COMMISSION_RATES = {
  survey: {
    type: COMMISSION_TYPES.FIXED,
    rate: 5.00,
    currency: 'USD',
    conditions: {
      minQuestions: 5,
      completionRequired: true
    }
  },
  board_placement: {
    type: COMMISSION_TYPES.FIXED,
    rate: 10.00,
    currency: 'USD',
    conditions: {
      photoRequired: true,
      minCoverage: 15 // minimum 15% coverage
    }
  },
  product_distribution: {
    type: COMMISSION_TYPES.FIXED,
    rate: 0.50,
    currency: 'USD',
    unit: 'per_item',
    conditions: {
      minQuantity: 1,
      maxQuantity: 100
    }
  },
  merchandising: {
    type: COMMISSION_TYPES.FIXED,
    rate: 8.00,
    currency: 'USD',
    conditions: {
      photoRequired: true,
      shelfShareRequired: true
    }
  },
  photo_capture: {
    type: COMMISSION_TYPES.FIXED,
    rate: 2.00,
    currency: 'USD',
    conditions: {
      minPhotos: 1,
      qualityThreshold: 70
    }
  },
  customer_registration: {
    type: COMMISSION_TYPES.FIXED,
    rate: 15.00,
    currency: 'USD',
    conditions: {
      kycRequired: true,
      contactVerified: true
    }
  }
};

/**
 * Performance-based bonus structure
 */
const PERFORMANCE_BONUSES = {
  daily_target: {
    threshold: 10, // 10 activities per day
    bonus: 20.00,
    type: 'daily'
  },
  weekly_target: {
    threshold: 50, // 50 activities per week
    bonus: 100.00,
    type: 'weekly'
  },
  monthly_target: {
    threshold: 200, // 200 activities per month
    bonus: 500.00,
    type: 'monthly'
  },
  quality_bonus: {
    threshold: 90, // 90% quality score
    bonus: 50.00,
    type: 'quality'
  }
};

/**
 * Calculate commission for a single activity
 * @param {Object} activity - Activity data
 * @param {Object} commissionRules - Custom commission rules (optional)
 * @returns {Object} Commission calculation result
 */
function calculateActivityCommission(activity, commissionRules = null) {
  const rules = commissionRules || DEFAULT_COMMISSION_RATES;
  const activityRule = rules[activity.type];

  if (!activityRule) {
    return {
      success: false,
      error: `No commission rule found for activity type: ${activity.type}`,
      commission: 0
    };
  }

  // Check activity conditions
  const conditionCheck = validateActivityConditions(activity, activityRule.conditions);
  if (!conditionCheck.valid) {
    return {
      success: false,
      error: `Activity conditions not met: ${conditionCheck.errors.join(', ')}`,
      commission: 0,
      conditions: conditionCheck
    };
  }

  let commission = 0;
  const calculation = {
    baseRate: activityRule.rate,
    type: activityRule.type,
    multiplier: 1,
    adjustments: []
  };

  switch (activityRule.type) {
    case COMMISSION_TYPES.FIXED:
      if (activityRule.unit === 'per_item' && activity.data && activity.data.quantity) {
        commission = activityRule.rate * activity.data.quantity;
        calculation.multiplier = activity.data.quantity;
      } else {
        commission = activityRule.rate;
      }
      break;

    case COMMISSION_TYPES.PERCENTAGE:
      const value = activity.data?.value || activity.data?.amount || 0;
      commission = (value * activityRule.rate) / 100;
      calculation.baseValue = value;
      break;

    case COMMISSION_TYPES.TIERED:
      commission = calculateTieredCommission(activity, activityRule);
      break;

    default:
      commission = activityRule.rate;
  }

  // Apply quality adjustments
  if (activity.data?.qualityScore) {
    const qualityAdjustment = calculateQualityAdjustment(activity.data.qualityScore);
    commission *= qualityAdjustment.multiplier;
    calculation.adjustments.push(qualityAdjustment);
  }

  // Apply brand-specific multipliers
  if (activity.brandId && activity.data?.brandMultiplier) {
    commission *= activity.data.brandMultiplier;
    calculation.adjustments.push({
      type: 'brand_multiplier',
      multiplier: activity.data.brandMultiplier,
      reason: 'Brand-specific commission rate'
    });
  }

  return {
    success: true,
    commission: Math.round(commission * 100) / 100,
    currency: activityRule.currency,
    calculation,
    activityId: activity.id,
    activityType: activity.type,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate commission for an entire visit
 * @param {Object} visit - Visit data with activities
 * @param {Object} agent - Agent data
 * @param {Object} commissionRules - Custom commission rules (optional)
 * @returns {Object} Visit commission calculation
 */
function calculateVisitCommission(visit, agent = null, commissionRules = null) {
  const activityCommissions = [];
  let totalCommission = 0;
  let errors = [];

  // Calculate commission for each completed activity
  visit.activities.forEach(activity => {
    if (activity.status === 'completed') {
      const activityCommission = calculateActivityCommission(activity, commissionRules);
      
      if (activityCommission.success) {
        activityCommissions.push(activityCommission);
        totalCommission += activityCommission.commission;
      } else {
        errors.push({
          activityId: activity.id,
          error: activityCommission.error
        });
      }
    }
  });

  // Calculate performance bonuses
  const bonuses = calculatePerformanceBonuses(visit, agent, activityCommissions);
  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

  // Apply visit-level adjustments
  const visitAdjustments = calculateVisitAdjustments(visit, totalCommission);
  const adjustedCommission = totalCommission + visitAdjustments.adjustment;

  return {
    visitId: visit.visitId,
    agentId: visit.agentId,
    totalCommission: Math.round((adjustedCommission + totalBonuses) * 100) / 100,
    breakdown: {
      activityCommissions: totalCommission,
      bonuses: totalBonuses,
      adjustments: visitAdjustments.adjustment,
      final: adjustedCommission + totalBonuses
    },
    activities: activityCommissions,
    bonuses,
    adjustments: visitAdjustments.details,
    errors,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Validate activity conditions for commission eligibility
 * @param {Object} activity - Activity data
 * @param {Object} conditions - Commission conditions
 * @returns {Object} Validation result
 */
function validateActivityConditions(activity, conditions) {
  const errors = [];

  if (!conditions) {
    return { valid: true, errors: [] };
  }

  // Check completion requirement
  if (conditions.completionRequired && activity.status !== 'completed') {
    errors.push('Activity must be completed');
  }

  // Check photo requirements
  if (conditions.photoRequired) {
    if (!activity.data?.photos || activity.data.photos.length === 0) {
      errors.push('Photos are required');
    }
  }

  // Check minimum photos
  if (conditions.minPhotos) {
    const photoCount = activity.data?.photos?.length || 0;
    if (photoCount < conditions.minPhotos) {
      errors.push(`Minimum ${conditions.minPhotos} photos required, got ${photoCount}`);
    }
  }

  // Check minimum questions for surveys
  if (conditions.minQuestions && activity.type === 'survey') {
    const questionCount = activity.data?.responses?.length || 0;
    if (questionCount < conditions.minQuestions) {
      errors.push(`Minimum ${conditions.minQuestions} questions required, got ${questionCount}`);
    }
  }

  // Check quantity limits
  if (conditions.minQuantity && activity.data?.quantity) {
    if (activity.data.quantity < conditions.minQuantity) {
      errors.push(`Minimum quantity ${conditions.minQuantity} required`);
    }
  }

  if (conditions.maxQuantity && activity.data?.quantity) {
    if (activity.data.quantity > conditions.maxQuantity) {
      errors.push(`Maximum quantity ${conditions.maxQuantity} exceeded`);
    }
  }

  // Check coverage for board placement
  if (conditions.minCoverage && activity.data?.boardCoverage) {
    if (activity.data.boardCoverage < conditions.minCoverage) {
      errors.push(`Minimum coverage ${conditions.minCoverage}% required`);
    }
  }

  // Check quality threshold
  if (conditions.qualityThreshold && activity.data?.qualityScore) {
    if (activity.data.qualityScore < conditions.qualityThreshold) {
      errors.push(`Quality score below threshold: ${activity.data.qualityScore}%`);
    }
  }

  // Check KYC requirement
  if (conditions.kycRequired && activity.type === 'customer_registration') {
    if (!activity.data?.kycCompleted) {
      errors.push('KYC completion required');
    }
  }

  // Check contact verification
  if (conditions.contactVerified && activity.type === 'customer_registration') {
    if (!activity.data?.contactVerified) {
      errors.push('Contact verification required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate tiered commission based on quantity or performance
 * @param {Object} activity - Activity data
 * @param {Object} rule - Tiered commission rule
 * @returns {number} Commission amount
 */
function calculateTieredCommission(activity, rule) {
  const quantity = activity.data?.quantity || 1;
  const tiers = rule.tiers || [
    { min: 1, max: 10, rate: rule.rate },
    { min: 11, max: 25, rate: rule.rate * 1.2 },
    { min: 26, max: 50, rate: rule.rate * 1.5 },
    { min: 51, max: Infinity, rate: rule.rate * 2.0 }
  ];

  let commission = 0;
  let remaining = quantity;

  for (const tier of tiers) {
    if (remaining <= 0) break;

    const tierQuantity = Math.min(remaining, tier.max - tier.min + 1);
    commission += tierQuantity * tier.rate;
    remaining -= tierQuantity;
  }

  return commission;
}

/**
 * Calculate quality-based commission adjustment
 * @param {number} qualityScore - Quality score (0-100)
 * @returns {Object} Quality adjustment
 */
function calculateQualityAdjustment(qualityScore) {
  let multiplier = 1.0;
  let reason = 'Standard quality';

  if (qualityScore >= 95) {
    multiplier = 1.2;
    reason = 'Excellent quality bonus (+20%)';
  } else if (qualityScore >= 85) {
    multiplier = 1.1;
    reason = 'Good quality bonus (+10%)';
  } else if (qualityScore < 70) {
    multiplier = 0.8;
    reason = 'Quality penalty (-20%)';
  } else if (qualityScore < 60) {
    multiplier = 0.5;
    reason = 'Poor quality penalty (-50%)';
  }

  return {
    type: 'quality_adjustment',
    multiplier,
    reason,
    qualityScore
  };
}

/**
 * Calculate performance bonuses
 * @param {Object} visit - Visit data
 * @param {Object} agent - Agent data
 * @param {Array} activityCommissions - Activity commissions
 * @returns {Array} Performance bonuses
 */
function calculatePerformanceBonuses(visit, agent, activityCommissions) {
  const bonuses = [];

  // This would typically query the database for agent performance
  // For now, we'll use mock data
  const agentStats = {
    dailyActivities: activityCommissions.length,
    weeklyActivities: 25, // Mock data
    monthlyActivities: 120, // Mock data
    averageQuality: 85 // Mock data
  };

  // Daily target bonus
  if (agentStats.dailyActivities >= PERFORMANCE_BONUSES.daily_target.threshold) {
    bonuses.push({
      type: 'daily_target',
      amount: PERFORMANCE_BONUSES.daily_target.bonus,
      reason: `Daily target achieved: ${agentStats.dailyActivities} activities`,
      threshold: PERFORMANCE_BONUSES.daily_target.threshold
    });
  }

  // Weekly target bonus
  if (agentStats.weeklyActivities >= PERFORMANCE_BONUSES.weekly_target.threshold) {
    bonuses.push({
      type: 'weekly_target',
      amount: PERFORMANCE_BONUSES.weekly_target.bonus,
      reason: `Weekly target achieved: ${agentStats.weeklyActivities} activities`,
      threshold: PERFORMANCE_BONUSES.weekly_target.threshold
    });
  }

  // Quality bonus
  if (agentStats.averageQuality >= PERFORMANCE_BONUSES.quality_bonus.threshold) {
    bonuses.push({
      type: 'quality_bonus',
      amount: PERFORMANCE_BONUSES.quality_bonus.bonus,
      reason: `Quality bonus: ${agentStats.averageQuality}% average quality`,
      threshold: PERFORMANCE_BONUSES.quality_bonus.threshold
    });
  }

  return bonuses;
}

/**
 * Calculate visit-level adjustments
 * @param {Object} visit - Visit data
 * @param {number} baseCommission - Base commission amount
 * @returns {Object} Visit adjustments
 */
function calculateVisitAdjustments(visit, baseCommission) {
  const adjustments = [];
  let totalAdjustment = 0;

  // Time-based adjustments
  const visitDuration = visit.endTime ? 
    new Date(visit.endTime).getTime() - new Date(visit.startTime).getTime() : 0;
  const durationMinutes = visitDuration / (1000 * 60);

  if (durationMinutes < 10) {
    // Penalty for very short visits
    const penalty = baseCommission * 0.1;
    adjustments.push({
      type: 'duration_penalty',
      amount: -penalty,
      reason: `Visit too short: ${Math.round(durationMinutes)} minutes`
    });
    totalAdjustment -= penalty;
  } else if (durationMinutes > 120) {
    // Bonus for thorough visits
    const bonus = baseCommission * 0.05;
    adjustments.push({
      type: 'thoroughness_bonus',
      amount: bonus,
      reason: `Thorough visit: ${Math.round(durationMinutes)} minutes`
    });
    totalAdjustment += bonus;
  }

  // Location accuracy adjustment
  if (visit.locationValidation && visit.locationValidation.accuracy > 50) {
    const penalty = baseCommission * 0.05;
    adjustments.push({
      type: 'location_accuracy_penalty',
      amount: -penalty,
      reason: `Poor GPS accuracy: ${visit.locationValidation.accuracy}m`
    });
    totalAdjustment -= penalty;
  }

  return {
    adjustment: Math.round(totalAdjustment * 100) / 100,
    details: adjustments
  };
}

/**
 * Generate commission report for agent
 * @param {string} agentId - Agent ID
 * @param {string} period - Report period (daily, weekly, monthly)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Commission report
 */
async function generateCommissionReport(agentId, period, startDate, endDate) {
  // This would typically query the database
  // For now, we'll return a mock report structure
  
  return {
    agentId,
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      totalCommission: 0,
      totalActivities: 0,
      averageCommissionPerActivity: 0,
      bonuses: 0,
      penalties: 0
    },
    breakdown: {
      byActivityType: {},
      byDay: [],
      byBrand: {}
    },
    performance: {
      targetsAchieved: [],
      qualityScore: 0,
      efficiency: 0
    },
    generatedAt: new Date().toISOString()
  };
}

/**
 * Process commission payment
 * @param {string} agentId - Agent ID
 * @param {number} amount - Commission amount
 * @param {string} period - Payment period
 * @returns {Object} Payment processing result
 */
async function processCommissionPayment(agentId, amount, period) {
  // This would integrate with payment processing system
  // For now, we'll return a mock payment result
  
  const paymentId = require('crypto').randomUUID();
  
  return {
    success: true,
    paymentId,
    agentId,
    amount,
    period,
    status: 'processed',
    processedAt: new Date().toISOString(),
    paymentMethod: 'bank_transfer', // Mock
    reference: `COMM_${agentId}_${period}_${Date.now()}`
  };
}

module.exports = {
  COMMISSION_TYPES,
  DEFAULT_COMMISSION_RATES,
  PERFORMANCE_BONUSES,
  calculateActivityCommission,
  calculateVisitCommission,
  validateActivityConditions,
  calculateTieredCommission,
  calculateQualityAdjustment,
  calculatePerformanceBonuses,
  calculateVisitAdjustments,
  generateCommissionReport,
  processCommissionPayment
};