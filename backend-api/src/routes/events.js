const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery } = require('../utils/database');

// Get all events
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { page = 1, limit = 10, status, type, start_date, end_date } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT e.*, u.first_name || ' ' || u.last_name as organizer_name
    FROM events e
    LEFT JOIN users u ON e.organizer_id = u.id
    WHERE e.tenant_id = ?
  `;
  
  const params = [tenantId];
  
  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }
  
  if (type) {
    query += ' AND e.type = ?';
    params.push(type);
  }
  
  if (start_date && end_date) {
    query += ' AND e.start_date >= ? AND e.end_date <= ?';
    params.push(start_date, end_date);
  }
  
  query += ' ORDER BY e.start_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const events = await getQuery(query, params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM events e WHERE e.tenant_id = ?';
  const countParams = [tenantId];
  
  if (status) {
    countQuery += ' AND e.status = ?';
    countParams.push(status);
  }
  
  if (type) {
    countQuery += ' AND e.type = ?';
    countParams.push(type);
  }
  
  if (start_date && end_date) {
    countQuery += ' AND e.start_date >= ? AND e.end_date <= ?';
    countParams.push(start_date, end_date);
  }
  
  const countResult = await getOneQuery(countQuery, countParams);
  const total = countResult ? countResult.total : 0;
  
  res.json({
    success: true,
    data: {
      events: events || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = db.prepare(`
      SELECT e.*, u.name as organizer_name, u.phone as organizer_phone
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `).get(id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get participants
    const participants = db.prepare(`
      SELECT ep.*, u.name, u.phone, u.email, ep.attendance_status
      FROM event_participants ep
      JOIN users u ON ep.participant_id = u.id
      WHERE ep.event_id = ?
    `).all(id);
    
    // Get resources
    const resources = db.prepare(`
      SELECT er.*, r.name as resource_name, r.type as resource_type
      FROM event_resources er
      LEFT JOIN resources r ON er.resource_id = r.id
      WHERE er.event_id = ?
    `).all(id);
    
    // Get performance metrics
    const performance = db.prepare(`
      SELECT * FROM event_performance WHERE event_id = ?
    `).get(id);
    
    res.json({
      ...event,
      participants,
      resources,
      performance
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      start_date,
      end_date,
      location,
      latitude,
      longitude,
      max_participants,
      budget,
      objectives,
      target_audience
    } = req.body;
    
    // Validate required fields
    if (!title || !type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Title, type, start date, and end date are required' });
    }
    
    // Validate dates
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    
    // Create event
    const result = db.prepare(`
      INSERT INTO events (
        title, description, type, start_date, end_date, location,
        latitude, longitude, max_participants, budget, objectives,
        target_audience, organizer_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      title, description, type, start_date, end_date, location,
      latitude, longitude, max_participants, budget, objectives,
      target_audience, req.user.id, 'planning'
    );
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      start_date,
      end_date,
      location,
      latitude,
      longitude,
      max_participants,
      budget,
      objectives,
      target_audience,
      status
    } = req.body;
    
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Update event
    db.prepare(`
      UPDATE events 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          location = COALESCE(?, location),
          latitude = COALESCE(?, latitude),
          longitude = COALESCE(?, longitude),
          max_participants = COALESCE(?, max_participants),
          budget = COALESCE(?, budget),
          objectives = COALESCE(?, objectives),
          target_audience = COALESCE(?, target_audience),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, description, type, start_date, end_date, location,
      latitude, longitude, max_participants, budget, objectives,
      target_audience, status, id
    );
    
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Add participant to event
router.post('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { participant_id, role = 'attendee', notes } = req.body;
    
    if (!participant_id) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }
    
    // Check if event exists
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if participant exists
    const participant = db.prepare('SELECT * FROM users WHERE id = ?').get(participant_id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    // Check if already registered
    const existing = db.prepare(`
      SELECT * FROM event_participants WHERE event_id = ? AND participant_id = ?
    `).get(id, participant_id);
    
    if (existing) {
      return res.status(400).json({ error: 'Participant already registered for this event' });
    }
    
    // Check capacity
    if (event.max_participants) {
      const currentCount = db.prepare(`
        SELECT COUNT(*) as count FROM event_participants WHERE event_id = ?
      `).get(id);
      
      if (currentCount.count >= event.max_participants) {
        return res.status(400).json({ error: 'Event is at maximum capacity' });
      }
    }
    
    // Add participant
    const result = db.prepare(`
      INSERT INTO event_participants (
        event_id, participant_id, role, notes, attendance_status, registered_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, participant_id, role, notes, 'registered');
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Participant added successfully'
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// Update participant attendance
router.patch('/:id/participants/:participantId/attendance', async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const { attendance_status, check_in_time, check_out_time, notes } = req.body;
    
    const validStatuses = ['registered', 'checked_in', 'checked_out', 'no_show'];
    if (!validStatuses.includes(attendance_status)) {
      return res.status(400).json({ error: 'Invalid attendance status' });
    }
    
    // Update attendance
    const result = db.prepare(`
      UPDATE event_participants 
      SET attendance_status = ?, 
          check_in_time = COALESCE(?, check_in_time),
          check_out_time = COALESCE(?, check_out_time),
          notes = COALESCE(?, notes)
      WHERE event_id = ? AND participant_id = ?
    `).run(attendance_status, check_in_time, check_out_time, notes, id, participantId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Participant not found for this event' });
    }
    
    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// Allocate resource to event
router.post('/:id/resources', async (req, res) => {
  try {
    const { id } = req.params;
    const { resource_id, quantity = 1, notes } = req.body;
    
    if (!resource_id) {
      return res.status(400).json({ error: 'Resource ID is required' });
    }
    
    // Check if event exists
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Allocate resource
    const result = db.prepare(`
      INSERT INTO event_resources (
        event_id, resource_id, quantity, notes, allocated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, resource_id, quantity, notes);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Resource allocated successfully'
    });
  } catch (error) {
    console.error('Error allocating resource:', error);
    res.status(500).json({ error: 'Failed to allocate resource' });
  }
});

// Get event analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { start_date, end_date, type } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND e.start_date >= ? AND e.end_date <= ?';
      params.push(start_date, end_date);
    }
    
    let typeFilter = '';
    if (type) {
      typeFilter = 'AND e.type = ?';
      params.push(type);
    }
    
    // Event statistics
    const eventStats = db.prepare(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_events,
        COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_events,
        COUNT(CASE WHEN e.status = 'cancelled' THEN 1 END) as cancelled_events,
        SUM(e.budget) as total_budget,
        AVG(e.budget) as avg_budget
      FROM events e
      WHERE 1=1 ${dateFilter} ${typeFilter}
    `).get(...params);
    
    // Participation statistics
    const participationStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT ep.participant_id) as total_participants,
        COUNT(CASE WHEN ep.attendance_status = 'checked_in' THEN 1 END) as attended,
        COUNT(CASE WHEN ep.attendance_status = 'no_show' THEN 1 END) as no_shows,
        ROUND(AVG(CASE WHEN ep.attendance_status = 'checked_in' THEN 1.0 ELSE 0.0 END) * 100, 2) as attendance_rate
      FROM event_participants ep
      JOIN events e ON ep.event_id = e.id
      WHERE 1=1 ${dateFilter} ${typeFilter}
    `).get(...params);
    
    // Event types breakdown
    const typeBreakdown = db.prepare(`
      SELECT 
        e.type,
        COUNT(*) as event_count,
        SUM(e.budget) as total_budget,
        COUNT(DISTINCT ep.participant_id) as total_participants
      FROM events e
      LEFT JOIN event_participants ep ON e.id = ep.event_id
      WHERE 1=1 ${dateFilter} ${typeFilter}
      GROUP BY e.type
      ORDER BY event_count DESC
    `).all(...params);
    
    res.json({
      event_stats: eventStats,
      participation_stats: participationStats,
      type_breakdown: typeBreakdown
    });
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    res.status(500).json({ error: 'Failed to fetch event analytics' });
  }
});

// Record event performance
router.post('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      attendance_count,
      satisfaction_score,
      objectives_met,
      feedback_summary,
      roi_score,
      follow_up_actions
    } = req.body;
    
    // Check if event exists
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Insert or update performance record
    const existing = db.prepare('SELECT * FROM event_performance WHERE event_id = ?').get(id);
    
    if (existing) {
      // Update existing record
      db.prepare(`
        UPDATE event_performance 
        SET attendance_count = COALESCE(?, attendance_count),
            satisfaction_score = COALESCE(?, satisfaction_score),
            objectives_met = COALESCE(?, objectives_met),
            feedback_summary = COALESCE(?, feedback_summary),
            roi_score = COALESCE(?, roi_score),
            follow_up_actions = COALESCE(?, follow_up_actions),
            updated_at = CURRENT_TIMESTAMP
        WHERE event_id = ?
      `).run(
        attendance_count, satisfaction_score, objectives_met,
        feedback_summary, roi_score, follow_up_actions, id
      );
    } else {
      // Create new record
      db.prepare(`
        INSERT INTO event_performance (
          event_id, attendance_count, satisfaction_score, objectives_met,
          feedback_summary, roi_score, follow_up_actions, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        id, attendance_count, satisfaction_score, objectives_met,
        feedback_summary, roi_score, follow_up_actions
      );
    }
    
    res.json({ message: 'Event performance recorded successfully' });
  } catch (error) {
    console.error('Error recording event performance:', error);
    res.status(500).json({ error: 'Failed to record event performance' });
  }
});

