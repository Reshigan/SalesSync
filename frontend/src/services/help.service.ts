// Comprehensive Help and Documentation Service
import apiClient from '@/lib/api-client'

export interface HelpArticle {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  subcategory?: string
  tags: string[]
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  type: 'GUIDE' | 'TUTORIAL' | 'FAQ' | 'TROUBLESHOOTING' | 'API_DOCS' | 'VIDEO'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featured: boolean
  searchable: boolean
  viewCount: number
  rating: number
  ratingCount: number
  estimatedReadTime: number
  lastUpdated: string
  createdAt: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  attachments: HelpAttachment[]
  relatedArticles: string[]
  prerequisites: string[]
  metadata: Record<string, any>
}

export interface HelpAttachment {
  id: string
  name: string
  type: 'IMAGE' | 'VIDEO' | 'PDF' | 'DOWNLOAD'
  url: string
  size: number
  description?: string
}

export interface HelpCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  order: number
  parentId?: string
  subcategories: HelpCategory[]
  articleCount: number
  featured: boolean
}

export interface SearchResult {
  id: string
  title: string
  excerpt: string
  category: string
  type: HelpArticle['type']
  url: string
  relevanceScore: number
  highlights: string[]
}

export interface UserGuide {
  id: string
  title: string
  description: string
  role: 'ADMIN' | 'MANAGER' | 'FIELD_AGENT' | 'ALL'
  steps: GuideStep[]
  estimatedTime: number
  difficulty: HelpArticle['difficulty']
  completionRate: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export interface GuideStep {
  id: string
  title: string
  description: string
  content: string
  order: number
  type: 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'QUIZ'
  required: boolean
  estimatedTime: number
  resources: HelpAttachment[]
  validation?: StepValidation
}

export interface StepValidation {
  type: 'QUIZ' | 'TASK' | 'CONFIRMATION'
  questions?: QuizQuestion[]
  taskDescription?: string
  successCriteria?: string[]
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TEXT'
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
}

export interface Tutorial {
  id: string
  title: string
  description: string
  category: string
  difficulty: HelpArticle['difficulty']
  duration: number
  format: 'VIDEO' | 'INTERACTIVE' | 'STEP_BY_STEP'
  url?: string
  steps?: TutorialStep[]
  prerequisites: string[]
  learningObjectives: string[]
  completionCertificate: boolean
  rating: number
  ratingCount: number
  enrollmentCount: number
  completionRate: number
  createdAt: string
  updatedAt: string
}

export interface TutorialStep {
  id: string
  title: string
  description: string
  content: string
  order: number
  type: 'EXPLANATION' | 'DEMONSTRATION' | 'PRACTICE' | 'ASSESSMENT'
  media?: HelpAttachment[]
  interactiveElements?: InteractiveElement[]
}

export interface InteractiveElement {
  type: 'HOTSPOT' | 'TOOLTIP' | 'HIGHLIGHT' | 'FORM' | 'SIMULATION'
  position: { x: number; y: number }
  content: string
  trigger: 'CLICK' | 'HOVER' | 'AUTO'
  delay?: number
}

export interface SupportTicket {
  id: string
  subject: string
  description: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED'
  userId: string
  assignedTo?: string
  tags: string[]
  attachments: HelpAttachment[]
  messages: TicketMessage[]
  resolution?: string
  satisfactionRating?: number
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface TicketMessage {
  id: string
  content: string
  type: 'USER' | 'AGENT' | 'SYSTEM'
  authorId: string
  authorName: string
  attachments: HelpAttachment[]
  timestamp: string
  internal: boolean
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  helpful: number
  notHelpful: number
  order: number
  featured: boolean
  lastUpdated: string
  relatedArticles: string[]
}

export interface HelpAnalytics {
  popularArticles: Array<{
    id: string
    title: string
    views: number
    rating: number
  }>
  searchQueries: Array<{
    query: string
    count: number
    resultsFound: number
  }>
  categoryUsage: Array<{
    category: string
    views: number
    articles: number
  }>
  userEngagement: {
    totalViews: number
    averageTimeOnPage: number
    bounceRate: number
    searchSuccessRate: number
  }
  supportMetrics: {
    totalTickets: number
    averageResolutionTime: number
    satisfactionScore: number
    firstContactResolution: number
  }
}

class HelpService {
  // Article management
  async getArticles(params: {
    page?: number
    limit?: number
    category?: string
    type?: HelpArticle['type']
    difficulty?: HelpArticle['difficulty']
    featured?: boolean
    search?: string
  } = {}): Promise<{
    articles: HelpArticle[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    return apiClient.get('/help/articles', { params })
  }

  async getArticle(articleId: string): Promise<HelpArticle> {
    return apiClient.get(`/help/articles/${articleId}`)
  }

  async getArticleBySlug(slug: string): Promise<HelpArticle> {
    return apiClient.get(`/help/articles/slug/${slug}`)
  }

  async createArticle(articleData: Omit<HelpArticle, 'id' | 'createdAt' | 'viewCount' | 'rating' | 'ratingCount'>): Promise<HelpArticle> {
    return apiClient.post('/help/articles', articleData)
  }

  async updateArticle(articleId: string, updates: Partial<HelpArticle>): Promise<HelpArticle> {
    return apiClient.put(`/help/articles/${articleId}`, updates)
  }

  async deleteArticle(articleId: string): Promise<void> {
    return apiClient.delete(`/help/articles/${articleId}`)
  }

  async rateArticle(articleId: string, rating: number): Promise<void> {
    return apiClient.post(`/help/articles/${articleId}/rate`, { rating })
  }

  async incrementViewCount(articleId: string): Promise<void> {
    return apiClient.post(`/help/articles/${articleId}/view`)
  }

  // Categories
  async getCategories(): Promise<HelpCategory[]> {
    const response = await apiClient.get('/help/categories')
    return response.categories
  }

  async getCategory(categoryId: string): Promise<HelpCategory> {
    return apiClient.get(`/help/categories/${categoryId}`)
  }

  async createCategory(categoryData: Omit<HelpCategory, 'id' | 'articleCount' | 'subcategories'>): Promise<HelpCategory> {
    return apiClient.post('/help/categories', categoryData)
  }

  async updateCategory(categoryId: string, updates: Partial<HelpCategory>): Promise<HelpCategory> {
    return apiClient.put(`/help/categories/${categoryId}`, updates)
  }

  async deleteCategory(categoryId: string): Promise<void> {
    return apiClient.delete(`/help/categories/${categoryId}`)
  }

  // Search
  async searchArticles(query: string, filters?: {
    category?: string
    type?: HelpArticle['type']
    difficulty?: HelpArticle['difficulty']
  }): Promise<SearchResult[]> {
    const params = { query, ...filters }
    const response = await apiClient.get('/help/search', { params })
    return response.results
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    const response = await apiClient.get('/help/search/suggestions', { params: { query } })
    return response.suggestions
  }

  async getPopularSearches(): Promise<Array<{ query: string; count: number }>> {
    const response = await apiClient.get('/help/search/popular')
    return response.searches
  }

  // User guides
  async getUserGuides(role?: string): Promise<UserGuide[]> {
    const params = role ? { role } : {}
    const response = await apiClient.get('/help/guides', { params })
    return response.guides
  }

  async getUserGuide(guideId: string): Promise<UserGuide> {
    return apiClient.get(`/help/guides/${guideId}`)
  }

  async startGuide(guideId: string): Promise<{ progressId: string }> {
    return apiClient.post(`/help/guides/${guideId}/start`)
  }

  async completeGuideStep(guideId: string, stepId: string, data?: any): Promise<{
    completed: boolean
    nextStep?: string
    progress: number
  }> {
    return apiClient.post(`/help/guides/${guideId}/steps/${stepId}/complete`, data)
  }

  async getGuideProgress(guideId: string): Promise<{
    progressId: string
    completedSteps: string[]
    currentStep?: string
    progress: number
    startedAt: string
    completedAt?: string
  }> {
    return apiClient.get(`/help/guides/${guideId}/progress`)
  }

  // Tutorials
  async getTutorials(params: {
    category?: string
    difficulty?: Tutorial['difficulty']
    format?: Tutorial['format']
  } = {}): Promise<Tutorial[]> {
    const response = await apiClient.get('/help/tutorials', { params })
    return response.tutorials
  }

  async getTutorial(tutorialId: string): Promise<Tutorial> {
    return apiClient.get(`/help/tutorials/${tutorialId}`)
  }

  async enrollInTutorial(tutorialId: string): Promise<{ enrollmentId: string }> {
    return apiClient.post(`/help/tutorials/${tutorialId}/enroll`)
  }

  async completeTutorial(tutorialId: string): Promise<{
    completed: boolean
    certificate?: string
    score?: number
  }> {
    return apiClient.post(`/help/tutorials/${tutorialId}/complete`)
  }

  async getTutorialProgress(tutorialId: string): Promise<{
    enrollmentId: string
    progress: number
    completedSteps: string[]
    currentStep?: string
    timeSpent: number
    startedAt: string
    completedAt?: string
  }> {
    return apiClient.get(`/help/tutorials/${tutorialId}/progress`)
  }

  // Support tickets
  async getSupportTickets(params: {
    page?: number
    limit?: number
    status?: SupportTicket['status']
    priority?: SupportTicket['priority']
    category?: string
  } = {}): Promise<{
    tickets: SupportTicket[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    return apiClient.get('/help/support/tickets', { params })
  }

  async getSupportTicket(ticketId: string): Promise<SupportTicket> {
    return apiClient.get(`/help/support/tickets/${ticketId}`)
  }

  async createSupportTicket(ticketData: {
    subject: string
    description: string
    category: string
    priority: SupportTicket['priority']
    attachments?: File[]
  }): Promise<SupportTicket> {
    const formData = new FormData()
    formData.append('subject', ticketData.subject)
    formData.append('description', ticketData.description)
    formData.append('category', ticketData.category)
    formData.append('priority', ticketData.priority)
    
    if (ticketData.attachments) {
      ticketData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file)
      })
    }

