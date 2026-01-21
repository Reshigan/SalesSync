export interface HelpContent {
  title: string
  description: string
  quickStart: string[]
  keyFeatures: string[]
  tips: string[]
  trainingSteps?: TrainingStep[]
}

export interface TrainingStep {
  step: number
  title: string
  description: string
  action?: string
}

export const helpContent: Record<string, HelpContent> = {
  dashboard: {
    title: 'Dashboard Overview',
    description: 'The Dashboard provides a real-time overview of your sales performance, field operations, and key metrics. Use it to monitor daily activities and track progress against targets.',
    quickStart: [
      'View daily sales summary and trends',
      'Monitor field agent activities in real-time',
      'Check pending approvals and alerts',
      'Access quick links to common tasks'
    ],
    keyFeatures: [
      'Real-time sales metrics and KPIs',
      'Field agent location tracking',
      'Pending tasks and approvals queue',
      'Performance comparison charts'
    ],
    tips: [
      'Refresh the dashboard regularly for the latest data',
      'Click on any metric card to drill down into details',
      'Use the date filter to compare different periods'
    ],
    trainingSteps: [
      { step: 1, title: 'Understanding Metrics', description: 'Learn what each metric card represents and how to interpret the data', action: 'Click on any metric card' },
      { step: 2, title: 'Navigation', description: 'Use the sidebar to navigate to different modules', action: 'Explore the menu items' },
      { step: 3, title: 'Quick Actions', description: 'Use quick action buttons for common tasks', action: 'Try creating a new order' }
    ]
  },

  'van-sales': {
    title: 'Van Sales Operations',
    description: 'Manage your mobile sales operations including route planning, inventory loading, order taking, and cash reconciliation. This module supports the complete van sales workflow from loading to settlement.',
    quickStart: [
      'Load inventory onto van before starting route',
      'Follow assigned route and visit customers',
      'Create orders and collect payments',
      'Reconcile cash and inventory at end of day'
    ],
    keyFeatures: [
      'Van inventory management with real-time tracking',
      'Route optimization and navigation',
      'Mobile order creation with offline support',
      'Cash and inventory reconciliation',
      'GPS tracking and visit verification'
    ],
    tips: [
      'Always verify inventory counts before starting your route',
      'Use the GPS check-in feature at each customer location',
      'Submit cash reconciliation before end of day',
      'Report any discrepancies immediately'
    ],
    trainingSteps: [
      { step: 1, title: 'Van Loading', description: 'Learn how to load inventory onto your van', action: 'Go to Van Loads and create a new load' },
      { step: 2, title: 'Route Management', description: 'View and follow your assigned route', action: 'Check Route Management section' },
      { step: 3, title: 'Order Taking', description: 'Create orders for customers during visits', action: 'Practice creating a van sales order' },
      { step: 4, title: 'Settlement', description: 'Reconcile cash and inventory at end of day', action: 'Complete a cash reconciliation' }
    ]
  },

  'field-operations': {
    title: 'Field Operations Management',
    description: 'Coordinate and monitor field agent activities including customer visits, board placements, product distribution, and commission tracking. Track agent performance and ensure territory coverage.',
    quickStart: [
      'Assign agents to territories and routes',
      'Monitor real-time agent locations',
      'Review visit reports and photos',
      'Track board placements and compliance'
    ],
    keyFeatures: [
      'Real-time GPS tracking of field agents',
      'Visit scheduling and verification',
      'Board placement management with photo proof',
      'Product distribution tracking',
      'Commission calculation and reporting'
    ],
    tips: [
      'Set up geofencing for accurate visit verification',
      'Review agent photos for quality assurance',
      'Use the mapping view for territory analysis',
      'Monitor commission accruals regularly'
    ],
    trainingSteps: [
      { step: 1, title: 'Agent Setup', description: 'Learn how to set up and assign field agents', action: 'Go to Agent Management' },
      { step: 2, title: 'Visit Tracking', description: 'Monitor and verify customer visits', action: 'Review Visit Management' },
      { step: 3, title: 'Board Placements', description: 'Manage board placement activities', action: 'Check Board Placement section' },
      { step: 4, title: 'Performance Review', description: 'Analyze agent performance metrics', action: 'View Commission Tracking' }
    ]
  },

  kyc: {
    title: 'KYC Management',
    description: 'Manage customer Know Your Customer (KYC) verification processes. Handle document collection, verification, approval workflows, and compliance reporting.',
    quickStart: [
      'Create new KYC cases for customers',
      'Upload and verify required documents',
      'Review and approve/reject submissions',
      'Generate compliance reports'
    ],
    keyFeatures: [
      'Document upload and management',
      'Multi-stage approval workflow',
      'Automated compliance checks',
      'Audit trail and reporting',
      'Risk assessment scoring'
    ],
    tips: [
      'Ensure all required documents are collected before submission',
      'Use the checklist to verify document completeness',
      'Add notes for any exceptions or special cases',
      'Review pending cases daily to avoid backlogs'
    ],
    trainingSteps: [
      { step: 1, title: 'Case Creation', description: 'Learn how to create a new KYC case', action: 'Create a new KYC case' },
      { step: 2, title: 'Document Upload', description: 'Upload and categorize required documents', action: 'Add documents to a case' },
      { step: 3, title: 'Review Process', description: 'Review submitted cases and make decisions', action: 'Approve or reject a case' },
      { step: 4, title: 'Reporting', description: 'Generate KYC compliance reports', action: 'View KYC Reports' }
    ]
  },

  surveys: {
    title: 'Survey Management',
    description: 'Create, distribute, and analyze surveys for customer feedback, market research, and field data collection. Track response rates and generate insights.',
    quickStart: [
      'Create survey templates with various question types',
      'Assign surveys to field agents or customers',
      'Monitor response rates and completion',
      'Analyze results and generate reports'
    ],
    keyFeatures: [
      'Drag-and-drop survey builder',
      'Multiple question types (MCQ, rating, text, photo)',
      'Conditional logic and branching',
      'Real-time response tracking',
      'Analytics and visualization'
    ],
    tips: [
      'Keep surveys concise for better completion rates',
      'Use conditional logic to personalize questions',
      'Set deadlines to encourage timely responses',
      'Review analytics to identify trends'
    ],
    trainingSteps: [
      { step: 1, title: 'Survey Creation', description: 'Build a new survey with questions', action: 'Go to Survey Management' },
      { step: 2, title: 'Distribution', description: 'Assign surveys to respondents', action: 'Distribute a survey' },
      { step: 3, title: 'Monitoring', description: 'Track survey responses', action: 'View Dashboard' },
      { step: 4, title: 'Analysis', description: 'Analyze survey results', action: 'Generate reports' }
    ]
  },

  inventory: {
    title: 'Inventory Management',
    description: 'Manage warehouse inventory, stock movements, transfers, and stock counts. Track inventory levels across locations and maintain accurate stock records.',
    quickStart: [
      'View current stock levels by warehouse',
      'Process stock receipts and issues',
      'Create and manage stock transfers',
      'Perform periodic stock counts'
    ],
    keyFeatures: [
      'Multi-warehouse inventory tracking',
      'Stock movement history and audit trail',
      'Automated reorder point alerts',
      'Stock count and reconciliation',
      'Batch and serial number tracking'
    ],
    tips: [
      'Perform regular stock counts for accuracy',
      'Set up reorder points to avoid stockouts',
      'Review stock movement reports for discrepancies',
      'Use barcode scanning for faster processing'
    ],
    trainingSteps: [
      { step: 1, title: 'Stock Overview', description: 'View inventory levels across warehouses', action: 'Go to Inventory Dashboard' },
      { step: 2, title: 'Stock Movements', description: 'Process receipts, issues, and transfers', action: 'Create a stock transfer' },
      { step: 3, title: 'Stock Count', description: 'Perform a physical stock count', action: 'Start a stock count' },
      { step: 4, title: 'Reporting', description: 'Generate inventory reports', action: 'View Inventory Reports' }
    ]
  },

  promotions: {
    title: 'Promotions Management',
    description: 'Create and manage promotional campaigns, discounts, and special offers. Track promotion performance and ROI across products and customers.',
    quickStart: [
      'Create new promotional campaigns',
      'Define discount rules and conditions',
      'Assign promotions to products or customers',
      'Monitor promotion performance'
    ],
    keyFeatures: [
      'Flexible discount types (percentage, fixed, BOGO)',
      'Time-based and quantity-based rules',
      'Customer segment targeting',
      'Promotion stacking and priority',
      'Performance analytics and ROI tracking'
    ],
    tips: [
      'Test promotions with a small group before wide rollout',
      'Set clear start and end dates',
      'Monitor redemption rates to gauge effectiveness',
      'Review cannibalization effects on regular sales'
    ],
    trainingSteps: [
      { step: 1, title: 'Promotion Setup', description: 'Create a new promotion', action: 'Go to Promotion Management' },
      { step: 2, title: 'Rules Configuration', description: 'Define discount rules and conditions', action: 'Configure promotion rules' },
      { step: 3, title: 'Targeting', description: 'Assign to products or customer segments', action: 'Set promotion targets' },
      { step: 4, title: 'Monitoring', description: 'Track promotion performance', action: 'View Dashboard' }
    ]
  },

  'trade-marketing': {
    title: 'Trade Marketing',
    description: 'Plan and execute trade marketing activities including in-store activations, retailer incentives, and market analysis. Track trade spend and measure ROI.',
    quickStart: [
      'Plan trade marketing activations',
      'Set up retailer incentive programs',
      'Track trade spend by channel',
      'Analyze market share and competition'
    ],
    keyFeatures: [
      'Activation planning and execution',
      'Retailer incentive management',
      'Trade spend tracking and budgeting',
      'Market analysis and insights',
      'Competitor tracking'
    ],
    tips: [
      'Align activations with seasonal demand',
      'Track ROI for each trade spend category',
      'Gather competitive intelligence during visits',
      'Review retailer performance regularly'
    ],
    trainingSteps: [
      { step: 1, title: 'Activation Planning', description: 'Plan a trade marketing activation', action: 'Go to Activation Workflow' },
      { step: 2, title: 'Incentives', description: 'Set up retailer incentive programs', action: 'Configure Retailer Incentives' },
      { step: 3, title: 'Trade Spend', description: 'Track and manage trade spend', action: 'View Trade Spend' },
      { step: 4, title: 'Analysis', description: 'Analyze market performance', action: 'Review Market Analysis' }
    ]
  },

  campaigns: {
    title: 'Campaign Management',
    description: 'Create and manage marketing campaigns across channels. Define target audiences, track performance, and run A/B tests to optimize results.',
    quickStart: [
      'Create new marketing campaigns',
      'Define target audiences and segments',
      'Set up campaign content and channels',
      'Monitor performance and optimize'
    ],
    keyFeatures: [
      'Multi-channel campaign management',
      'Audience segmentation and targeting',
      'A/B testing capabilities',
      'Performance tracking and analytics',
      'Campaign scheduling and automation'
    ],
    tips: [
      'Define clear campaign objectives and KPIs',
      'Use A/B testing to optimize messaging',
      'Segment audiences for personalized content',
      'Review campaign performance weekly'
    ],
    trainingSteps: [
      { step: 1, title: 'Campaign Creation', description: 'Create a new campaign', action: 'Go to Campaign Management' },
      { step: 2, title: 'Audience Setup', description: 'Define target audiences', action: 'Configure Target Audiences' },
      { step: 3, title: 'A/B Testing', description: 'Set up A/B tests', action: 'Create an A/B test' },
      { step: 4, title: 'Performance', description: 'Track campaign results', action: 'View Performance Tracking' }
    ]
  },

  finance: {
    title: 'Finance Management',
    description: 'Manage financial operations including invoicing, payments, and cash reconciliation. Track revenue, monitor collections, and generate financial reports.',
    quickStart: [
      'View financial dashboard and metrics',
      'Manage invoices and payments',
      'Process cash reconciliations',
      'Generate financial reports'
    ],
    keyFeatures: [
      'Invoice generation and management',
      'Payment tracking and reconciliation',
      'Cash flow monitoring',
      'Commission calculations',
      'Financial reporting and analytics'
    ],
    tips: [
      'Reconcile cash daily to catch discrepancies early',
      'Follow up on overdue invoices promptly',
      'Review commission calculations before payout',
      'Generate reports for month-end closing'
    ],
    trainingSteps: [
      { step: 1, title: 'Dashboard Overview', description: 'Understand financial metrics', action: 'View Finance Dashboard' },
      { step: 2, title: 'Invoice Management', description: 'Create and manage invoices', action: 'Go to Invoices' },
      { step: 3, title: 'Payment Processing', description: 'Record and track payments', action: 'Process a payment' },
      { step: 4, title: 'Reconciliation', description: 'Perform cash reconciliation', action: 'Complete a reconciliation' }
    ]
  },

  sales: {
    title: 'Sales Management',
    description: 'Manage the complete sales cycle from order creation to fulfillment. Handle orders, invoices, payments, returns, and credit notes.',
    quickStart: [
      'Create and manage sales orders',
      'Generate invoices from orders',
      'Record customer payments',
      'Process returns and credit notes'
    ],
    keyFeatures: [
      'Order lifecycle management',
      'Automated invoice generation',
      'Payment tracking and allocation',
      'Returns and credit note processing',
      'Sales analytics and reporting'
    ],
    tips: [
      'Verify customer credit limits before order approval',
      'Use order templates for repeat customers',
      'Process returns promptly to maintain customer satisfaction',
      'Review sales reports to identify trends'
    ],
    trainingSteps: [
      { step: 1, title: 'Order Creation', description: 'Create a new sales order', action: 'Go to Orders' },
      { step: 2, title: 'Invoicing', description: 'Generate invoices from orders', action: 'Create an invoice' },
      { step: 3, title: 'Payments', description: 'Record customer payments', action: 'Process a payment' },
      { step: 4, title: 'Returns', description: 'Handle returns and credit notes', action: 'Process a return' }
    ]
  },

  customers: {
    title: 'Customer Management',
    description: 'Manage customer information, relationships, and interactions. Track customer history, credit limits, and segment customers for targeted activities.',
    quickStart: [
      'Add and manage customer records',
      'View customer transaction history',
      'Set credit limits and payment terms',
      'Segment customers for targeting'
    ],
    keyFeatures: [
      'Comprehensive customer profiles',
      'Transaction and interaction history',
      'Credit management',
      'Customer segmentation',
      'Contact management'
    ],
    tips: [
      'Keep customer information up to date',
      'Review customer credit limits periodically',
      'Use segments for targeted promotions',
      'Track customer feedback and complaints'
    ],
    trainingSteps: [
      { step: 1, title: 'Customer Creation', description: 'Add a new customer', action: 'Create a customer record' },
      { step: 2, title: 'Profile Management', description: 'Update customer information', action: 'Edit customer details' },
      { step: 3, title: 'Credit Setup', description: 'Configure credit limits', action: 'Set credit terms' },
      { step: 4, title: 'History Review', description: 'View customer transactions', action: 'Check transaction history' }
    ]
  },

  products: {
    title: 'Product Management',
    description: 'Manage product catalog, pricing, and categories. Configure product attributes, set prices, and organize products for easy discovery.',
    quickStart: [
      'Add and manage products',
      'Set up pricing and discounts',
      'Organize products into categories',
      'Configure product attributes'
    ],
    keyFeatures: [
      'Product catalog management',
      'Flexible pricing configuration',
      'Category and brand organization',
      'Product variants and attributes',
      'Image and media management'
    ],
    tips: [
      'Use consistent naming conventions',
      'Keep product images high quality',
      'Review pricing regularly for competitiveness',
      'Archive discontinued products instead of deleting'
    ],
    trainingSteps: [
      { step: 1, title: 'Product Creation', description: 'Add a new product', action: 'Create a product' },
      { step: 2, title: 'Pricing Setup', description: 'Configure product pricing', action: 'Set product prices' },
      { step: 3, title: 'Categorization', description: 'Organize products', action: 'Assign categories' },
      { step: 4, title: 'Attributes', description: 'Configure product attributes', action: 'Add product details' }
    ]
  },

  admin: {
    title: 'System Administration',
    description: 'Configure system settings, manage users and roles, and maintain system health. Access audit logs, manage integrations, and configure business rules.',
    quickStart: [
      'Manage users and permissions',
      'Configure system settings',
      'Set up integrations',
      'Review audit logs'
    ],
    keyFeatures: [
      'User and role management',
      'System configuration',
      'Integration management',
      'Audit logging',
      'Backup and recovery'
    ],
    tips: [
      'Follow the principle of least privilege for permissions',
      'Review audit logs regularly for security',
      'Test integrations in a staging environment first',
      'Schedule regular backups'
    ],
    trainingSteps: [
      { step: 1, title: 'User Management', description: 'Add and manage users', action: 'Go to User Management' },
      { step: 2, title: 'Roles Setup', description: 'Configure roles and permissions', action: 'Set up roles' },
      { step: 3, title: 'Settings', description: 'Configure system settings', action: 'Review System Settings' },
      { step: 4, title: 'Monitoring', description: 'Monitor system health', action: 'Check System Health' }
    ]
  },

  commissions: {
    title: 'Commission Management',
    description: 'Calculate, approve, and pay agent commissions. Configure commission rules, track earnings, and manage the complete commission lifecycle.',
    quickStart: [
      'View pending commission calculations',
      'Review and approve commissions',
      'Process commission payments',
      'Generate commission reports'
    ],
    keyFeatures: [
      'Automated commission calculation',
      'Multi-tier commission structures',
      'Approval workflow',
      'Payment processing',
      'Commission reversal handling'
    ],
    tips: [
      'Review commission rules quarterly',
      'Verify calculations before approval',
      'Process payments on schedule',
      'Document any manual adjustments'
    ],
    trainingSteps: [
      { step: 1, title: 'Commission Rules', description: 'Understand commission structures', action: 'Review commission rules' },
      { step: 2, title: 'Calculation', description: 'Calculate agent commissions', action: 'Run commission calculation' },
      { step: 3, title: 'Approval', description: 'Review and approve commissions', action: 'Approve pending commissions' },
      { step: 4, title: 'Payment', description: 'Process commission payments', action: 'Pay approved commissions' }
    ]
  },

  'cash-reconciliation': {
    title: 'Cash Reconciliation',
    description: 'Reconcile cash collections from field agents and van sales. Track expected vs actual cash, investigate discrepancies, and close reconciliation periods.',
    quickStart: [
      'Create daily reconciliation records',
      'Enter actual cash collected',
      'Investigate and explain discrepancies',
      'Submit for approval and close'
    ],
    keyFeatures: [
      'Daily cash reconciliation workflow',
      'Discrepancy tracking and investigation',
      'Approval workflow',
      'Bank deposit tracking',
      'Reconciliation reporting'
    ],
    tips: [
      'Reconcile cash daily without fail',
      'Document all discrepancy reasons',
      'Verify bank deposits match records',
      'Review patterns in discrepancies'
    ],
    trainingSteps: [
      { step: 1, title: 'Create Reconciliation', description: 'Start a new reconciliation', action: 'Create reconciliation record' },
      { step: 2, title: 'Enter Amounts', description: 'Record actual cash collected', action: 'Enter cash amounts' },
      { step: 3, title: 'Investigate', description: 'Explain any discrepancies', action: 'Add discrepancy notes' },
      { step: 4, title: 'Submit', description: 'Submit for approval', action: 'Submit reconciliation' }
    ]
  }
}

export function getHelpContent(path: string): HelpContent | null {
  const normalizedPath = path.replace(/^\//, '').split('/')[0]
  return helpContent[normalizedPath] || null
}
