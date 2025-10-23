# SalesSync - Comprehensive Field Sales Management System

A modern, full-stack field sales management system designed for enterprise-level sales operations with mobile-first approach for field agents.

## 🚀 Live Demo

- **Production URL**: https://ss.gonxt.tech
- **Admin Dashboard**: https://ss.gonxt.tech/admin
- **API Documentation**: https://ss.gonxt.tech/api/docs

> **Status**: ✅ Production system fully operational with SSL certificate and automated CI/CD deployment

### Demo Credentials
- **Administrator**: admin@demo.com / admin123
- **Field Agent**: agent@demo.com / agent123

## 📱 Applications

### Web Application
- **Frontend**: Modern Next.js 14 with TypeScript and Tailwind CSS
- **Admin Dashboard**: Comprehensive management interface
- **Real-time Analytics**: Sales metrics and performance tracking

### Mobile Application
- **React Native**: Cross-platform mobile app with Expo
- **Field Agent Tools**: Optimized for on-the-go sales operations
- **Offline Support**: Work without internet connectivity

### Backend API
- **Node.js/Express**: RESTful API with TypeScript
- **PostgreSQL**: Enterprise-grade database
- **JWT Authentication**: Secure role-based access control

## ✨ Key Features

### 🔐 Authentication & Authorization
- **REBAC System**: Role-based access control with 10+ predefined roles
- **JWT Tokens**: Secure authentication with refresh tokens
- **Multi-tenant**: Support for multiple organizations
- **177 Active Users**: Production-ready user management

### 👥 User Management
- **Hierarchical Roles**: From Super Admin to Data Analyst
- **Permission Matrix**: 18-150 permissions per role
- **User Profiles**: Comprehensive user information management
- **Activity Tracking**: User action logging and audit trails

### 🛒 Order Management
- **End-to-End Processing**: From creation to delivery
- **Status Tracking**: Real-time order status updates
- **Customer Integration**: Linked customer and order data
- **Mobile Ordering**: Field agents can create orders on-the-go

### 📊 Customer Management
- **360° Customer View**: Complete customer lifecycle management
- **Contact Management**: Phone, email, and address tracking
- **Order History**: Customer purchase patterns and history
- **Geographic Organization**: Location-based customer grouping

### 📦 Inventory Management
- **Real-time Tracking**: Live inventory levels and updates
- **Product Catalog**: Comprehensive product information
- **Stock Alerts**: Low inventory notifications
- **Barcode Scanning**: Mobile barcode scanning for inventory

### 📈 Analytics & Reporting
- **Sales Dashboards**: Real-time sales performance metrics
- **Custom Reports**: Flexible reporting system
- **Data Visualization**: Charts and graphs for insights
- **Export Capabilities**: PDF and Excel report generation

## 🏗️ Architecture

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **React Hook Form**: Form handling and validation
- **Framer Motion**: Smooth animations and transitions

### Backend Stack
- **Node.js 18+**: JavaScript runtime
- **Express.js**: Web application framework
- **TypeScript**: Type-safe backend development
- **Prisma ORM**: Database toolkit and ORM
- **PostgreSQL**: Primary database
- **JWT**: JSON Web Token authentication
- **bcrypt**: Password hashing

### Mobile Stack
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe mobile development
- **React Navigation**: Navigation library
- **AsyncStorage**: Local data persistence
- **Expo Camera**: Barcode scanning capabilities

### Infrastructure
- **PM2**: Process management
- **Nginx**: Reverse proxy and load balancer
- **SSL/TLS**: HTTPS encryption with security headers
- **Docker**: Containerization support
- **GitHub Actions**: CI/CD pipeline

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Reshigan/SalesSync.git
   cd SalesSync
   ```

2. **Backend Setup**
   ```bash
   cd backend-api
   npm install
   cp .env.example .env
   # Configure your database URL and JWT secret
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   # Configure API URL
   npm run dev
   ```

4. **Mobile App Setup**
   ```bash
   cd mobile-app
   npm install
   npx expo start
   ```

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/salessync"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=3001
NODE_ENV=development
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Mobile App (.env)
```env
API_BASE_URL=http://localhost:3001
```

## 📁 Project Structure

```
SalesSync/
├── 📱 mobile-app/              # React Native mobile application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── navigation/         # Navigation configuration
│   │   ├── screens/            # App screens
│   │   ├── services/           # API and business logic
│   │   └── types/              # TypeScript definitions
│   └── package.json
├── 🌐 frontend/                # Next.js web application
│   ├── src/
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utility libraries
│   │   └── store/              # State management
│   └── package.json
├── 🔧 backend-api/             # Node.js API server
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Express middleware
│   │   ├── models/             # Data models
│   │   ├── routes/             # API routes
│   │   └── utils/              # Utility functions
│   ├── prisma/                 # Database schema
│   └── package.json
├── 📚 docs/                    # Documentation
├── 🚀 deployment/              # Deployment configurations
├── 🧪 tests/                   # Test suites
└── 📋 scripts/                 # Utility scripts
```

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
```

#### Mobile App
```bash
npm start            # Start Expo development server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run on web
npm test             # Run tests
```

## 🧪 Testing

### Test Coverage
- **Backend**: Unit tests, integration tests, API tests
- **Frontend**: Component tests, E2E tests with Playwright
- **Mobile**: Unit tests, component tests

### Running Tests
```bash
# Backend tests
cd backend-api && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
cd frontend && npm run test:e2e

# Mobile tests
cd mobile-app && npm test
```

## 🚀 Deployment

### Production Environment
- **Server**: Ubuntu 20.04 LTS
- **Process Manager**: PM2
- **Web Server**: Nginx
- **SSL**: Let's Encrypt certificates
- **Database**: PostgreSQL 14

### Deployment Commands
```bash
# Deploy to production
./scripts/deploy-to-main.sh

# Verify deployment
./scripts/validate-production.sh

# Backup database
./scripts/backup-database.sh
```

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📊 System Status

### Current Metrics
- ✅ **Web Application**: Fully operational at https://ss.gonxt.tech
- ✅ **API Server**: Running on port 3001 with full authentication
- ✅ **Database**: PostgreSQL with 177 active users
- ✅ **Mobile App**: Complete foundation ready for deployment
- ✅ **SSL/Security**: A+ rating with comprehensive security headers

### Features Status
- ✅ User Authentication & Authorization
- ✅ Role-Based Access Control (REBAC)
- ✅ User Management (177 users)
- ✅ Customer Management
- ✅ Order Management
- ✅ Inventory Tracking
- ✅ Admin Dashboard
- ✅ Mobile App Foundation
- ✅ API Documentation
- ✅ Production Deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow
- **main**: Production branch (auto-deployed)
- **dev**: Development branch for testing
- **feature/***: Feature development branches

## 📄 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [User Manual](docs/USER_MANUAL.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Mobile App Guide](mobile-app/README.md)

## 🔒 Security

- **HTTPS**: SSL/TLS encryption
- **JWT**: Secure token-based authentication
- **RBAC**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Security Headers**: HSTS, CSP, and other security headers
- **Password Hashing**: bcrypt with salt rounds

## 📞 Support

For technical support or questions:
- **Email**: support@salessync.com
- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**SalesSync** - Empowering field sales teams with modern technology 🚀