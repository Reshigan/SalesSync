# SalesSync Mobile App

A React Native mobile application for field agents and sales teams using Expo.

## Features

- **Authentication**: Secure login with JWT tokens
- **Dashboard**: Overview of sales metrics and quick actions
- **Order Management**: View, create, and manage orders
- **Customer Management**: Access customer information and history
- **Inventory Tracking**: Real-time inventory updates
- **Location Services**: GPS tracking for field agents
- **Barcode Scanning**: Product identification and inventory management
- **Offline Support**: Work offline with data synchronization

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo Linear Gradient** for UI effects
- **Axios** for API communication
- **AsyncStorage** for local data persistence
- **Expo Location** for GPS tracking
- **Expo Camera & Barcode Scanner** for product scanning

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. Navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go app to run on your device

### Building for Production

#### Android
```bash
expo build:android
```

#### iOS
```bash
expo build:ios
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   └── main/           # Main app screens
├── services/           # API and business logic
│   ├── ApiService.ts
│   ├── AuthService.ts
│   └── AuthContext.tsx
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## API Integration

The mobile app connects to the SalesSync backend API at `https://ss.gonxt.tech/api`. 

Key endpoints:
- `POST /auth/login` - User authentication
- `GET /auth/me` - Get current user
- `GET /orders` - Fetch orders
- `GET /customers` - Fetch customers
- `GET /products` - Fetch products
- `POST /orders` - Create new order

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
API_BASE_URL=https://ss.gonxt.tech/api
```

### App Configuration

Update `app.json` for:
- App name and version
- Icons and splash screen
- Permissions (camera, location)
- Build settings

## Features Implementation Status

- ✅ Authentication (Login/Logout)
- ✅ Navigation Structure
- ✅ Dashboard with Stats
- ✅ Orders List View
- 🚧 Order Details & Creation
- 🚧 Customer Management
- 🚧 Inventory Management
- 🚧 Barcode Scanning
- 🚧 Location Tracking
- 🚧 Offline Support

## Development Guidelines

1. **TypeScript**: Use strict typing for all components and services
2. **Navigation**: Use typed navigation props for type safety
3. **State Management**: Use React Context for global state
4. **API Calls**: Handle loading states and error cases
5. **UI/UX**: Follow mobile design best practices
6. **Testing**: Write unit tests for services and components

## Deployment

### Development
- Use Expo Go for rapid development and testing
- Hot reload enabled for fast iteration

### Production
- Build standalone apps for App Store and Google Play
- Configure app signing and certificates
- Set up CI/CD pipeline for automated builds

## Support

For technical support or questions about the mobile app, contact the development team.