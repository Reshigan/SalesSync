/**
 * Fraud Detection Service
 * Implements duplicate visit prevention and fraud detection for field operations
 */

const crypto = require('crypto');
const { getDatabase } = require('../database/connection');

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number to normalize
 * @param {string} defaultCountryCode - Default country code (e.g., '+27' for South Africa)
 * @returns {string} Normalized phone number
 */
function normalizePhone(phone, defaultCountryCode = '+27') {
  if (!phone) return null;
  
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode.replace('+', '') + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith(defaultCountryCode.replace('+', ''))) {
    cleaned = defaultCountryCode.replace('+', '') + cleaned;
  }
  
  return '+' + cleaned;
}

/**
 * Hash ID number for privacy
 * @param {string} idNumber - ID number to hash
 * @returns {string} SHA-256 hash
 */
function hashIdNumber(idNumber) {
  if (!idNumber) return null;
  return crypto.createHash('sha256').update(idNumber).digest('hex');
}

/**
 * Check for duplicate visit
 * @param {Object} params - Visit parameters
 * @returns {Object} { isDuplicate: boolean, reason: string, existingVisit: Object }
 */
async function checkDuplicateVisit(params) {
  const {
    tenantId,
    agentId,
    subjectType,
    subjectId,
    lat,
    lng,
    gpsAccuracy,
    timestamp
  } = params;

  const db = getDatabase();
  const visitDate = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
  
  const fraudIndicators = [];
  let fraudScore = 0.0;

  const existingVisitToday = db.prepare(`
    SELECT * FROM dedupe_registry
    WHERE tenant_id = ? AND agent_id = ? AND subject_type = ? AND subject_id = ? AND visit_date = ?
    LIMIT 1
  `).get(tenantId, agentId, subjectType, subjectId, visitDate);

  if (existingVisitToday) {
    return {
      isDuplicate: true,
      reason: 'DUPLICATE_VISIT_SAME_DAY',
      message: 'You have already visited this location today',
      existingVisit: existingVisitToday,
      fraudScore: 0.9
    };
  }

  if (subjectType === 'individual' && lat && lng) {
    const sixtyMinutesAgo = new Date(new Date(timestamp).getTime() - 60 * 60 * 1000).toISOString();
    
    const nearbyRecentVisits = db.prepare(`
      SELECT * FROM dedupe_registry
      WHERE tenant_id = ? AND subject_type = 'individual' 
        AND visit_timestamp > ? 
        AND lat IS NOT NULL AND lng IS NOT NULL
    `).all(tenantId, sixtyMinutesAgo);

    for (const visit of nearbyRecentVisits) {
      const distance = calculateDistance(lat, lng, visit.lat, visit.lng);
      if (distance <= 20) { // Within 20 meters
        fraudIndicators.push({
          type: 'GPS_PROXIMITY_DUPLICATE',
          distance: Math.round(distance),
          timeDiff: Math.round((new Date(timestamp) - new Date(visit.visit_timestamp)) / 60000),
          existingVisitId: visit.id
        });
        fraudScore += 0.7;
      }
    }
  }

  if (gpsAccuracy && gpsAccuracy > 20) {
    fraudIndicators.push({
      type: 'LOW_GPS_ACCURACY',
      accuracy: gpsAccuracy,
      threshold: 20
    });
    fraudScore += 0.3;
  }

  if (subjectType === 'individual') {
    const fiveMinutesAgo = new Date(new Date(timestamp).getTime() - 5 * 60 * 1000).toISOString();
    
    const recentVisitCount = db.prepare(`
      SELECT COUNT(*) as count FROM dedupe_registry
      WHERE tenant_id = ? AND agent_id = ? AND subject_type = 'individual'
        AND visit_timestamp > ?
    `).get(tenantId, agentId, fiveMinutesAgo);

    if (recentVisitCount.count > 0) {
      fraudIndicators.push({
        type: 'RAPID_SUCCESSION_VISITS',
        count: recentVisitCount.count,
        timeWindow: 5
      });
      fraudScore += 0.5;
    }
  }

  fraudScore = Math.min(fraudScore, 1.0);

  return {
    isDuplicate: fraudScore >= 0.7, // Threshold for blocking
    reason: fraudScore >= 0.7 ? 'FRAUD_DETECTED' : null,
    message: fraudScore >= 0.7 ? 'This visit has been flagged for potential fraud' : null,
    fraudIndicators,
    fraudScore,
    requiresReview: fraudScore >= 0.5 // Lower threshold for review
  };
}

/**
 * Register a visit in the dedupe registry
 * @param {Object} params - Visit parameters
 */
async function registerVisit(params) {
  const {
    tenantId,
    agentId,
    subjectType,
    subjectId,
    lat,
    lng,
    gpsAccuracy,
    timestamp
  } = params;

  const db = getDatabase();
  const visitDate = new Date(timestamp).toISOString().split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO dedupe_registry (
      tenant_id, subject_type, subject_id, agent_id,
      visit_date, visit_timestamp, lat, lng, gps_accuracy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    tenantId,
    subjectType,
    subjectId,
    agentId,
    visitDate,
    timestamp,
    lat || null,
    lng || null,
    gpsAccuracy || null
  );
}