    return apiClient.post('/help/support/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async updateSupportTicket(ticketId: string, updates: {
    status?: SupportTicket['status']
    priority?: SupportTicket['priority']
    assignedTo?: string
    tags?: string[]
  }): Promise<SupportTicket> {
    return apiClient.patch(`/help/support/tickets/${ticketId}`, updates)
  }

  async addTicketMessage(ticketId: string, message: {
    content: string
    attachments?: File[]
    internal?: boolean
  }): Promise<TicketMessage> {
    const formData = new FormData()
    formData.append('content', message.content)
    formData.append('internal', String(message.internal || false))
    
    if (message.attachments) {
      message.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file)
      })
    }

    return apiClient.post(`/help/support/tickets/${ticketId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async resolveTicket(ticketId: string, resolution: string): Promise<SupportTicket> {
    return apiClient.post(`/help/support/tickets/${ticketId}/resolve`, { resolution })
  }

  async rateTicketResolution(ticketId: string, rating: number, feedback?: string): Promise<void> {
    return apiClient.post(`/help/support/tickets/${ticketId}/rate`, { rating, feedback })
  }

  // FAQ
  async getFAQs(category?: string): Promise<FAQ[]> {
    const params = category ? { category } : {}
    const response = await apiClient.get('/help/faq', { params })
    return response.faqs
  }

  async getFAQ(faqId: string): Promise<FAQ> {
    return apiClient.get(`/help/faq/${faqId}`)
  }

  async createFAQ(faqData: Omit<FAQ, 'id' | 'helpful' | 'notHelpful' | 'lastUpdated'>): Promise<FAQ> {
    return apiClient.post('/help/faq', faqData)
  }

  async updateFAQ(faqId: string, updates: Partial<FAQ>): Promise<FAQ> {
    return apiClient.put(`/help/faq/${faqId}`, updates)
  }

  async deleteFAQ(faqId: string): Promise<void> {
    return apiClient.delete(`/help/faq/${faqId}`)
  }

  async rateFAQ(faqId: string, helpful: boolean): Promise<void> {
    return apiClient.post(`/help/faq/${faqId}/rate`, { helpful })
  }

  // Analytics
  async getHelpAnalytics(timeRange: string = '30d'): Promise<HelpAnalytics> {
    return apiClient.get('/help/analytics', { params: { timeRange } })
  }

  async getArticleAnalytics(articleId: string, timeRange: string = '30d'): Promise<{
    views: Array<{ date: string; count: number }>
    ratings: Array<{ date: string; rating: number; count: number }>
    searchQueries: Array<{ query: string; count: number }>
    referrers: Array<{ source: string; count: number }>
    timeOnPage: number
    bounceRate: number
  }> {
    return apiClient.get(`/help/articles/${articleId}/analytics`, { params: { timeRange } })
  }

  // Content management
  async uploadAttachment(file: File, type: HelpAttachment['type']): Promise<HelpAttachment> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return apiClient.post('/help/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    return apiClient.delete(`/help/attachments/${attachmentId}`)
  }

  // Feedback and suggestions
  async submitFeedback(feedback: {
    type: 'BUG' | 'FEATURE_REQUEST' | 'IMPROVEMENT' | 'CONTENT_ERROR'
    title: string
    description: string
    page?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    attachments?: File[]
  }): Promise<{ feedbackId: string }> {
    const formData = new FormData()
    formData.append('type', feedback.type)
    formData.append('title', feedback.title)
    formData.append('description', feedback.description)
    
    if (feedback.page) formData.append('page', feedback.page)
    if (feedback.priority) formData.append('priority', feedback.priority)
    
    if (feedback.attachments) {
      feedback.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file)
      })
    }

    return apiClient.post('/help/feedback', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  // Contextual help
  async getContextualHelp(page: string, role?: string): Promise<{
    articles: HelpArticle[]
    quickTips: Array<{
      title: string
      content: string
      type: 'TIP' | 'WARNING' | 'INFO'
    }>
    relatedGuides: UserGuide[]
    faqs: FAQ[]
  }> {
    const params = { page, role }
    return apiClient.get('/help/contextual', { params })
  }

  // Notifications
  async getHelpNotifications(): Promise<Array<{
    id: string
    type: 'NEW_ARTICLE' | 'UPDATED_ARTICLE' | 'NEW_FEATURE' | 'MAINTENANCE'
    title: string
    message: string
    url?: string
    read: boolean
    createdAt: string
  }>> {
    const response = await apiClient.get('/help/notifications')
    return response.notifications
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return apiClient.patch(`/help/notifications/${notificationId}/read`)
  }

  // Export and backup
  async exportContent(format: 'PDF' | 'HTML' | 'MARKDOWN' = 'PDF'): Promise<Blob> {
    return apiClient.get('/help/export', {
      params: { format },
      responseType: 'blob'
    })
  }

  // Real-time help
  async startLiveChat(): Promise<{
    chatId: string
    agentName?: string
    estimatedWaitTime?: number
  }> {
    return apiClient.post('/help/live-chat/start')
  }

  async sendChatMessage(chatId: string, message: string): Promise<void> {
    return apiClient.post(`/help/live-chat/${chatId}/message`, { message })
  }

  async endLiveChat(chatId: string, rating?: number, feedback?: string): Promise<void> {
    return apiClient.post(`/help/live-chat/${chatId}/end`, { rating, feedback })
  }
}

const helpService = new HelpService()
export default helpService