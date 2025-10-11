/**
 * Visit Workflow Engine for Field Marketing Agents
 * Handles structured visit processes, activity validation, and workflow management
 */

const { validateAgentLocation } = require('./gpsValidation');

/**
 * Visit workflow states and transitions
 */
const VISIT_STATES = {
  INITIATED: 'initiated',
  LOCATION_VALIDATED: 'location_validated',
  CUSTOMER_IDENTIFIED: 'customer_identified',
  BRANDS_SELECTED: 'brands_selected',
  ACTIVITIES_IN_PROGRESS: 'activities_in_progress',
  ACTIVITIES_COMPLETED: 'activities_completed',
  VISIT_COMPLETED: 'visit_completed',
  VISIT_CANCELLED: 'visit_cancelled'
};

const ACTIVITY_TYPES = {
  SURVEY: 'survey',
  BOARD_PLACEMENT: 'board_placement',
  PRODUCT_DISTRIBUTION: 'product_distribution',
  MERCHANDISING: 'merchandising',
  PHOTO_CAPTURE: 'photo_capture',
  CUSTOMER_REGISTRATION: 'customer_registration'
};

const ACTIVITY_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  FAILED: 'failed'
};

/**
 * Create a new visit workflow
 * @param {Object} visitData - Visit initialization data
 * @returns {Object} Visit workflow object
 */
function createVisitWorkflow(visitData) {
  const {
    agentId,
    customerId,
    customerType = 'existing', // 'existing' or 'new'
    agentLocation,
    brands = [],
    visitType,
    mandatoryActivities = []
  } = visitData;

  const visitId = require('crypto').randomUUID();
  const timestamp = new Date().toISOString();

  return {
    visitId,
    agentId,
    customerId,
    customerType,
    state: VISIT_STATES.INITIATED,
    visitType,
    brands,
    agentLocation,
    startTime: timestamp,
    endTime: null,
    activities: generateActivityList(brands, visitType, mandatoryActivities),
    validations: {
      locationValidated: false,
      customerIdentified: customerType === 'existing',
      brandsSelected: brands.length > 0,
      mandatoryActivitiesCompleted: false
    },
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    }
  };
}

/**
 * Generate activity list based on brands and visit type
 * @param {Array} brands - Selected brands
 * @param {string} visitType - Type of visit
 * @param {Array} mandatoryActivities - Mandatory activities
 * @returns {Array} List of activities
 */
function generateActivityList(brands, visitType, mandatoryActivities = []) {
  const activities = [];

  // Add mandatory activities
  mandatoryActivities.forEach(activity => {
    activities.push({
      id: require('crypto').randomUUID(),
      type: activity.type,
      brandId: activity.brandId || null,
      title: activity.title,
      description: activity.description,
      mandatory: true,
      status: ACTIVITY_STATUS.PENDING,
      estimatedDuration: activity.estimatedDuration || 5, // minutes
      commission: activity.commission || 0,
      requirements: activity.requirements || [],
      data: null,
      startTime: null,
      endTime: null
    });
  });

  // Add brand-specific activities
  brands.forEach(brand => {
    // Survey activity for each brand
    activities.push({
      id: require('crypto').randomUUID(),
      type: ACTIVITY_TYPES.SURVEY,
      brandId: brand.id,
      title: `${brand.name} Brand Survey`,
      description: `Complete customer survey for ${brand.name}`,
      mandatory: true,
      status: ACTIVITY_STATUS.PENDING,
      estimatedDuration: 10,
      commission: 5.00,
      requirements: ['customer_consent'],
      data: null,
      startTime: null,
      endTime: null
    });

    // Board placement activity
    if (visitType === 'board_placement' || visitType === 'full_activation') {
      activities.push({
        id: require('crypto').randomUUID(),
        type: ACTIVITY_TYPES.BOARD_PLACEMENT,
        brandId: brand.id,
        title: `${brand.name} Board Placement`,
        description: `Install and photograph ${brand.name} promotional board`,
        mandatory: true,
        status: ACTIVITY_STATUS.PENDING,
        estimatedDuration: 15,
        commission: 10.00,
        requirements: ['board_available', 'customer_permission', 'photo_required'],
        data: null,
        startTime: null,
        endTime: null
      });
    }

    // Product distribution activity
    if (visitType === 'product_distribution' || visitType === 'full_activation') {
      activities.push({
        id: require('crypto').randomUUID(),
        type: ACTIVITY_TYPES.PRODUCT_DISTRIBUTION,
        brandId: brand.id,
        title: `${brand.name} Product Distribution`,
        description: `Distribute ${brand.name} products/samples`,
        mandatory: false,
        status: ACTIVITY_STATUS.PENDING,
        estimatedDuration: 5,
        commission: 0.50, // per unit
        requirements: ['products_available', 'customer_consent'],
        data: null,
        startTime: null,
        endTime: null
      });
    }
  });

  // Add general activities
  activities.push({
    id: require('crypto').randomUUID(),
    type: ACTIVITY_TYPES.PHOTO_CAPTURE,
    brandId: null,
    title: 'Store Front Photo',
    description: 'Capture store front and interior photos',
    mandatory: true,
    status: ACTIVITY_STATUS.PENDING,
    estimatedDuration: 3,
    commission: 2.00,
    requirements: ['camera_available'],
    data: null,
    startTime: null,
    endTime: null
  });

  return activities;
}

