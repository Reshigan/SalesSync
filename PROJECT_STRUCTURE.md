# SalesSync Project Structure

This document outlines the complete structure of the SalesSync field sales management system.

## 📁 Root Directory Structure

```
SalesSync/
├── 📄 README.md                    # Complete project overview and setup guide
├── 📄 CHANGELOG.md                 # Version history and release notes
├── 📄 LICENSE                      # MIT License
├── 📄 PROJECT_STRUCTURE.md         # This file - project structure documentation
├── 📄 package.json                 # Root package configuration
├── 📄 ecosystem.config.js          # PM2 process management configuration
├── 📄 docker-compose.yml           # Development Docker setup
├── 📄 docker-compose.production.yml # Production Docker setup
├── 📄 Dockerfile                   # Development Docker image
├── 📄 Dockerfile.production        # Production Docker image
├── 📄 .dockerignore                # Docker ignore patterns
├── 📄 .gitignore                   # Git ignore patterns
├── 📄 nginx-ss.gonxt.tech.conf     # Nginx configuration for production
├── 📄 salessync-nginx.conf         # Alternative Nginx configuration
├── 📄 .env.development             # Development environment variables
├── 📄 .env.production              # Production environment variables
├── 📄 .env.production.example      # Production environment template
├── 📄 .env.production.template     # Production environment template
├── 📄 .env.test                    # Test environment variables
├── 📄 .env.test.production         # Production test environment
├── 📄 .env.test.template           # Test environment template
├── 📁 .git/                       # Git repository data
├── 📁 .github/                    # GitHub workflows and templates
├── 📁 .husky/                     # Git hooks for code quality
├── 📁 docs/                       # Comprehensive documentation
├── 📁 frontend/                   # Next.js web application
├── 📁 backend-api/                # Node.js/Express API server
├── 📁 mobile-app/                 # React Native mobile application
├── 📁 deployment/                 # Deployment configurations and scripts
├── 📁 nginx/                      # Nginx configuration files
├── 📁 public/                     # Static public assets
└── 📁 scripts/                    # Utility and deployment scripts
```

## 📚 Documentation (`docs/`)

```
docs/
├── 📄 API_DOCUMENTATION.md         # Complete API reference with examples
├── 📄 USER_MANUAL.md              # Comprehensive user guide
├── 📄 DEPLOYMENT_GUIDE.md         # Production deployment instructions
└── 📄 TESTING_GUIDE.md            # Testing strategy and procedures
```

## 🌐 Frontend Application (`frontend/`)

```
frontend/
├── 📄 package.json                # Frontend dependencies and scripts
├── 📄 next.config.js              # Next.js configuration
├── 📄 tailwind.config.js          # Tailwind CSS configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 .eslintrc.json              # ESLint configuration
├── 📄 postcss.config.js           # PostCSS configuration
├── 📄 playwright.config.ts        # Playwright testing configuration
├── 📁 .next/                      # Next.js build output
├── 📁 node_modules/               # Frontend dependencies
├── 📁 public/                     # Static assets
├── 📁 src/                        # Source code
│   ├── 📁 app/                    # Next.js App Router pages
│   │   ├── 📄 layout.tsx          # Root layout component
│   │   ├── 📄 page.tsx            # Home page
│   │   ├── 📄 globals.css         # Global styles
│   │   ├── 📁 login/              # Authentication pages
│   │   ├── 📁 dashboard/          # Main dashboard
│   │   ├── 📁 admin/              # Admin management pages
│   │   ├── 📁 customers/          # Customer management
│   │   ├── 📁 orders/             # Order management
│   │   ├── 📁 products/           # Product management
│   │   ├── 📁 analytics/          # Analytics and reporting
│   │   ├── 📁 settings/           # User settings
│   │   └── 📁 api/                # API route handlers
│   ├── 📁 components/             # Reusable UI components
│   │   ├── 📁 ui/                 # Base UI components
│   │   ├── 📁 layout/             # Layout components
│   │   ├── 📁 forms/              # Form components
│   │   └── 📁 charts/             # Chart components
│   ├── 📁 lib/                    # Utility libraries
│   ├── 📁 hooks/                  # Custom React hooks
│   ├── 📁 store/                  # State management (Zustand)
│   ├── 📁 types/                  # TypeScript type definitions
│   └── 📁 utils/                  # Utility functions
└── 📁 tests/                      # Frontend tests
    ├── 📁 e2e/                    # End-to-end tests
    └── 📁 unit/                   # Unit tests
```

## 🔧 Backend API (`backend-api/`)

```
backend-api/
├── 📄 package.json                # Backend dependencies and scripts
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 .env.example                # Environment variables template
├── 📄 prisma.schema               # Database schema
├── 📁 node_modules/               # Backend dependencies
├── 📁 src/                        # Source code
│   ├── 📄 server.ts               # Main server entry point
│   ├── 📄 app.ts                  # Express application setup
│   ├── 📁 routes/                 # API route handlers
│   │   ├── 📄 auth.ts             # Authentication routes
│   │   ├── 📄 users.ts            # User management
│   │   ├── 📄 customers.ts        # Customer management
│   │   ├── 📄 orders.ts           # Order management
│   │   ├── 📄 products.ts         # Product management
│   │   ├── 📄 analytics.ts        # Analytics endpoints
│   │   └── 📄 dashboard.ts        # Dashboard data
│   ├── 📁 middleware/             # Express middleware
│   │   ├── 📄 auth.ts             # Authentication middleware
│   │   ├── 📄 validation.ts       # Input validation
│   │   ├── 📄 errorHandler.ts     # Error handling
│   │   └── 📄 rateLimiter.ts      # Rate limiting
│   ├── 📁 services/               # Business logic services
│   ├── 📁 models/                 # Database models
│   ├── 📁 utils/                  # Utility functions
│   └── 📁 types/                  # TypeScript types
├── 📁 database/                   # Database files and migrations
├── 📁 scripts/                    # Database and utility scripts
└── 📁 tests/                      # Backend tests
    ├── 📁 unit/                   # Unit tests
    ├── 📁 integration/            # Integration tests
    └── 📁 e2e/                    # End-to-end API tests
```

