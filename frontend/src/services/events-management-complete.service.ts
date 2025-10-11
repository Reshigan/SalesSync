// Complete Events Management System - Enterprise Implementation
import apiClient from '@/lib/api-client'

export interface Event {
  id: string
  name: string
  description: string
  type: 'trade_show' | 'product_launch' | 'training' | 'conference' | 'workshop' | 'webinar' | 'networking' | 'customer_event'
  category: 'internal' | 'external' | 'hybrid' | 'virtual' | 'physical'
  status: 'planning' | 'scheduled' | 'active' | 'completed' | 'cancelled' | 'postponed'
  brandId: string
  brand: Brand
  organizer: EventOrganizer
  venue: EventVenue
  schedule: EventSchedule
  agenda: EventAgenda
  speakers: EventSpeaker[]
  attendees: EventAttendee[]
  registration: EventRegistration
  marketing: EventMarketing
  logistics: EventLogistics
  budget: EventBudget
  resources: EventResource[]
  materials: EventMaterial[]
  technology: EventTechnology
  catering: EventCatering
  accommodation: EventAccommodation
  transportation: EventTransportation
  security: EventSecurity
  compliance: EventCompliance
  feedback: EventFeedback
  analytics: EventAnalytics
  roi: EventROI
  followUp: EventFollowUp
  documentation: EventDocumentation
  approvals: EventApproval[]
  stakeholders: EventStakeholder[]
  sponsors: EventSponsor[]
  partners: EventPartner[]
  media: EventMedia
  social: EventSocial
  networking: EventNetworking
  gamification: EventGamification
  personalization: EventPersonalization
  automation: EventAutomation
  integration: EventIntegration
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface EventVenue {
  id: string
  name: string
  type: 'conference_center' | 'hotel' | 'exhibition_hall' | 'office' | 'outdoor' | 'virtual' | 'hybrid'
  address: VenueAddress
  location: GeoLocation
  capacity: VenueCapacity
  facilities: VenueFacility[]
  amenities: VenueAmenity[]
  accessibility: VenueAccessibility
  technology: VenueTechnology
  catering: VenueCatering
  parking: VenueParking
  transportation: VenueTransportation
  policies: VenuePolicy[]
  contacts: VenueContact[]
  pricing: VenuePricing
  availability: VenueAvailability[]
  reviews: VenueReview[]
  photos: string[]
  floorPlans: string[]
  virtualTour?: string
  sustainability: VenueSustainability
  covid19: VenueCovid19Measures
}

export interface EventSchedule {
  startDate: string
  endDate: string
  timezone: string
  duration: number
  sessions: EventSession[]
  breaks: EventBreak[]
  networking: NetworkingSession[]
  meals: MealSession[]
  setup: SetupSchedule
  teardown: TeardownSchedule
  rehearsals: RehearsalSchedule[]
  contingency: ContingencyPlan[]
}

export interface EventSession {
  id: string
  title: string
  description: string
  type: 'presentation' | 'workshop' | 'panel' | 'demo' | 'networking' | 'break' | 'meal'
  startTime: string
  endTime: string
  duration: number
  room: string
  capacity: number
  speakers: string[]
  moderator?: string
  format: 'in_person' | 'virtual' | 'hybrid'
  recording: boolean
  streaming: boolean
  interactive: boolean
  materials: SessionMaterial[]
  requirements: SessionRequirement[]
  agenda: SessionAgenda[]
  objectives: SessionObjective[]
  outcomes: SessionOutcome[]
  feedback: SessionFeedback[]
  attendance: SessionAttendance
  engagement: SessionEngagement
  technology: SessionTechnology
  accessibility: SessionAccessibility
}

export interface EventAttendee {
  id: string
  userId?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  title?: string
  department?: string
  industry?: string
  country?: string
  registrationDate: string
  registrationSource: string
  ticketType: string
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled'
  checkInStatus: 'not_checked_in' | 'checked_in' | 'checked_out'
  checkInTime?: string
  checkOutTime?: string
  sessions: AttendeeSession[]
  preferences: AttendeePreferences
  dietary: DietaryRequirement[]
  accessibility: AccessibilityRequirement[]
  accommodation?: AttendeeAccommodation
  transportation?: AttendeeTransportation
  networking: AttendeeNetworking
  engagement: AttendeeEngagement
  feedback: AttendeeFeedback[]
  certificates: AttendeeCertificate[]
  followUp: AttendeeFollowUp
  tags: string[]
  notes: string
  customFields: Record<string, any>
}

export interface EventRegistration {
  enabled: boolean
  type: 'free' | 'paid' | 'invitation_only' | 'approval_required'
  capacity: number
  registered: number
  waitlist: number
  pricing: RegistrationPricing[]
  discounts: RegistrationDiscount[]
  form: RegistrationForm
  workflow: RegistrationWorkflow
  confirmation: RegistrationConfirmation
  reminders: RegistrationReminder[]
  cancellation: RegistrationCancellation
  refund: RegistrationRefund
  integration: RegistrationIntegration
  analytics: RegistrationAnalytics
  automation: RegistrationAutomation
}

export interface EventMarketing {
  strategy: MarketingStrategy
  campaigns: MarketingCampaign[]
  channels: MarketingChannel[]
  content: MarketingContent[]
  social: SocialMediaMarketing
  email: EmailMarketing
  advertising: AdvertisingCampaign[]
  pr: PublicRelations
  influencer: InfluencerMarketing
  partnerships: MarketingPartnership[]
  branding: EventBranding
  messaging: EventMessaging
  timeline: MarketingTimeline
  budget: MarketingBudget
  analytics: MarketingAnalytics
  automation: MarketingAutomation
}

export interface EventLogistics {
  planning: LogisticsPlanning
  coordination: LogisticsCoordination
  suppliers: LogisticsSupplier[]
  equipment: LogisticsEquipment[]
  setup: LogisticsSetup
  operations: LogisticsOperations
  teardown: LogisticsTeardown
  shipping: LogisticsShipping
  storage: LogisticsStorage
  inventory: LogisticsInventory
  timeline: LogisticsTimeline
  contingency: LogisticsContingency[]
  tracking: LogisticsTracking
  quality: LogisticsQuality
  sustainability: LogisticsSustainability
}

export interface EventBudget {
  total: number
  categories: BudgetCategory[]
  allocated: number
  spent: number
  committed: number
  remaining: number
  variance: number
  forecasted: number
  approvals: BudgetApproval[]
  tracking: BudgetTracking[]
  reporting: BudgetReporting
  controls: BudgetControl[]
  alerts: BudgetAlert[]
  optimization: BudgetOptimization
}

export interface EventAnalytics {
  overview: AnalyticsOverview
  registration: RegistrationAnalytics
  attendance: AttendanceAnalytics
  engagement: EngagementAnalytics
  satisfaction: SatisfactionAnalytics
  networking: NetworkingAnalytics
  content: ContentAnalytics
  marketing: MarketingAnalytics
  financial: FinancialAnalytics
  operational: OperationalAnalytics
  social: SocialAnalytics
  mobile: MobileAnalytics
  realTime: RealTimeAnalytics
  predictive: PredictiveAnalytics
  benchmarking: BenchmarkingAnalytics
  insights: AnalyticsInsight[]
  recommendations: AnalyticsRecommendation[]
  reports: AnalyticsReport[]
}

export interface EventROI {
  investment: ROIInvestment
  returns: ROIReturns
  metrics: ROIMetric[]
  calculation: ROICalculation
  attribution: ROIAttribution
  timeline: ROITimeline
  benchmarks: ROIBenchmark[]
  optimization: ROIOptimization
  reporting: ROIReporting
  forecasting: ROIForecasting
}

export interface EventTechnology {
  platform: TechnologyPlatform
  streaming: StreamingTechnology
  recording: RecordingTechnology
  audio: AudioTechnology
  video: VideoTechnology
  lighting: LightingTechnology
  networking: NetworkingTechnology
  mobile: MobileTechnology
  virtual: VirtualTechnology
  hybrid: HybridTechnology
  integration: TechnologyIntegration
  support: TechnologySupport
  security: TechnologySecurity
  backup: TechnologyBackup
  testing: TechnologyTesting
}

export interface EventNetworking {
  enabled: boolean
  features: NetworkingFeature[]
  matching: NetworkingMatching
  scheduling: NetworkingScheduling
  facilitation: NetworkingFacilitation
  gamification: NetworkingGamification
  analytics: NetworkingAnalytics
  integration: NetworkingIntegration
  mobile: NetworkingMobile
  virtual: NetworkingVirtual
  followUp: NetworkingFollowUp
}

export interface EventGamification {
  enabled: boolean
  mechanics: GamificationMechanic[]
  points: PointsSystem
  badges: BadgeSystem
  leaderboards: LeaderboardSystem
  challenges: ChallengeSystem
  rewards: RewardSystem
  social: SocialGamification
  analytics: GamificationAnalytics
  personalization: GamificationPersonalization
}

class EventsManagementCompleteService {
  // Event Management
  async getEvents(params?: {
    type?: string
    category?: string
    status?: string
    brandId?: string
    dateFrom?: string
    dateTo?: string
    organizerId?: string
  }): Promise<Event[]> {
    const response = await apiClient.get('/events', { params })
    return response.events
  }

  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    return apiClient.post('/events', event)
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    return apiClient.put(`/events/${id}`, updates)
  }