/**
 * Validate visit location
 * @param {Object} workflow - Visit workflow object
 * @param {Object} customerLocation - Customer's stored location
 * @returns {Object} Updated workflow with validation results
 */
async function validateVisitLocation(workflow, customerLocation) {
  const validation = validateAgentLocation(
    workflow.agentLocation,
    customerLocation,
    10 // 10-meter radius
  );

  workflow.validations.locationValidated = validation.isValid;
  workflow.locationValidation = validation;

  if (validation.isValid) {
    workflow.state = VISIT_STATES.LOCATION_VALIDATED;
  }

  workflow.metadata.updatedAt = new Date().toISOString();
  return workflow;
}

/**
 * Start an activity
 * @param {Object} workflow - Visit workflow object
 * @param {string} activityId - Activity ID to start
 * @returns {Object} Updated workflow
 */
function startActivity(workflow, activityId) {
  const activity = workflow.activities.find(a => a.id === activityId);
  
  if (!activity) {
    throw new Error('Activity not found');
  }

  if (activity.status !== ACTIVITY_STATUS.PENDING) {
    throw new Error('Activity is not in pending state');
  }

  // Check requirements
  const unmetRequirements = checkActivityRequirements(activity, workflow);
  if (unmetRequirements.length > 0) {
    throw new Error(`Unmet requirements: ${unmetRequirements.join(', ')}`);
  }

  activity.status = ACTIVITY_STATUS.IN_PROGRESS;
  activity.startTime = new Date().toISOString();

  // Update workflow state
  if (workflow.state === VISIT_STATES.BRANDS_SELECTED) {
    workflow.state = VISIT_STATES.ACTIVITIES_IN_PROGRESS;
  }

  workflow.metadata.updatedAt = new Date().toISOString();
  return workflow;
}

/**
 * Complete an activity
 * @param {Object} workflow - Visit workflow object
 * @param {string} activityId - Activity ID to complete
 * @param {Object} activityData - Activity completion data
 * @returns {Object} Updated workflow
 */
function completeActivity(workflow, activityId, activityData) {
  const activity = workflow.activities.find(a => a.id === activityId);
  
  if (!activity) {
    throw new Error('Activity not found');
  }

  if (activity.status !== ACTIVITY_STATUS.IN_PROGRESS) {
    throw new Error('Activity is not in progress');
  }

  // Validate activity data
  const validation = validateActivityData(activity, activityData);
  if (!validation.isValid) {
    throw new Error(`Invalid activity data: ${validation.errors.join(', ')}`);
  }

  activity.status = ACTIVITY_STATUS.COMPLETED;
  activity.endTime = new Date().toISOString();
  activity.data = activityData;

  // Check if all mandatory activities are completed
  const mandatoryActivities = workflow.activities.filter(a => a.mandatory);
  const completedMandatory = mandatoryActivities.filter(a => a.status === ACTIVITY_STATUS.COMPLETED);
  
  workflow.validations.mandatoryActivitiesCompleted = 
    completedMandatory.length === mandatoryActivities.length;

  // Update workflow state
  if (workflow.validations.mandatoryActivitiesCompleted) {
    const allActivities = workflow.activities;
    const completedActivities = allActivities.filter(a => 
      a.status === ACTIVITY_STATUS.COMPLETED || a.status === ACTIVITY_STATUS.SKIPPED
    );

    if (completedActivities.length === allActivities.length) {
      workflow.state = VISIT_STATES.ACTIVITIES_COMPLETED;
    }
  }

  workflow.metadata.updatedAt = new Date().toISOString();
  return workflow;
}

/**
 * Check activity requirements
 * @param {Object} activity - Activity object
 * @param {Object} workflow - Visit workflow object
 * @returns {Array} List of unmet requirements
 */
function checkActivityRequirements(activity, workflow) {
  const unmetRequirements = [];

  activity.requirements.forEach(requirement => {
    switch (requirement) {
      case 'customer_consent':
        // Check if customer consent is recorded
        if (!workflow.customerConsent) {
          unmetRequirements.push('Customer consent required');
        }
        break;
      case 'location_validated':
        if (!workflow.validations.locationValidated) {
          unmetRequirements.push('Location validation required');
        }
        break;
      case 'photo_required':
        // Will be validated during activity completion
        break;
      case 'board_available':
        // Check inventory or agent equipment
        break;
      case 'products_available':
        // Check product inventory
        break;
      case 'camera_available':
        // Check device capabilities
        break;
      default:
        // Custom requirements can be added here
        break;
    }
  });

  return unmetRequirements;
}