## 📱 Mobile Application (`mobile-app/`)

```
mobile-app/
├── 📄 package.json                # Mobile app dependencies
├── 📄 app.json                    # Expo configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 babel.config.js             # Babel configuration
├── 📄 metro.config.js             # Metro bundler configuration
├── 📁 node_modules/               # Mobile dependencies
├── 📁 assets/                     # Static assets (images, fonts)
├── 📁 src/                        # Source code
│   ├── 📄 App.tsx                 # Main app component
│   ├── 📁 screens/                # Screen components
│   │   ├── 📄 LoginScreen.tsx     # Login screen
│   │   ├── 📄 DashboardScreen.tsx # Dashboard screen
│   │   ├── 📄 OrdersScreen.tsx    # Orders management
│   │   ├── 📄 CustomersScreen.tsx # Customer management
│   │   └── 📄 ProfileScreen.tsx   # User profile
│   ├── 📁 components/             # Reusable components
│   ├── 📁 navigation/             # Navigation configuration
│   ├── 📁 services/               # API services
│   ├── 📁 store/                  # State management
│   ├── 📁 types/                  # TypeScript types
│   └── 📁 utils/                  # Utility functions
└── 📁 __tests__/                  # Mobile app tests
```

## 🚀 Deployment (`deployment/`)

```
deployment/
├── 📁 docker/                     # Docker configurations
├── 📁 nginx/                      # Nginx configurations
├── 📁 systemd/                    # Systemd service files
├── 📁 k8s/                        # Kubernetes manifests
└── 📁 cicd/                       # CI/CD pipeline configurations
```

## 🔧 Scripts (`scripts/`)

```
scripts/
├── 📄 setup.sh                    # Initial project setup
├── 📄 deploy.sh                   # Deployment script
├── 📄 backup.sh                   # Database backup
└── 📄 restore.sh                  # Database restore
```

## 🌐 Public Assets (`public/`)

```
public/
├── 📄 favicon.ico                 # Website favicon
├── 📄 logo.svg                    # Company logo
└── 📁 images/                     # Static images
```

## 🔧 Configuration Files

### Environment Variables
- `.env.development` - Development environment settings
- `.env.production` - Production environment settings
- `.env.test` - Test environment settings

### Process Management
- `ecosystem.config.js` - PM2 configuration for production

### Web Server
- `nginx-ss.gonxt.tech.conf` - Production Nginx configuration
- `salessync-nginx.conf` - Alternative Nginx setup

### Containerization
- `Dockerfile` - Development Docker image
- `Dockerfile.production` - Production Docker image
- `docker-compose.yml` - Development containers
- `docker-compose.production.yml` - Production containers

## 🎯 Key Features by Directory

### Frontend (`frontend/`)
- **Modern UI**: Next.js 14 with Tailwind CSS
- **Authentication**: JWT-based login system
- **Dashboard**: Comprehensive analytics and KPIs
- **Management**: Users, customers, orders, products
- **Responsive**: Mobile-first design
- **Testing**: Playwright E2E tests

### Backend (`backend-api/`)
- **RESTful API**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with refresh
- **Authorization**: Role-based access control (REBAC)
- **Security**: Rate limiting, input validation
- **Testing**: Unit and integration tests

### Mobile (`mobile-app/`)
- **Cross-platform**: React Native with Expo
- **Offline Support**: Local data caching
- **Camera Integration**: Barcode scanning
- **GPS Tracking**: Location-based features
- **Push Notifications**: Real-time updates

### Documentation (`docs/`)
- **API Reference**: Complete endpoint documentation
- **User Guide**: Step-by-step feature guides
- **Deployment**: Production setup instructions
- **Testing**: Testing strategy and procedures

## 🔄 Development Workflow

1. **Local Development**: Use `docker-compose.yml` for local setup
2. **Testing**: Run unit, integration, and E2E tests
3. **Building**: Production builds for all components
4. **Deployment**: PM2 process management in production
5. **Monitoring**: System health and performance tracking

## 📊 Production Status

- **Live URL**: https://ss.gonxt.tech
- **SSL Rating**: A+ with comprehensive security headers
- **Users**: 177 active users across 10 role types
- **Uptime**: 99.9% availability
- **Performance**: Optimized for mobile and desktop

## 🔐 Security Features

- **HTTPS**: SSL/TLS encryption with security headers
- **Authentication**: JWT with secure token management
- **Authorization**: Role-based access control (REBAC)
- **Input Validation**: Comprehensive sanitization
- **Rate Limiting**: API endpoint protection
- **Security Headers**: HSTS, CSP, and other protections

This structure represents a production-ready, enterprise-grade field sales management system with comprehensive documentation, testing, and deployment configurations.