/**
 * Check for duplicate survey submission
 * @param {Object} params - Survey parameters
 * @returns {Object} { isDuplicate: boolean, reason: string }
 */
async function checkDuplicateSurvey(params) {
  const {
    tenantId,
    surveyTemplateId,
    subjectType,
    subjectId,
    agentId,
    answers,
    timestamp
  } = params;

  const db = getDatabase();

  const dedupeQuestions = db.prepare(`
    SELECT id, dedupe_key, dedupe_scope, dedupe_across
    FROM survey_questions
    WHERE survey_template_id = ? AND dedupe_key = 1
  `).all(surveyTemplateId);

  if (dedupeQuestions.length === 0) {
    return { isDuplicate: false }; // No deduplication configured
  }

  const dedupeKeyParts = [];
  for (const question of dedupeQuestions) {
    const answer = answers.find(a => a.question_id === question.id);
    if (answer) {
      dedupeKeyParts.push(`${question.id}:${answer.value}`);
    }
  }

  if (dedupeKeyParts.length === 0) {
    return { isDuplicate: false }; // No dedupe key values provided
  }

  const dedupeKeyHash = crypto.createHash('sha256')
    .update(dedupeKeyParts.join('|'))
    .digest('hex');

  const scope = dedupeQuestions[0].dedupe_scope; // Use first question's scope
  const across = dedupeQuestions[0].dedupe_across;

  let scopeCondition = '';
  const submissionDate = new Date(timestamp).toISOString().split('T')[0];

  if (scope === 'day') {
    scopeCondition = `AND submission_date = '${submissionDate}'`;
  } else if (scope === 'week') {
    const weekAgo = new Date(new Date(timestamp).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    scopeCondition = `AND submission_date >= '${weekAgo}'`;
  } else if (scope === 'month') {
    const monthAgo = new Date(new Date(timestamp).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    scopeCondition = `AND submission_date >= '${monthAgo}'`;
  }

  let acrossCondition = '';
  if (across === 'subject') {
    acrossCondition = `AND subject_type = '${subjectType}' AND subject_id = '${subjectId}'`;
  } else if (across === 'agent') {
    acrossCondition = `AND agent_id = '${agentId}'`;
  }

  const query = `
    SELECT * FROM survey_dedupe_registry
    WHERE tenant_id = ? AND survey_template_id = ? AND dedupe_key_hash = ?
    ${scopeCondition} ${acrossCondition}
    LIMIT 1
  `;

  const existingSubmission = db.prepare(query).get(tenantId, surveyTemplateId, dedupeKeyHash);

  if (existingSubmission) {
    return {
      isDuplicate: true,
      reason: 'DUPLICATE_SURVEY_SUBMISSION',
      message: `This survey has already been submitted ${scope === 'day' ? 'today' : scope === 'week' ? 'this week' : scope === 'month' ? 'this month' : 'before'}`,
      existingSubmission
    };
  }

  return { isDuplicate: false };
}

/**
 * Register a survey submission in the dedupe registry
 * @param {Object} params - Survey parameters
 */
async function registerSurveySubmission(params) {
  const {
    tenantId,
    surveyTemplateId,
    subjectType,
    subjectId,
    agentId,
    answers,
    timestamp
  } = params;

  const db = getDatabase();

  const dedupeQuestions = db.prepare(`
    SELECT id FROM survey_questions
    WHERE survey_template_id = ? AND dedupe_key = 1
  `).all(surveyTemplateId);

  if (dedupeQuestions.length === 0) {
    return; // No deduplication configured
  }

  const dedupeKeyParts = [];
  for (const question of dedupeQuestions) {
    const answer = answers.find(a => a.question_id === question.id);
    if (answer) {
      dedupeKeyParts.push(`${question.id}:${answer.value}`);
    }
  }

  if (dedupeKeyParts.length === 0) {
    return; // No dedupe key values provided
  }

  const dedupeKeyHash = crypto.createHash('sha256')
    .update(dedupeKeyParts.join('|'))
    .digest('hex');

  const submissionDate = new Date(timestamp).toISOString().split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO survey_dedupe_registry (
      tenant_id, survey_template_id, subject_type, subject_id, agent_id,
      dedupe_key_hash, submission_date, submission_timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    tenantId,
    surveyTemplateId,
    subjectType,
    subjectId,
    agentId || null,
    dedupeKeyHash,
    submissionDate,
    timestamp
  );
}

module.exports = {
  calculateDistance,
  normalizePhone,
  hashIdNumber,
  checkDuplicateVisit,
  registerVisit,
  checkDuplicateSurvey,
  registerSurveySubmission
};
