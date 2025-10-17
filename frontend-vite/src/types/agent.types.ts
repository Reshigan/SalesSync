export interface AgentRole {
  id: string
  name: string
  code: string
  description: string
  permissions: string[]
  color: string
}

export const AGENT_ROLES: AgentRole[] = [
  {
    id: '1',
    name: 'Van Sales',
    code: 'VAN_SALES',
    description: 'Mobile sales representative with product inventory',
    permissions: ['sales', 'inventory', 'payments', 'customer_visits'],
    color: '#10B981'
  },
  {
    id: '2',
    name: 'Promotion',
    code: 'PROMOTION',
    description: 'Brand promotion and marketing activities',
    permissions: ['promotions', 'brand_activities', 'customer_visits', 'surveys'],
    color: '#8B5CF6'
  },
  {
    id: '3',
    name: 'Field Operations',
    code: 'FIELD_OPS',
    description: 'Field operations and logistics coordination',
    permissions: ['logistics', 'inventory', 'customer_visits', 'route_planning'],
    color: '#F59E0B'
  },
  {
    id: '4',
    name: 'Trade Marketing',
    code: 'TRADE_MARKETING',
    description: 'Trade marketing and merchandising specialist',
    permissions: ['merchandising', 'trade_activities', 'customer_visits', 'competitor_analysis'],
    color: '#EF4444'
  }
]

export interface Agent {
  id: string
  name: string
  email: string
  phone: string
  employee_id: string
  roles: AgentRole[]
  status: 'active' | 'inactive' | 'on_leave'
  location: {
    current: {
      latitude: number
      longitude: number
      address: string
      timestamp: string
    }
    territory: {
      name: string
      boundaries: any[]
      customers: string[]
    }
  }
  vehicle?: {
    type: 'van' | 'car' | 'motorcycle' | 'bicycle'
    registration: string
    capacity: number
  }
  inventory?: {
    products: ProductInventory[]
    last_updated: string
  }
  performance: {
    visits_today: number
    visits_this_month: number
    sales_today: number
    sales_this_month: number
    commission_earned: number
    rating: number
  }
  created_at: string
  updated_at: string
}

export interface ProductInventory {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  expiry_date?: string
}

export interface Visit {
  id: string
  agent_id: string
  customer_id: string
  customer_name: string
  customer_address: string
  visit_type: 'scheduled' | 'unscheduled' | 'follow_up' | 'delivery' | 'collection'
  purpose: string[]
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_time: string
  actual_start_time?: string
  actual_end_time?: string
  location: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  activities: VisitActivity[]
  notes: string
  outcome: string
  next_action?: string
  created_at: string
  updated_at: string
}

export interface VisitActivity {
  id: string
  visit_id: string
  type: 'survey' | 'photo' | 'sale' | 'delivery' | 'collection' | 'merchandising' | 'promotion' | 'competitor_check' | 'inventory_check' | 'training' | 'complaint' | 'feedback'
  title: string
  description: string
  data: any
  completed: boolean
  timestamp: string
  location?: {
    latitude: number
    longitude: number
  }
}

export interface Survey {
  id: string
  title: string
  description: string
  questions: SurveyQuestion[]
  applicable_roles: string[]
  mandatory: boolean
  created_at: string
}

export interface SurveyQuestion {
  id: string
  type: 'text' | 'number' | 'single_choice' | 'multiple_choice' | 'rating' | 'date' | 'photo'
  question: string
  options?: string[]
  required: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface SurveyResponse {
  id: string
  survey_id: string
  visit_id: string
  agent_id: string
  customer_id: string
  responses: {
    question_id: string
    answer: any
  }[]
  completed_at: string
}

export interface Photo {
  id: string
  visit_id: string
  activity_id: string
  type: 'product' | 'store_front' | 'shelf' | 'competitor' | 'damage' | 'receipt' | 'signature' | 'other'
  url: string
  thumbnail_url: string
  caption: string
  location: {
    latitude: number
    longitude: number
  }
  metadata: {
    camera_make?: string
    camera_model?: string
    timestamp: string
    file_size: number
    dimensions: {
      width: number
      height: number
    }
  }
  tags: string[]
  created_at: string
}

export interface Sale {
  id: string
  visit_id: string
  agent_id: string
  customer_id: string
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: 'cash' | 'card' | 'credit' | 'bank_transfer'
  payment_status: 'pending' | 'completed' | 'failed'
  receipt_number: string
  notes: string
  created_at: string
}

export interface SaleItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  discount: number
  total: number
}

export interface Delivery {
  id: string
  visit_id: string
  agent_id: string
  customer_id: string
  order_id?: string
  items: DeliveryItem[]
  delivery_status: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned'
  signature?: string
  signature_name?: string
  delivery_notes: string
  proof_photos: string[]
  created_at: string
  delivered_at?: string
}

export interface DeliveryItem {
  product_id: string
  product_name: string
  quantity_ordered: number
  quantity_delivered: number
  condition: 'good' | 'damaged' | 'expired'
  notes?: string
}

export interface Collection {
  id: string
  visit_id: string
  agent_id: string
  customer_id: string
  type: 'payment' | 'returns' | 'equipment' | 'documents'
  amount?: number
  items?: CollectionItem[]
  status: 'pending' | 'completed' | 'partial' | 'failed'
  receipt_number?: string
  notes: string
  proof_photos: string[]
  created_at: string
  completed_at?: string
}

export interface CollectionItem {
  type: string
  description: string
  quantity: number
  condition: 'good' | 'damaged' | 'expired'
  value?: number
}

export interface MerchandisingActivity {
  id: string
  visit_id: string
  agent_id: string
  customer_id: string
  type: 'shelf_arrangement' | 'display_setup' | 'pos_material' | 'stock_rotation' | 'planogram_compliance'
  description: string
  before_photos: string[]
  after_photos: string[]
  compliance_score?: number
  issues_found: string[]
  actions_taken: string[]
  recommendations: string[]
  created_at: string
}

export interface PromotionActivity {
  id: string
  visit_id: string
  agent_id: string
  customer_id: string
  promotion_id: string
  promotion_name: string
  type: 'sampling' | 'demo' | 'discount' | 'bundle' | 'contest' | 'loyalty'
  participants: number
  materials_used: string[]
  feedback: string[]
  effectiveness_rating: number
  photos: string[]
  results: {
    leads_generated?: number
    sales_made?: number
    samples_distributed?: number
    engagement_score?: number
  }
  created_at: string
}

export interface CompetitorCheck {
  id: string
  visit_id: string
  agent_id: string
  customer_id: string
  competitor_name: string
  products_observed: CompetitorProduct[]
  pricing_info: CompetitorPricing[]
  promotional_activities: string[]
  shelf_share: number
  visibility_score: number
  photos: string[]
  notes: string
  created_at: string
}

export interface CompetitorProduct {
  name: string
  price: number
  availability: 'in_stock' | 'out_of_stock' | 'low_stock'
  shelf_position: string
  promotional_price?: number
}

export interface CompetitorPricing {
  product_category: string
  our_price: number
  competitor_price: number
  price_difference: number
  price_advantage: 'higher' | 'lower' | 'same'
}

export interface RouteOptimization {
  agent_id: string
  date: string
  planned_visits: string[]
  optimized_route: {
    visit_id: string
    order: number
    estimated_travel_time: number
    estimated_arrival_time: string
    estimated_duration: number
  }[]
  total_distance: number
  total_time: number
  fuel_estimate: number
  created_at: string
}