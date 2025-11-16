# Survey Assignment System Design

## User Requirement
"In the field operations flow when the agent starts a visit how would we assign a survey to ask either the spaza or the individual. These can be different surveys"

## Existing Infrastructure Analysis

### Database Tables (Verified on Production)
1. **surveys** - Main survey definitions
   - Fields: id, tenant_id, title, description, type, category, status, start_date, end_date, created_by, created_at, updated_at
   - **Missing:** target_type field (need to add)

2. **survey_templates** - Survey templates with questions
   - Fields: id, tenant_id, name, description, survey_type, is_active, created_at, updated_at
   - Has survey_type field

3. **survey_questions** - Questions linked to templates
   - Fields: id, survey_template_id, question_text, question_type, options, is_required, sequence_order, dedupe_key, dedupe_scope, dedupe_across, created_at
   - Linked to survey_templates (not surveys directly)

4. **survey_responses** - Response tracking
   - Fields: id, survey_id, customer_id, user_id, completion_time, created_at
   - **Missing:** visit_id, subject_type, subject_id fields

5. **survey_assignments** - Agent-level assignments
   - Fields: id, survey_id, assignee_id, status, created_at
   - Purpose: Global assignment of surveys to agents (campaign-level)

6. **visits** - Visit records
   - Fields: id, tenant_id, customer_id, **subject_type**, **subject_id**, agent_id, visit_date, check_in_time, check_out_time, visit_type, status, notes, etc.
   - **Key:** Already has subject_type enum('customer','individual') and subject_id!

7. **individuals** - Individual people records (need to verify)
   - Purpose: Track individuals (shop owners, staff) separately from customers

### Mounted Routes
- `/api/surveys` - Survey management (surveys.js)
- `/api/visits-surveys` - Combined visits and surveys (visits-surveys.js)
- `/api/individuals` - Individual management (individuals.js)

## Design Solution

### 1. Database Schema Changes

#### Add target_type to surveys table
```sql
ALTER TABLE surveys 
ADD COLUMN target_type VARCHAR(50) DEFAULT 'both' 
CHECK (target_type IN ('business', 'individual', 'both'));
```

#### Create visit_surveys junction table
```sql
CREATE TABLE visit_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  subject_type VARCHAR(50) NOT NULL CHECK (subject_type IN ('business', 'individual')),
  subject_id UUID,
  required BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped')),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  survey_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visit_surveys_visit ON visit_surveys(visit_id);
CREATE INDEX idx_visit_surveys_survey ON visit_surveys(survey_id);
CREATE INDEX idx_visit_surveys_subject ON visit_surveys(tenant_id, subject_type, subject_id);
CREATE INDEX idx_visit_surveys_status ON visit_surveys(tenant_id, status);
```

#### Update survey_responses to link to visit_surveys
```sql
ALTER TABLE survey_responses 
ADD COLUMN visit_survey_id UUID REFERENCES visit_surveys(id) ON DELETE CASCADE,
ADD COLUMN subject_type VARCHAR(50),
ADD COLUMN subject_id UUID,
ADD COLUMN survey_version INTEGER DEFAULT 1;
```

### 2. Backend API Endpoints

#### Survey Assignment APIs (add to visits-surveys.js or create new route)

**GET /api/surveys?target_type=business|individual|both**
- Filter surveys by target type
- Used in visit creation to show available surveys

**POST /api/visits/:visitId/surveys**
- Assign surveys to a visit
- Body: `{ surveys: [{ survey_id, subject_type, subject_id, required }] }`

**GET /api/visits/:visitId/surveys**
- Get all surveys assigned to a visit
- Returns: List of assigned surveys with status

**PUT /api/visits/:visitId/surveys/:visitSurveyId**
- Update survey assignment status (in_progress, completed, skipped)

**DELETE /api/visits/:visitId/surveys/:visitSurveyId**
- Remove survey assignment from visit

**GET /api/surveys/:surveyId/questions**
- Get survey questions for filling out
- Returns: Survey with questions from survey_templates

**POST /api/visits/:visitId/surveys/:visitSurveyId/responses**
- Submit survey responses
- Body: `{ answers: [{ question_id, value }] }`

### 3. Frontend UI Changes

#### Visit Creation Flow (VisitCreate.tsx)
Add new step after basic visit info:

```tsx
// Step 1: Basic visit info (existing)
- visit_date
- agent_id
- customer_id
- visit_type
- notes

// Step 2: Assign Surveys (NEW)
- Business Surveys Panel
  - Show surveys where target_type IN ('business', 'both')
  - Auto-suggest based on customer type
  - Toggle required/optional
  
- Individual Surveys Panel
  - Select/add individual (from individuals table)
  - Show surveys where target_type IN ('individual', 'both')
  - Allow multiple individuals
  - Toggle required/optional per individual

// Step 3: Review & Create
```

#### Visit Detail/Edit Page
- Show assigned surveys with status badges
- Allow adding/removing surveys mid-visit
- Show completion progress

#### Survey Filling Page
- New page: `/field-operations/visits/:visitId/surveys/:visitSurveyId`
- Display survey questions
- Save responses
- Mark as completed

### 4. UX Flow

**Agent Starting a Visit:**
1. Navigate to Field Operations → Visits → Create Visit
2. Fill basic visit info (date, customer, type, notes)
3. Click "Next" to Assign Surveys step
4. **Business Surveys:**
   - System auto-suggests surveys based on customer type
   - Agent can add/remove surveys
   - Mark surveys as required or optional
5. **Individual Surveys:**
   - Agent selects individuals (shop owner, staff, etc.)
   - System shows available individual surveys
   - Agent assigns surveys to each individual
6. Click "Create Visit" to save
7. During visit, agent can:
   - Fill out assigned surveys
   - Skip optional surveys with reason
   - Add more surveys if needed

**Business Rules:**
- Required surveys must be completed before visit can be marked complete
- Optional surveys can be skipped
- Survey responses are versioned to handle survey definition changes
- Offline support: Prefetch survey definitions and queue responses

### 5. Implementation Plan

1. ✅ Check existing survey database schema
2. ✅ Design survey assignment system
3. ⏳ Implement database schema changes
4. ⏳ Create backend APIs for survey assignment
5. ⏳ Build frontend UI for survey selection in visit workflow
6. ⏳ Test survey assignment functionality
7. ⏳ Deploy and report completion

## Technical Notes

- **Versioning:** survey_version field prevents breaking historical data when survey questions change
- **Offline Support:** Field agents may work offline, so prefetch survey definitions and cache them
- **Response Shape:** Ensure consistent response shape (success, data: {...}) to avoid blank screens
- **Authentication:** Use req.user.tenantId consistently (some files use req.tenantId)
- **Service Worker:** Bump SW version when shipping new workflow steps for mobile agents
