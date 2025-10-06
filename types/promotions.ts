export interface Campaign {
  id: string
  name: string
  description: string
  type: 'product_launch' | 'seasonal' | 'clearance' | 'bundle' | 'loyalty' | 'brand_awareness'
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  budget: number
  spent: number
  targetAudience: string[]
  brands: string[]
  products: string[]
  regions: string[]
  kpis: {
    targetReach: number
    actualReach: number
    targetSales: number
    actualSales: number
    targetEngagement: number
    actualEngagement: number
    targetROI: number
    actualROI: number
  }
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  campaignId: string
  campaignName: string
  name: string
  type: 'sampling' | 'demonstration' | 'activation' | 'event' | 'instore' | 'street' | 'mall'
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  location: {
    type: 'store' | 'mall' | 'street' | 'event_venue'
    name: string
    address: string
    coordinates?: { lat: number; lng: number }
  }
  scheduledDate: string
  startTime: string
  endTime: string
  assignedAgents: string[]
  targetParticipants: number
  actualParticipants: number
  materials: {
    id: string
    name: string
    quantity: number
  }[]
  metrics: {
    simsDistributed: number
    vouchersGiven: number
    samplesGiven: number
    leadsGenerated: number
    conversions: number
  }
  photos: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Material {
  id: string
  name: string
  type: 'banner' | 'poster' | 'flyer' | 'brochure' | 'standee' | 'wobbler' | 'shelf_strip' | 'sample' | 'gift' | 'uniform'
  category: 'print' | 'display' | 'merchandise' | 'digital' | 'promotional_item'
  brand?: string
  description: string
  specifications: {
    size?: string
    material?: string
    weight?: string
    colors?: string[]
  }
  stock: {
    total: number
    available: number
    allocated: number
    minimum: number
  }
  unitCost: number
  supplier?: string
  lastOrdered?: string
  imageUrl?: string
  status: 'active' | 'discontinued' | 'out_of_stock'
  campaigns: string[]
  createdAt: string
  updatedAt: string
}

export interface CampaignPerformance {
  campaignId: string
  period: string
  metrics: {
    reach: number
    engagement: number
    sales: number
    roi: number
    cost: number
  }
  activities: number
  participants: number
  conversionRate: number
}
