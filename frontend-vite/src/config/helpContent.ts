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

export interface TourStep {
  target: string
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

export const tourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar-toggle"]',
    title: 'Navigation Menu',
    description: 'Tap the menu icon to open the sidebar. Browse modules organized by category: Sales, Operations, Finance, Marketing, and Compliance.',
    position: 'right'
  },
  {
    target: '[data-tour="search"]',
    title: 'Global Search',
    description: 'Quickly find customers, orders, products, or any record. Type to search across all modules instantly.',
    position: 'bottom'
  },
  {
    target: '[data-tour="mega-menu"]',
    title: 'Quick Navigation',
    description: 'On desktop, use the mega menu for fast access to any module. Categories are organized with icons for easy scanning.',
    position: 'bottom'
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    description: 'Stay updated with real-time alerts for pending approvals, new orders, inventory alerts, and system notifications.',
    position: 'bottom'
  },
  {
    target: '[data-tour="help-button"]',
    title: 'Help & Training',
    description: 'Access context-sensitive help and step-by-step training for the current page. Each module has its own quick start guide and training steps.',
    position: 'left'
  }
]

export const helpContent: Record<string, HelpContent> = {
  dashboard: {
    title: 'Dashboard Overview',
    description: 'Your command center showing real-time sales performance, field operations, and key metrics. Cards display KPIs at a glance \u2014 tap any card to drill into details.',
    quickStart: [
      'Review metric cards for Total Revenue, Orders, and Active Customers',
      'Use the Date Range picker to compare different periods',
      'Tap any metric card to navigate to its detailed view',
      'Open the sidebar menu to navigate to specific modules'
    ],
    keyFeatures: [
      'Real-time KPI cards with trend indicators',
      'Recent activity feed showing latest orders and visits',
      'Quick action buttons for common tasks (New Order, New Customer)',
      'Responsive layout \u2014 cards stack vertically on mobile'
    ],
    tips: [
      'On mobile, swipe horizontally on tables to see all columns',
      'Use the floating help button (bottom-right) on any page for guidance',
      'The sidebar auto-closes on mobile after navigation for a cleaner view',
      'Cards use rounded corners and shadows \u2014 the same visual language across all pages'
    ],
    trainingSteps: [
      { step: 1, title: 'Explore the Dashboard', description: 'Review each metric card to understand your business snapshot', action: 'Tap on the Total Revenue card' },
      { step: 2, title: 'Navigate with the Sidebar', description: 'Open the menu and explore module categories: Sales, Operations, Finance', action: 'Tap the hamburger menu icon' },
      { step: 3, title: 'Try a Quick Action', description: 'Use the action buttons to create a new order or customer', action: 'Tap "+ New Customer" or "+ Create Order"' },
      { step: 4, title: 'Check Notifications', description: 'Review pending approvals and alerts', action: 'Tap the bell icon in the header' }
    ]
  },

  'van-sales': {
    title: 'Van Sales Operations',
    description: 'Manage mobile sales end-to-end: load inventory, follow routes, take orders, collect payments, and reconcile at day-end. All forms use step-by-step wizards for easy data entry.',
    quickStart: [
      'Load inventory onto your van using the Van Load wizard',
      'Follow your assigned route \u2014 stops are listed in order',
      'Create orders at each stop using the order wizard',
      'Reconcile cash and inventory at the end of day'
    ],
    keyFeatures: [
      'Step-by-step Van Load wizard with quantity validation',
      'Route map with GPS-verified customer stops',
      'Mobile-optimized order form with product search',
      'End-of-day cash and inventory reconciliation',
      'Offline support \u2014 sync when back online'
    ],
    tips: [
      'The Van Load form uses a wizard \u2014 fill each step and review before submitting',
      'On mobile, route stops show as a scrollable list with status indicators',
      'Use the search bar in order forms to quickly find products',
      'Cash reconciliation highlights discrepancies automatically in red'
    ],
    trainingSteps: [
      { step: 1, title: 'Create a Van Load', description: 'Use the step-by-step wizard to load products onto your van', action: 'Go to Van Loads and tap "+ New Load"' },
      { step: 2, title: 'Start Your Route', description: 'View assigned stops and navigate to the first customer', action: 'Open Route Management' },
      { step: 3, title: 'Take an Order', description: 'Create a sales order using the order wizard at a customer stop', action: 'Tap "Create Order" at a route stop' },
      { step: 4, title: 'Reconcile', description: 'End your day by reconciling cash and remaining inventory', action: 'Go to Cash Reconciliation' }
    ]
  },

  'field-operations': {
    title: 'Field Operations',
    description: 'Coordinate field agents: schedule visits, track locations via GPS, manage board placements, and monitor product distribution. Real-time dashboards show agent activity.',
    quickStart: [
      'View agent locations on the live GPS tracking map',
      'Review visit reports with photos and check-in data',
      'Manage board placements with photo verification',
      'Track product distribution by agent and territory'
    ],
    keyFeatures: [
      'Live GPS tracking map with agent markers',
      'Visit verification with geofencing and photos',
      'Board placement tracking with before/after photos',
      'Product distribution forms with quantity tracking',
      'Agent performance dashboards with KPI cards'
    ],
    tips: [
      'The GPS map is interactive \u2014 zoom and pan to see agent locations',
      'Visit detail pages show a timeline of activities with timestamps',
      'Use the filter bar to view visits by date, agent, or territory',
      'Board placement photos can be enlarged by tapping on them'
    ],
    trainingSteps: [
      { step: 1, title: 'Track Agents', description: 'View real-time agent locations on the GPS map', action: 'Go to Live GPS Tracking' },
      { step: 2, title: 'Review Visits', description: 'Check completed visits with details and photos', action: 'Open Visit History' },
      { step: 3, title: 'Board Placements', description: 'View and manage board placement activities', action: 'Check Board Placement section' },
      { step: 4, title: 'Performance', description: 'Review agent performance metrics and commissions', action: 'Open Agent Dashboard' }
    ]
  },

  kyc: {
    title: 'KYC & Compliance',
    description: 'Manage customer verification using step-by-step KYC forms. Upload documents, track approval status, and generate compliance reports.',
    quickStart: [
      'Create new KYC cases using the multi-step wizard',
      'Upload documents (ID, proof of address, etc.)',
      'Review and approve/reject submissions',
      'Generate compliance reports'
    ],
    keyFeatures: [
      'Step-by-step KYC wizard with document upload',
      'Multi-stage approval workflow with status tracking',
      'Document viewer with zoom and download',
      'Compliance dashboard with KPI cards',
      'Audit trail for all verification activities'
    ],
    tips: [
      'The KYC form uses a wizard \u2014 complete each step before moving to the next',
      'Documents can be uploaded from your phone camera or file picker',
      'Use the status filter to find cases needing your review',
      'The audit trail shows every action taken on each KYC case'
    ],
    trainingSteps: [
      { step: 1, title: 'Create KYC Case', description: 'Start a new verification using the step-by-step wizard', action: 'Tap "+ New KYC Case"' },
      { step: 2, title: 'Upload Documents', description: 'Add required documents to the case', action: 'Use the document upload step' },
      { step: 3, title: 'Review & Decide', description: 'Review submitted cases and approve or reject', action: 'Open a pending case' },
      { step: 4, title: 'Run Reports', description: 'Generate compliance and audit reports', action: 'Go to KYC Reports' }
    ]
  },

  surveys: {
    title: 'Survey Management',
    description: 'Create, distribute, and analyze surveys. The survey builder uses drag-and-drop for easy question creation. Responses are visualized with interactive charts.',
    quickStart: [
      'Create surveys using the builder with various question types',
      'Assign surveys to field agents or customer segments',
      'Monitor response rates on the dashboard',
      'Analyze results with built-in chart visualizations'
    ],
    keyFeatures: [
      'Visual survey builder with drag-and-drop',
      'Multiple question types (MCQ, rating, text, photo, GPS)',
      'Conditional logic and question branching',
      'Real-time response tracking dashboard',
      'Chart-based analytics and export'
    ],
    tips: [
      'Keep surveys under 10 questions for better completion rates',
      'Use conditional logic to skip irrelevant questions',
      'The response dashboard updates in real-time as responses come in',
      'Export survey data to CSV for custom analysis'
    ],
    trainingSteps: [
      { step: 1, title: 'Build a Survey', description: 'Use the survey builder to create questions', action: 'Go to Survey Management and create new' },
      { step: 2, title: 'Distribute', description: 'Assign the survey to agents or customers', action: 'Set up distribution rules' },
      { step: 3, title: 'Monitor', description: 'Track completion rates on the dashboard', action: 'View Survey Dashboard' },
      { step: 4, title: 'Analyze', description: 'Review responses and generate insights', action: 'Open Survey Analytics' }
    ]
  },

  inventory: {
    title: 'Inventory Management',
    description: 'Track stock across warehouses with real-time levels, movements, transfers, and counts. Cards show stock metrics at a glance, and tables scroll horizontally on mobile.',
    quickStart: [
      'View stock levels on the Inventory Dashboard',
      'Process stock receipts and issues',
      'Create transfers between warehouses using the transfer wizard',
      'Schedule and perform stock counts'
    ],
    keyFeatures: [
      'Multi-warehouse stock tracking with KPI cards',
      'Stock movement history with full audit trail',
      'Transfer wizard for inter-warehouse movements',
      'Stock count workflow with variance resolution',
      'Batch and serial number tracking'
    ],
    tips: [
      'Stock level cards are color-coded: green (OK), yellow (low), red (critical)',
      'Use the search bar in stock tables to quickly find products',
      'Transfer forms use a step-by-step wizard \u2014 review before confirming',
      'Stock count variances must be resolved before count approval'
    ],
    trainingSteps: [
      { step: 1, title: 'Check Stock Levels', description: 'Review inventory dashboard and KPI cards', action: 'Go to Inventory Dashboard' },
      { step: 2, title: 'Create a Transfer', description: 'Move stock between warehouses using the wizard', action: 'Start a new stock transfer' },
      { step: 3, title: 'Run a Stock Count', description: 'Perform a physical count and resolve variances', action: 'Create a stock count' },
      { step: 4, title: 'Review Movements', description: 'Audit stock movement history', action: 'Open Stock Movements' }
    ]
  },

  promotions: {
    title: 'Promotions Management',
    description: 'Create and manage promotional campaigns with flexible discount rules. The promotion dashboard shows active campaigns with performance metrics.',
    quickStart: [
      'Create promotions using the setup wizard',
      'Define discount rules (percentage, fixed, BOGO)',
      'Assign to products or customer segments',
      'Monitor performance on the promotions dashboard'
    ],
    keyFeatures: [
      'Promotion wizard with rule configuration',
      'Multiple discount types (percentage, fixed, buy-one-get-one)',
      'Customer segment targeting',
      'Performance tracking with ROI metrics',
      'Time-based scheduling with auto-activation'
    ],
    tips: [
      'The promotion form is a multi-step wizard \u2014 set rules, targets, then schedule',
      'Use the dashboard KPI cards to compare promotion performance',
      'Set clear start/end dates to auto-activate and deactivate promotions',
      'Test with a small segment before rolling out broadly'
    ],
    trainingSteps: [
      { step: 1, title: 'Create Promotion', description: 'Use the wizard to set up a new promotion', action: 'Tap "+ New Promotion"' },
      { step: 2, title: 'Configure Rules', description: 'Set discount type, amount, and conditions', action: 'Fill in the rules step' },
      { step: 3, title: 'Target Audience', description: 'Choose products or customer segments', action: 'Set targeting criteria' },
      { step: 4, title: 'Monitor Performance', description: 'Track redemptions and ROI', action: 'View Promotions Dashboard' }
    ]
  },

  'trade-marketing': {
    title: 'Trade Marketing',
    description: 'Plan and execute trade marketing activities: in-store activations, retailer incentives, and market analysis. Track spend and measure ROI across campaigns.',
    quickStart: [
      'Plan activations using the campaign wizard',
      'Set up retailer incentive programs',
      'Track trade spend by channel and region',
      'Analyze market share and competitor activity'
    ],
    keyFeatures: [
      'Campaign planning wizard with budget allocation',
      'Retailer incentive management',
      'Trade spend tracking with budget vs actual',
      'Market analysis with competitive insights',
      'Merchandising compliance tracking with photos'
    ],
    tips: [
      'Campaign forms use a step-by-step wizard for easy planning',
      'Budget cards are color-coded by utilization percentage',
      'Compliance photos can be viewed in a gallery view',
      'Use filters to compare campaign performance by region'
    ],
    trainingSteps: [
      { step: 1, title: 'Plan a Campaign', description: 'Create a trade marketing campaign with the wizard', action: 'Go to Campaign Management' },
      { step: 2, title: 'Set Incentives', description: 'Configure retailer incentive rules', action: 'Open Promoter Management' },
      { step: 3, title: 'Track Spend', description: 'Monitor budget utilization', action: 'View Analytics' },
      { step: 4, title: 'Check Compliance', description: 'Review merchandising compliance photos', action: 'Open Merchandising Compliance' }
    ]
  },

  campaigns: {
    title: 'Campaign Management',
    description: 'Create and manage marketing campaigns across channels. Use the campaign wizard to set up targeting, content, and scheduling.',
    quickStart: [
      'Create campaigns using the step-by-step wizard',
      'Define target audiences and segments',
      'Set up campaign content and channels',
      'Monitor performance with real-time dashboards'
    ],
    keyFeatures: [
      'Multi-channel campaign wizard',
      'Audience segmentation and targeting',
      'A/B testing with variant tracking',
      'Real-time performance dashboards',
      'Campaign scheduling with auto-activation'
    ],
    tips: [
      'The campaign form walks you through each step: audience, content, schedule',
      'A/B test results show statistical significance indicators',
      'Use the dashboard cards to compare campaign performance',
      'Schedule campaigns in advance and they auto-activate'
    ],
    trainingSteps: [
      { step: 1, title: 'Create Campaign', description: 'Use the wizard to build a new campaign', action: 'Tap "+ New Campaign"' },
      { step: 2, title: 'Set Audience', description: 'Define who should receive the campaign', action: 'Configure targeting' },
      { step: 3, title: 'A/B Test', description: 'Set up variants to test different approaches', action: 'Create an A/B test' },
      { step: 4, title: 'Track Results', description: 'Monitor campaign performance', action: 'View campaign dashboard' }
    ]
  },

  finance: {
    title: 'Finance Management',
    description: 'Manage invoicing, payments, and cash reconciliation. KPI cards show financial health at a glance. Forms use step-by-step wizards for accuracy.',
    quickStart: [
      'Review financial KPI cards on the dashboard',
      'Create invoices using the invoice wizard',
      'Record payments and allocate to invoices',
      'Process daily cash reconciliations'
    ],
    keyFeatures: [
      'Financial KPI dashboard with trend indicators',
      'Invoice wizard with line item management',
      'Payment recording and allocation',
      'Cash reconciliation with discrepancy tracking',
      'Financial reports with export capability'
    ],
    tips: [
      'Invoice forms use a wizard \u2014 add line items, review totals, then submit',
      'Payment allocation automatically suggests matching invoices',
      'Cash reconciliation highlights discrepancies in red for attention',
      'Use the Reports section for month-end financial summaries'
    ],
    trainingSteps: [
      { step: 1, title: 'Financial Dashboard', description: 'Review KPI cards and financial metrics', action: 'Open Finance Dashboard' },
      { step: 2, title: 'Create Invoice', description: 'Build an invoice using the step-by-step wizard', action: 'Go to Invoices' },
      { step: 3, title: 'Record Payment', description: 'Enter a payment and allocate to invoices', action: 'Process a payment' },
      { step: 4, title: 'Reconcile Cash', description: 'Complete daily cash reconciliation', action: 'Go to Cash Reconciliation' }
    ]
  },

  sales: {
    title: 'Sales Management',
    description: 'Manage the complete sales cycle: orders, invoices, payments, returns, and credit notes. All forms use step-by-step wizards with product search and auto-calculations.',
    quickStart: [
      'Create orders using the order wizard with product search',
      'Generate invoices from completed orders',
      'Record customer payments',
      'Process returns and issue credit notes'
    ],
    keyFeatures: [
      'Order wizard with product search and quantity management',
      'Automated invoice generation from orders',
      'Payment tracking with allocation to invoices',
      'Returns processing with credit note workflow',
      'Sales analytics with trend charts'
    ],
    tips: [
      'The order form is a wizard \u2014 search products, set quantities, review, then submit',
      'Order detail pages show tabs: Items, Payments, Returns, Delivery',
      'On mobile, tables scroll horizontally to show all columns',
      'Use the header buttons to Export data or Create new records'
    ],
    trainingSteps: [
      { step: 1, title: 'Create an Order', description: 'Use the order wizard to add products and submit', action: 'Tap "+ Create Order"' },
      { step: 2, title: 'View Order Details', description: 'Explore the tabbed detail view with items, payments, returns', action: 'Open an existing order' },
      { step: 3, title: 'Record a Payment', description: 'Enter payment details and allocate to an invoice', action: 'Go to Payments' },
      { step: 4, title: 'Process a Return', description: 'Create a return and issue a credit note', action: 'Go to Returns' }
    ]
  },

  customers: {
    title: 'Customer Management',
    description: 'Manage customer records, view transaction history, and track relationships. The customer form uses a step-by-step wizard for structured data entry.',
    quickStart: [
      'Browse customers using the searchable list with filters',
      'Create customers using the multi-step wizard',
      'View customer details with tabbed information',
      'Track customer orders, payments, and visit history'
    ],
    keyFeatures: [
      'Customer wizard with contact, address, and business details steps',
      'Searchable customer list with type and status filters',
      'Tabbed detail view: Orders, Payments, Visits, KYC, Surveys',
      'Customer KPI cards showing total sales and order value',
      'GPS location capture for customer addresses'
    ],
    tips: [
      'The customer form wizard guides you through each data section',
      'Use the search and filter bar to quickly find specific customers',
      'Customer detail pages have tabs \u2014 swipe on mobile to see all tabs',
      'Import/Export buttons in the header support bulk operations'
    ],
    trainingSteps: [
      { step: 1, title: 'Browse Customers', description: 'Use the list with search and filters to find customers', action: 'Go to Customers page' },
      { step: 2, title: 'Create a Customer', description: 'Use the step-by-step wizard to add a new customer', action: 'Tap "+ New Customer"' },
      { step: 3, title: 'View Details', description: 'Explore the tabbed detail view with Orders, Payments, Visits', action: 'Open a customer record' },
      { step: 4, title: 'Track History', description: 'Review transaction history and visit log', action: 'Check the Orders and Visits tabs' }
    ]
  },

  products: {
    title: 'Product Management',
    description: 'Manage your product catalog with categories, pricing, and inventory levels. Product forms use wizards for structured data entry.',
    quickStart: [
      'Browse products with search and category filters',
      'Add products using the product wizard',
      'Configure pricing and set up price lists',
      'View product inventory levels across warehouses'
    ],
    keyFeatures: [
      'Product wizard with details, pricing, and inventory steps',
      'Category and brand organization',
      'Multi-warehouse inventory visibility',
      'Tabbed detail view: Inventory, Pricing, Promotions, Sales',
      'Product import/export for bulk operations'
    ],
    tips: [
      'Product cards show key info at a glance \u2014 tap for full details',
      'The detail page has tabs: Inventory, Pricing, Promotions, Sales history',
      'Use price lists to manage different pricing tiers',
      'Inventory levels are color-coded by stock status'
    ],
    trainingSteps: [
      { step: 1, title: 'Browse Products', description: 'Use search and filters to explore the catalog', action: 'Go to Products page' },
      { step: 2, title: 'Add a Product', description: 'Use the wizard to create a new product', action: 'Tap "+ Add Product"' },
      { step: 3, title: 'Set Pricing', description: 'Configure product pricing and price lists', action: 'Edit product pricing' },
      { step: 4, title: 'Check Inventory', description: 'View stock levels across warehouses', action: 'Open the Inventory tab' }
    ]
  },

  admin: {
    title: 'System Administration',
    description: 'Configure system settings, manage users, roles, and permissions. Access audit logs, manage brands, territories, and price lists.',
    quickStart: [
      'Add and manage users with role assignments',
      'Configure roles and granular permissions',
      'Manage brands, territories, and price lists',
      'Review audit logs for system activity'
    ],
    keyFeatures: [
      'User management with role-based access control',
      'Granular permission configuration',
      'Brand and territory management',
      'Price list administration',
      'Comprehensive audit logging'
    ],
    tips: [
      'Follow the principle of least privilege for user permissions',
      'Review audit logs regularly for unusual activity',
      'Use territories to control data visibility per region',
      'Brand and price list changes take effect immediately'
    ],
    trainingSteps: [
      { step: 1, title: 'Manage Users', description: 'Add users and assign roles', action: 'Go to User Management' },
      { step: 2, title: 'Configure Roles', description: 'Set up roles with specific permissions', action: 'Open Role Permissions' },
      { step: 3, title: 'Set Up Territories', description: 'Define territories for regional management', action: 'Go to Territory Management' },
      { step: 4, title: 'Review Audit Logs', description: 'Check system activity and changes', action: 'Open Audit Logs' }
    ]
  },

  commissions: {
    title: 'Commission Management',
    description: 'Calculate, approve, and pay agent commissions. Configure commission rules, track earnings, and manage the complete payout lifecycle.',
    quickStart: [
      'View pending commission calculations on the dashboard',
      'Review commission rules and tier structures',
      'Approve calculated commissions',
      'Process commission payouts'
    ],
    keyFeatures: [
      'Automated commission calculation engine',
      'Multi-tier commission structures',
      'Approval workflow with audit trail',
      'Payout processing and tracking',
      'Commission reports with breakdown views'
    ],
    tips: [
      'Dashboard cards show pending, approved, and paid totals',
      'Commission detail pages show the full calculation breakdown',
      'Payout forms use a wizard \u2014 verify amounts before processing',
      'Use the reports section for monthly commission summaries'
    ],
    trainingSteps: [
      { step: 1, title: 'View Dashboard', description: 'Review commission KPIs and pending calculations', action: 'Open Commission Dashboard' },
      { step: 2, title: 'Review Rules', description: 'Understand how commissions are calculated', action: 'Go to Commission Settings' },
      { step: 3, title: 'Approve Commissions', description: 'Review and approve pending calculations', action: 'Open Approval Queue' },
      { step: 4, title: 'Process Payout', description: 'Create and submit a commission payout', action: 'Go to Payments' }
    ]
  },

  'cash-reconciliation': {
    title: 'Cash Reconciliation',
    description: 'Reconcile daily cash collections from field agents and van sales. Track expected vs actual amounts, investigate discrepancies, and submit for approval.',
    quickStart: [
      'Create daily reconciliation sessions',
      'Enter actual cash collected amounts',
      'Investigate and document any discrepancies',
      'Submit for approval and record bank deposits'
    ],
    keyFeatures: [
      'Daily reconciliation workflow with status tracking',
      'Expected vs actual comparison with variance highlighting',
      'Discrepancy investigation with notes',
      'Approval workflow for reconciliation sign-off',
      'Bank deposit tracking and verification'
    ],
    tips: [
      'Variance amounts are highlighted in red for quick identification',
      'Always document reasons for any cash discrepancies',
      'The reconciliation form walks you through collections, then deposits',
      'Use the Reports section for weekly/monthly cash summaries'
    ],
    trainingSteps: [
      { step: 1, title: 'Create Session', description: 'Start a new daily reconciliation session', action: 'Tap "+ New Session"' },
      { step: 2, title: 'Enter Collections', description: 'Record actual cash amounts collected', action: 'Fill in collection amounts' },
      { step: 3, title: 'Resolve Variances', description: 'Investigate and document any discrepancies', action: 'Add variance notes' },
      { step: 4, title: 'Submit & Deposit', description: 'Submit for approval and record bank deposit', action: 'Submit reconciliation' }
    ]
  },

  analytics: {
    title: 'Analytics Dashboard',
    description: 'Advanced analytics with interactive charts, trend analysis, and performance comparisons. Filter by date range, region, or agent to drill into specific data.',
    quickStart: [
      'Select a date range to view analytics for a specific period',
      'Use chart filters to compare metrics by region or agent',
      'Hover over chart data points for detailed tooltips',
      'Export charts and data for presentations'
    ],
    keyFeatures: [
      'Interactive line, bar, and pie charts',
      'Multi-metric comparison views',
      'Regional and agent-level drill-down',
      'Exportable reports and data tables'
    ],
    tips: [
      'Charts are fully responsive \u2014 they resize automatically on mobile',
      'Use the filter bar at the top to narrow data by date, region, or product',
      'Scroll horizontally on data tables to see all columns on mobile',
      'Compare periods using the date range selector'
    ],
    trainingSteps: [
      { step: 1, title: 'Set Date Range', description: 'Choose a time period for analysis', action: 'Use the date range picker' },
      { step: 2, title: 'Read Charts', description: 'Understand each chart type and what it shows', action: 'Hover over data points' },
      { step: 3, title: 'Filter Data', description: 'Narrow results by region, product, or agent', action: 'Apply filters' },
      { step: 4, title: 'Export Report', description: 'Download data for offline analysis', action: 'Click Export' }
    ]
  },

  'field-marketing': {
    title: 'Field Marketing',
    description: 'Manage field marketing agents, board placements, SIM activations, and commissions. Track daily targets and view commission earnings in real-time.',
    quickStart: [
      'View your daily targets and progress on the dashboard',
      'Log board placements with photo evidence',
      'Track SIM activations and earnings',
      'Check commission statements and payout history'
    ],
    keyFeatures: [
      'Daily/monthly target tracking with progress bars',
      'Board and SIM placement logging with GPS verification',
      'Real-time commission calculations',
      'Commission dashboard with earnings breakdown',
      'Territory-based performance comparisons'
    ],
    tips: [
      'The dashboard shows your targets vs actuals with color-coded progress bars',
      'Upload board photos directly from your phone camera',
      'Commission earnings update in real-time as placements are verified',
      'Use the My Commissions page to see detailed earning breakdowns'
    ],
    trainingSteps: [
      { step: 1, title: 'View Dashboard', description: 'Check your daily targets and recent activity', action: 'Open Field Marketing Dashboard' },
      { step: 2, title: 'Log a Placement', description: 'Record a board or SIM placement with photo', action: 'Tap "+ New Placement"' },
      { step: 3, title: 'Check Commissions', description: 'View your earnings and commission breakdown', action: 'Go to My Commissions' },
      { step: 4, title: 'Review Targets', description: 'See how you are tracking against monthly targets', action: 'Check Target Progress' }
    ]
  },

  'field-agents': {
    title: 'Field Agent Management',
    description: 'Manage field agents, assign territories, set targets, and track performance. Includes commission tracking, product distribution, and board placement monitoring.',
    quickStart: [
      'View all agents and their assigned territories',
      'Set daily and monthly targets per agent',
      'Monitor agent performance against targets',
      'Review commission calculations and payouts'
    ],
    keyFeatures: [
      'Agent directory with territory assignments',
      'Target management (daily/monthly for boards and SIMs)',
      'Performance scorecards with KPI tracking',
      'Commission calculation and approval workflow',
      'Product distribution analytics'
    ],
    tips: [
      'Agent cards show key metrics at a glance \u2014 tap for full details',
      'Use the performance filters to identify top and underperforming agents',
      'Commission calculations run automatically based on verified placements',
      'Export agent performance data for team reviews'
    ],
    trainingSteps: [
      { step: 1, title: 'Browse Agents', description: 'View the agent list and their territories', action: 'Go to Field Agents page' },
      { step: 2, title: 'Set Targets', description: 'Configure daily and monthly targets', action: 'Edit an agent to set targets' },
      { step: 3, title: 'Track Performance', description: 'Review agent scorecards and KPIs', action: 'Open Commission Tracking' },
      { step: 4, title: 'Manage Distribution', description: 'Track product distribution by agent', action: 'Check Product Distribution' }
    ]
  },

  reports: {
    title: 'Reports & Analytics',
    description: 'Generate and view reports across all modules. Filter by date range, region, and other criteria. Export to CSV or PDF for offline use.',
    quickStart: [
      'Select a report type from the available templates',
      'Configure filters (date range, region, product)',
      'Generate the report and review results',
      'Export to CSV or PDF for sharing'
    ],
    keyFeatures: [
      'Pre-built report templates for each module',
      'Flexible date and dimension filters',
      'Interactive charts and data tables',
      'Export to CSV and PDF formats',
      'Scheduled report generation'
    ],
    tips: [
      'Report tables scroll horizontally on mobile \u2014 swipe to see all columns',
      'Use date range presets (This Week, This Month, etc.) for quick filtering',
      'Export data to CSV for custom analysis in spreadsheets',
      'Charts are interactive \u2014 hover/tap for detailed tooltips'
    ],
    trainingSteps: [
      { step: 1, title: 'Choose Report', description: 'Select a report template from the list', action: 'Browse report types' },
      { step: 2, title: 'Set Filters', description: 'Configure date range and other criteria', action: 'Apply filters' },
      { step: 3, title: 'Review Results', description: 'Analyze the report data and charts', action: 'Explore the report' },
      { step: 4, title: 'Export', description: 'Download the report for sharing', action: 'Click Export' }
    ]
  },

  events: {
    title: 'Events Management',
    description: 'Plan and manage marketing events. Track attendance, budgets, and event outcomes with detailed reporting.',
    quickStart: [
      'Create events using the event wizard',
      'Set dates, locations, and budgets',
      'Track attendee registrations',
      'Review event outcomes and ROI'
    ],
    keyFeatures: [
      'Event creation wizard with scheduling',
      'Budget tracking and allocation',
      'Attendee management',
      'Post-event reporting and ROI analysis'
    ],
    tips: [
      'The event form is a wizard \u2014 fill details step by step',
      'Budget cards show planned vs actual spend',
      'Export attendee lists for communication',
      'Use the calendar view for event scheduling overview'
    ],
    trainingSteps: [
      { step: 1, title: 'Create Event', description: 'Use the wizard to set up a new event', action: 'Tap "+ New Event"' },
      { step: 2, title: 'Set Budget', description: 'Allocate budget for the event', action: 'Configure budget' },
      { step: 3, title: 'Manage Attendees', description: 'Track registrations and attendance', action: 'View attendee list' },
      { step: 4, title: 'Review Outcomes', description: 'Analyze event results and ROI', action: 'Check event report' }
    ]
  }
}

export function getHelpContent(path: string): HelpContent | null {
  const segments = path.replace(/^\//, '').split('/')
  const key = segments[0]
  if (key === 'sales' && segments.length > 1) {
    return helpContent['sales'] || null
  }
  return helpContent[key] || null
}