// GET /api/events/stats - Event statistics
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    const [eventCounts, typeBreakdown, attendance, upcomingEvents] = await Promise.all([
      getOneQuery(`
        SELECT 
          COUNT(*)::int as total_events,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END)::int as scheduled_events,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed_events,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled_events
        FROM events WHERE tenant_id = $1
      `, [tenantId]).then(row => row || {}),
      
      getQuery(`
        SELECT type, COUNT(*)::int as count
        FROM events WHERE tenant_id = $1
        GROUP BY type
      `, [tenantId]).then(rows => rows || []),
      
      getOneQuery(`
        SELECT 
          COUNT(DISTINCT ea.id)::int as total_attendees,
          COUNT(DISTINCT ea.customer_id)::int as unique_customers,
          AVG(CASE WHEN e.expected_attendance > 0 THEN (COUNT_ATTENDEES * 100.0 / e.expected_attendance) END)::float8 as avg_attendance_rate
        FROM events e
        LEFT JOIN event_attendees ea ON e.id = ea.event_id
        WHERE e.tenant_id = $1
      `, [tenantId]).then(row => row || {}),
      
      getQuery(`
        SELECT 
          e.id, e.name, e.type, e.event_date, e.location,
          COUNT(ea.id)::int as attendee_count
        FROM events e
        LEFT JOIN event_attendees ea ON e.id = ea.event_id
        WHERE e.tenant_id = $1 AND e.event_date >= CURRENT_DATE
        GROUP BY e.id, e.name, e.type, e.event_date, e.location
        ORDER BY e.event_date ASC
        LIMIT 10
      `, [tenantId]).then(rows => rows || [])
    ]);
    
    res.json({
      success: true,
      data: {
        events: eventCounts,
        typeBreakdown,
        attendance: {
          ...attendance,
          avg_attendance_rate: parseFloat((attendance.avg_attendance_rate || 0).toFixed(2))
        },
        upcomingEvents
      }
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch event statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