  async duplicateEvent(id: string, options: {
    name: string
    startDate: string
    endDate: string
    venue?: string
  }): Promise<Event> {
    return apiClient.post(`/events/${id}/duplicate`, options)
  }

  async publishEvent(id: string): Promise<Event> {
    return apiClient.post(`/events/${id}/publish`)
  }

  async cancelEvent(id: string, reason: string, notifyAttendees: boolean): Promise<Event> {
    return apiClient.post(`/events/${id}/cancel`, { reason, notifyAttendees })
  }

  async postponeEvent(id: string, newDates: { startDate: string; endDate: string }, reason: string): Promise<Event> {
    return apiClient.post(`/events/${id}/postpone`, { newDates, reason })
  }

  // Venue Management
  async getVenues(params?: {
    type?: string
    location?: string
    capacity?: number
    amenities?: string[]
    availability?: string
  }): Promise<EventVenue[]> {
    const response = await apiClient.get('/events/venues', { params })
    return response.venues
  }

  async createVenue(venue: Omit<EventVenue, 'id'>): Promise<EventVenue> {
    return apiClient.post('/events/venues', venue)
  }

  async updateVenue(id: string, updates: Partial<EventVenue>): Promise<EventVenue> {
    return apiClient.put(`/events/venues/${id}`, updates)
  }

