// Comprehensive Shelf Audit interface for advanced tracking
export interface ComprehensiveShelfAudit {
  id?: string
  storeId: string
  storeName?: string
  agentId: string
  agentName?: string
  auditDate: string
  category: string
  brand: string
  photos: string[]
  metrics: {
    totalFacings: number
    brandFacings: number
    shelfShare: number // percentage
    stockLevel: 'full' | 'medium' | 'low' | 'out'
    planogramCompliance: number // percentage
    priceTagPresent: boolean
    promoMaterialPresent: boolean
  }
  competitors: Array<{
    brand: string
    facings: number
  }>
  issues: string[]
  notes?: string
  gpsLocation?: {
    latitude: number
    longitude: number
  }
  createdAt?: string
}

// Planogram interface
export interface Planogram {
  id?: string
  name: string
  brand: string
  category: string
  storeType: string
  effectiveDate: string
  expiryDate?: string
  layout: {
    shelves: Array<{
      level: number
      position: string
      products: Array<{
        productId: string
        productName?: string
        facings: number
        position: number
      }>
    }>
  }
  image?: string
  notes?: string
  createdAt?: string
}

// Competitor Tracking
export interface CompetitorActivity {
  id?: string
  storeId: string
  storeName?: string
  agentId: string
  visitDate: string
  competitorBrand: string
  activities: Array<{
    type: 'promotion' | 'display' | 'pricing' | 'stock' | 'other'
    description: string
    impact: 'high' | 'medium' | 'low'
  }>
  photos: string[]
  notes?: string
  createdAt?: string
}
