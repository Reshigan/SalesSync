# SalesSync Frontend

Modern React/Next.js frontend for the Van Sales Management System.

## Features

- 🚐 **Van Sales Management**: Professional dashboard for field force operations
- 🔐 **Secure Authentication**: JWT-based login with tenant support
- 📱 **Responsive Design**: Mobile-first approach with Tailwind CSS
- 🌐 **Environment Variables**: Proper configuration for different environments
- ⚡ **Performance**: Optimized Next.js 14 with TypeScript

## Environment Variables

### Development (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:12000
NODE_ENV=development
```

### Production (.env.production)
```
NEXT_PUBLIC_API_URL=https://ss.gonxt.tech/api
NEXT_PUBLIC_APP_URL=https://ss.gonxt.tech
NODE_ENV=production
```

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
npm start
```

## Architecture

- **src/app/**: Next.js 14 App Router structure
- **src/components/**: Reusable React components
- **src/lib/**: Utility functions and configurations
- **src/types/**: TypeScript type definitions

## Demo Credentials

- **Administrator**: admin@demo.com / admin123
- **Field Agent**: agent@demo.com / agent123

## Deployment

The frontend is deployed using PM2 on the production server:

```bash
PORT=12000 pm2 start npm --name "salessync-frontend" -- run dev
```

## API Integration

All API calls use environment variables for base URLs:
- Development: `http://localhost:3001`
- Production: `https://ss.gonxt.tech/api`

## Key Components

1. **Login Page** (`/login`): Modern authentication with quick login options
2. **Dashboard** (`/dashboard`): Van sales overview with KPIs and status
3. **API Routes** (`/api/auth/login`): Built-in authentication endpoint

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Animations**: Framer Motion
- **State**: React Hooks + localStorage