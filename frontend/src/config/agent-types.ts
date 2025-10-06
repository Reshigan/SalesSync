// Agent Type Configuration
// Defines the different types of field agents in the system

export const AGENT_TYPES = {
  VAN_SALES: 'van_sales',
  PROMOTIONAL: 'promotional',
  TRADE_MARKETING: 'trade_marketing',
  FIELD_MARKETING: 'field_marketing'
} as const

export type AgentType = typeof AGENT_TYPES[keyof typeof AGENT_TYPES]

export interface AgentTypeConfig {
  id: AgentType
  name: string
  description: string
  permissions: string[]
  modules: string[]
}

export const AGENT_TYPE_CONFIGS: Record<AgentType, AgentTypeConfig> = {
  [AGENT_TYPES.VAN_SALES]: {
    id: 'van_sales',
    name: 'Van Sales Agent',
    description: 'Manages van-based sales, route delivery, and cash collection',
    permissions: [
      'van_loading',
      'route_management',
      'order_taking',
      'cash_collection',
      'inventory_management',
      'customer_visits'
    ],
    modules: [
      'van-sales',
      'orders',
      'customers',
      'products',
      'inventory',
      'routes'
    ]
  },
  
  [AGENT_TYPES.PROMOTIONAL]: {
    id: 'promotional',
    name: 'Promotional Agent',
    description: 'Executes promotional campaigns, distributes materials, and activates consumers',
    permissions: [
      'consumer_activation',
      'sim_distribution',
      'voucher_distribution',
      'kyc_collection',
      'promotional_materials',
      'event_execution'
    ],
    modules: [
      'consumer-activations',
      'promotions',
      'field-agents',
      'surveys'
    ]
  },
  
  [AGENT_TYPES.TRADE_MARKETING]: {
    id: 'trade_marketing',
    name: 'Trade Marketing Agent',
    description: 'Handles in-store merchandising, shelf audits, and competitor analysis',
    permissions: [
      'store_visits',
      'shelf_audits',
      'competitor_tracking',
      'planogram_compliance',
      'board_installation',
      'pos_material_placement'
    ],
    modules: [
      'merchandising',
      'field-agents/boards',
      'visits',
      'surveys'
    ]
  },
  
  [AGENT_TYPES.FIELD_MARKETING]: {
    id: 'field_marketing',
    name: 'Field Marketing Agent',
    description: 'Conducts field marketing activities, brand activations, and customer engagement',
    permissions: [
      'customer_visits',
      'brand_activations',
      'surveys',
      'market_intelligence',
      'customer_feedback',
      'event_coordination'
    ],
    modules: [
      'visits',
      'surveys',
      'promotions',
      'customers'
    ]
  }
}

// Helper function to get agent type configuration
export function getAgentTypeConfig(agentType: AgentType): AgentTypeConfig {
  return AGENT_TYPE_CONFIGS[agentType]
}

// Get all agent types as array
export function getAllAgentTypes(): AgentTypeConfig[] {
  return Object.values(AGENT_TYPE_CONFIGS)
}

// Check if agent type has permission
export function hasPermission(agentType: AgentType, permission: string): boolean {
  return AGENT_TYPE_CONFIGS[agentType].permissions.includes(permission)
}

// Check if agent type has access to module
export function hasModuleAccess(agentType: AgentType, module: string): boolean {
  return AGENT_TYPE_CONFIGS[agentType].modules.includes(module)
}

// Get available modules for agent type
export function getAvailableModules(agentType: AgentType): string[] {
  return AGENT_TYPE_CONFIGS[agentType].modules
}