/**
 * Validate activity completion data
 * @param {Object} activity - Activity object
 * @param {Object} data - Activity data to validate
 * @returns {Object} Validation result
 */
function validateActivityData(activity, data) {
  const errors = [];

  switch (activity.type) {
    case ACTIVITY_TYPES.SURVEY:
      if (!data.responses || !Array.isArray(data.responses)) {
        errors.push('Survey responses are required');
      }
      break;

    case ACTIVITY_TYPES.BOARD_PLACEMENT:
      if (!data.photos || data.photos.length === 0) {
        errors.push('Board placement photos are required');
      }
      if (!data.boardCoverage || data.boardCoverage < 0 || data.boardCoverage > 100) {
        errors.push('Valid board coverage percentage is required');
      }
      break;

    case ACTIVITY_TYPES.PRODUCT_DISTRIBUTION:
      if (!data.quantity || data.quantity <= 0) {
        errors.push('Product quantity must be greater than 0');
      }
      if (!data.products || !Array.isArray(data.products)) {
        errors.push('Product list is required');
      }
      break;

    case ACTIVITY_TYPES.PHOTO_CAPTURE:
      if (!data.photos || data.photos.length === 0) {
        errors.push('Photos are required');
      }
      break;

    case ACTIVITY_TYPES.CUSTOMER_REGISTRATION:
      if (!data.customerDetails) {
        errors.push('Customer details are required');
      }
      break;

    default:
      // Custom validation can be added here
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Complete visit workflow
 * @param {Object} workflow - Visit workflow object
 * @param {Object} completionData - Visit completion data
 * @returns {Object} Completed workflow with commission calculation
 */
function completeVisit(workflow, completionData = {}) {
  // Validate that all mandatory activities are completed
  if (!workflow.validations.mandatoryActivitiesCompleted) {
    throw new Error('All mandatory activities must be completed before finishing visit');
  }

  // Calculate total commission
  const totalCommission = calculateVisitCommission(workflow);

  workflow.state = VISIT_STATES.VISIT_COMPLETED;
  workflow.endTime = new Date().toISOString();
  workflow.completionData = completionData;
  workflow.totalCommission = totalCommission;
  workflow.metadata.updatedAt = new Date().toISOString();

  return workflow;
}

/**
 * Calculate commission for completed visit
 * @param {Object} workflow - Visit workflow object
 * @returns {number} Total commission amount
 */
function calculateVisitCommission(workflow) {
  let totalCommission = 0;

  workflow.activities.forEach(activity => {
    if (activity.status === ACTIVITY_STATUS.COMPLETED) {
      if (activity.type === ACTIVITY_TYPES.PRODUCT_DISTRIBUTION && activity.data) {
        // Commission per unit for product distribution
        totalCommission += (activity.data.quantity || 0) * activity.commission;
      } else {
        // Fixed commission for other activities
        totalCommission += activity.commission;
      }
    }
  });

  return Math.round(totalCommission * 100) / 100; // Round to 2 decimal places
}

/**
 * Get visit workflow summary
 * @param {Object} workflow - Visit workflow object
 * @returns {Object} Visit summary
 */
function getVisitSummary(workflow) {
  const totalActivities = workflow.activities.length;
  const completedActivities = workflow.activities.filter(a => a.status === ACTIVITY_STATUS.COMPLETED).length;
  const mandatoryActivities = workflow.activities.filter(a => a.mandatory).length;
  const completedMandatory = workflow.activities.filter(a => a.mandatory && a.status === ACTIVITY_STATUS.COMPLETED).length;

  const duration = workflow.endTime ? 
    new Date(workflow.endTime).getTime() - new Date(workflow.startTime).getTime() : 
    Date.now() - new Date(workflow.startTime).getTime();

  return {
    visitId: workflow.visitId,
    agentId: workflow.agentId,
    customerId: workflow.customerId,
    state: workflow.state,
    duration: Math.round(duration / 1000 / 60), // minutes
    progress: {
      totalActivities,
      completedActivities,
      mandatoryActivities,
      completedMandatory,
      completionPercentage: Math.round((completedActivities / totalActivities) * 100)
    },
    commission: workflow.totalCommission || 0,
    brands: workflow.brands,
    validations: workflow.validations
  };
}

module.exports = {
  VISIT_STATES,
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  createVisitWorkflow,
  generateActivityList,
  validateVisitLocation,
  startActivity,
  completeActivity,
  completeVisit,
  calculateVisitCommission,
  getVisitSummary,
  checkActivityRequirements,
  validateActivityData
};