  async checkVenueAvailability(venueId: string, startDate: string, endDate: string): Promise<VenueAvailabilityResult> {
    return apiClient.get(`/events/venues/${venueId}/availability`, { 
      params: { startDate, endDate } 
    })
  }

  async bookVenue(venueId: string, eventId: string, booking: VenueBooking): Promise<VenueBookingResult> {
    return apiClient.post(`/events/venues/${venueId}/book`, { eventId, ...booking })
  }

  // Registration Management
  async getRegistrations(eventId: string, params?: {
    status?: string
    ticketType?: string
    source?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<EventAttendee[]> {
    const response = await apiClient.get(`/events/${eventId}/registrations`, { params })
    return response.registrations
  }

  async registerAttendee(eventId: string, attendee: Omit<EventAttendee, 'id' | 'registrationDate'>): Promise<EventAttendee> {
    return apiClient.post(`/events/${eventId}/register`, attendee)
  }

  async updateRegistration(eventId: string, attendeeId: string, updates: Partial<EventAttendee>): Promise<EventAttendee> {
    return apiClient.put(`/events/${eventId}/registrations/${attendeeId}`, updates)
  }

  async cancelRegistration(eventId: string, attendeeId: string, reason: string): Promise<void> {
    return apiClient.post(`/events/${eventId}/registrations/${attendeeId}/cancel`, { reason })
  }

  async checkInAttendee(eventId: string, attendeeId: string, location?: string): Promise<EventAttendee> {
    return apiClient.post(`/events/${eventId}/registrations/${attendeeId}/checkin`, { location })
  }

  async checkOutAttendee(eventId: string, attendeeId: string): Promise<EventAttendee> {
    return apiClient.post(`/events/${eventId}/registrations/${attendeeId}/checkout`)
  }

  async bulkCheckIn(eventId: string, attendeeIds: string[]): Promise<BulkCheckInResult> {
    return apiClient.post(`/events/${eventId}/registrations/bulk-checkin`, { attendeeIds })
  }

  // Session Management
  async getSessions(eventId: string): Promise<EventSession[]> {
    const response = await apiClient.get(`/events/${eventId}/sessions`)
    return response.sessions
  }

  async createSession(eventId: string, session: Omit<EventSession, 'id'>): Promise<EventSession> {
    return apiClient.post(`/events/${eventId}/sessions`, session)
  }

  async updateSession(eventId: string, sessionId: string, updates: Partial<EventSession>): Promise<EventSession> {
    return apiClient.put(`/events/${eventId}/sessions/${sessionId}`, updates)
  }

  async getSessionAttendance(eventId: string, sessionId: string): Promise<SessionAttendance> {
    return apiClient.get(`/events/${eventId}/sessions/${sessionId}/attendance`)
  }

  async recordSessionAttendance(eventId: string, sessionId: string, attendeeIds: string[]): Promise<void> {
    return apiClient.post(`/events/${eventId}/sessions/${sessionId}/attendance`, { attendeeIds })
  }

  async getSessionFeedback(eventId: string, sessionId: string): Promise<SessionFeedback[]> {
    const response = await apiClient.get(`/events/${eventId}/sessions/${sessionId}/feedback`)
    return response.feedback
  }

  async submitSessionFeedback(eventId: string, sessionId: string, feedback: Omit<SessionFeedback, 'id'>): Promise<SessionFeedback> {
    return apiClient.post(`/events/${eventId}/sessions/${sessionId}/feedback`, feedback)
  }

  // Speaker Management
  async getSpeakers(eventId?: string): Promise<EventSpeaker[]> {
    const params = eventId ? { eventId } : {}
    const response = await apiClient.get('/events/speakers', { params })
    return response.speakers
  }

  async createSpeaker(speaker: Omit<EventSpeaker, 'id'>): Promise<EventSpeaker> {
    return apiClient.post('/events/speakers', speaker)
  }

  async updateSpeaker(id: string, updates: Partial<EventSpeaker>): Promise<EventSpeaker> {
    return apiClient.put(`/events/speakers/${id}`, updates)
  }

  async assignSpeakerToSession(eventId: string, sessionId: string, speakerId: string, role: string): Promise<void> {
    return apiClient.post(`/events/${eventId}/sessions/${sessionId}/speakers`, { speakerId, role })
  }

  async getSpeakerAvailability(speakerId: string, dateFrom: string, dateTo: string): Promise<SpeakerAvailability> {
    return apiClient.get(`/events/speakers/${speakerId}/availability`, { 
      params: { dateFrom, dateTo } 
    })
  }

  // Marketing & Promotion
  async getMarketingCampaigns(eventId: string): Promise<MarketingCampaign[]> {
    const response = await apiClient.get(`/events/${eventId}/marketing/campaigns`)
    return response.campaigns
  }

  async createMarketingCampaign(eventId: string, campaign: Omit<MarketingCampaign, 'id'>): Promise<MarketingCampaign> {
    return apiClient.post(`/events/${eventId}/marketing/campaigns`, campaign)
  }

  async launchMarketingCampaign(eventId: string, campaignId: string): Promise<MarketingCampaign> {
    return apiClient.post(`/events/${eventId}/marketing/campaigns/${campaignId}/launch`)
  }

  async getMarketingAnalytics(eventId: string, campaignId?: string): Promise<MarketingAnalytics> {
    const params = campaignId ? { campaignId } : {}
    return apiClient.get(`/events/${eventId}/marketing/analytics`, { params })
  }

  async sendEventInvitations(eventId: string, invitations: EventInvitation[]): Promise<InvitationResult> {
    return apiClient.post(`/events/${eventId}/invitations/send`, { invitations })
  }

  async sendEventReminders(eventId: string, reminderType: string, attendeeIds?: string[]): Promise<ReminderResult> {
    return apiClient.post(`/events/${eventId}/reminders/send`, { reminderType, attendeeIds })
  }

  // Logistics Management
  async getLogistics(eventId: string): Promise<EventLogistics> {
    return apiClient.get(`/events/${eventId}/logistics`)
  }

  async updateLogistics(eventId: string, updates: Partial<EventLogistics>): Promise<EventLogistics> {
    return apiClient.put(`/events/${eventId}/logistics`, updates)
  }

  async getSuppliers(eventId?: string, category?: string): Promise<LogisticsSupplier[]> {
    const params = { eventId, category }
    const response = await apiClient.get('/events/logistics/suppliers', { params })
    return response.suppliers
  }

  async createSupplierOrder(eventId: string, order: SupplierOrder): Promise<SupplierOrderResult> {
    return apiClient.post(`/events/${eventId}/logistics/orders`, order)
  }

  async trackShipment(eventId: string, shipmentId: string): Promise<ShipmentTracking> {
    return apiClient.get(`/events/${eventId}/logistics/shipments/${shipmentId}/tracking`)
  }

  // Budget Management
  async getBudget(eventId: string): Promise<EventBudget> {
    return apiClient.get(`/events/${eventId}/budget`)
  }

  async updateBudget(eventId: string, updates: Partial<EventBudget>): Promise<EventBudget> {
    return apiClient.put(`/events/${eventId}/budget`, updates)
  }

  async addExpense(eventId: string, expense: BudgetExpense): Promise<BudgetExpense> {
    return apiClient.post(`/events/${eventId}/budget/expenses`, expense)
  }

  async approveExpense(eventId: string, expenseId: string, approval: ExpenseApproval): Promise<BudgetExpense> {
    return apiClient.post(`/events/${eventId}/budget/expenses/${expenseId}/approve`, approval)
  }

  async getBudgetReport(eventId: string, format: 'json' | 'pdf' | 'excel'): Promise<BudgetReport | Blob> {
    const response = await apiClient.get(`/events/${eventId}/budget/report`, { 
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    })
    return response
  }

  // Analytics & Reporting
  async getEventAnalytics(eventId: string, params?: {
    period?: string
    metrics?: string[]
    groupBy?: string
  }): Promise<EventAnalytics> {
    return apiClient.get(`/events/${eventId}/analytics`, { params })
  }

  async getAttendanceAnalytics(eventId: string): Promise<AttendanceAnalytics> {
    return apiClient.get(`/events/${eventId}/analytics/attendance`)
  }

  async getEngagementAnalytics(eventId: string): Promise<EngagementAnalytics> {
    return apiClient.get(`/events/${eventId}/analytics/engagement`)
  }

  async getSatisfactionAnalytics(eventId: string): Promise<SatisfactionAnalytics> {
    return apiClient.get(`/events/${eventId}/analytics/satisfaction`)
  }

  async getNetworkingAnalytics(eventId: string): Promise<NetworkingAnalytics> {
    return apiClient.get(`/events/${eventId}/analytics/networking`)
  }

  async getROIAnalysis(eventId: string): Promise<EventROI> {
    return apiClient.get(`/events/${eventId}/roi`)
  }

  async generateEventReport(eventId: string, template: string, format: 'pdf' | 'excel' | 'powerpoint'): Promise<Blob> {
    return apiClient.post(`/events/${eventId}/reports/generate`, 
      { template, format }, 
      { responseType: 'blob' }
    )
  }

  // Feedback & Surveys
  async getEventFeedback(eventId: string): Promise<EventFeedback> {
    return apiClient.get(`/events/${eventId}/feedback`)
  }

  async submitEventFeedback(eventId: string, feedback: Omit<AttendeeFeedback, 'id'>): Promise<AttendeeFeedback> {
    return apiClient.post(`/events/${eventId}/feedback`, feedback)
  }

  async createFeedbackSurvey(eventId: string, survey: FeedbackSurvey): Promise<FeedbackSurvey> {
    return apiClient.post(`/events/${eventId}/surveys`, survey)
  }

  async getFeedbackSurveyResults(eventId: string, surveyId: string): Promise<SurveyResults> {
    return apiClient.get(`/events/${eventId}/surveys/${surveyId}/results`)
  }

  // Networking
  async enableNetworking(eventId: string, config: NetworkingConfiguration): Promise<EventNetworking> {
    return apiClient.post(`/events/${eventId}/networking/enable`, config)
  }

  async getNetworkingMatches(eventId: string, attendeeId: string): Promise<NetworkingMatch[]> {
    const response = await apiClient.get(`/events/${eventId}/networking/matches/${attendeeId}`)
    return response.matches
  }

  async scheduleNetworkingMeeting(eventId: string, meeting: NetworkingMeeting): Promise<NetworkingMeeting> {
    return apiClient.post(`/events/${eventId}/networking/meetings`, meeting)
  }

  async getNetworkingActivity(eventId: string, attendeeId?: string): Promise<NetworkingActivity[]> {
    const params = attendeeId ? { attendeeId } : {}
    const response = await apiClient.get(`/events/${eventId}/networking/activity`, { params })
    return response.activity
  }

  // Mobile App
  async getMobileAppConfig(eventId: string): Promise<MobileAppConfig> {
    return apiClient.get(`/events/${eventId}/mobile/config`)
  }

  async updateMobileAppConfig(eventId: string, config: Partial<MobileAppConfig>): Promise<MobileAppConfig> {
    return apiClient.put(`/events/${eventId}/mobile/config`, config)
  }

  async getMobileAppAnalytics(eventId: string): Promise<MobileAnalytics> {
    return apiClient.get(`/events/${eventId}/mobile/analytics`)
  }

  async sendPushNotification(eventId: string, notification: PushNotification): Promise<PushNotificationResult> {
    return apiClient.post(`/events/${eventId}/mobile/notifications`, notification)
  }

  // Integration & Export
  async syncWithCRM(eventId: string, data: CRMSyncData): Promise<CRMSyncResult> {
    return apiClient.post(`/events/${eventId}/integrations/crm/sync`, data)
  }

  async syncWithMarketing(eventId: string, data: MarketingSyncData): Promise<MarketingSyncResult> {
    return apiClient.post(`/events/${eventId}/integrations/marketing/sync`, data)
  }

  async exportAttendeeData(eventId: string, format: 'csv' | 'excel' | 'json'): Promise<Blob> {
    return apiClient.get(`/events/${eventId}/attendees/export`, { 
      params: { format }, 
      responseType: 'blob' 
    })
  }

  async exportEventData(eventId: string, dataTypes: string[], format: 'csv' | 'excel' | 'json'): Promise<Blob> {
    return apiClient.post(`/events/${eventId}/export`, 
      { dataTypes, format }, 
      { responseType: 'blob' }
    )
  }

  // Real-time Updates
  async getEventUpdates(eventId: string, since?: string): Promise<EventUpdate[]> {
    const params = since ? { since } : {}
    const response = await apiClient.get(`/events/${eventId}/updates`, { params })
    return response.updates
  }

  async subscribeToEventUpdates(eventId: string, callback: (update: EventUpdate) => void): Promise<() => void> {
    // WebSocket subscription implementation
    const ws = new WebSocket(`/events/${eventId}/updates/subscribe`)
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      callback(update)
    }
    
    return () => ws.close()
  }

  async broadcastEventUpdate(eventId: string, update: EventUpdateBroadcast): Promise<void> {
    return apiClient.post(`/events/${eventId}/updates/broadcast`, update)
  }
}

const eventsManagementCompleteService = new EventsManagementCompleteService()
export default eventsManagementCompleteService