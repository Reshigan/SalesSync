import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import CustomersScreen from '../screens/main/CustomersScreen';
import InventoryScreen from '../screens/main/InventoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import OrderDetailsScreen from '../screens/main/OrderDetailsScreen';
import CreateOrderScreen from '../screens/main/CreateOrderScreen';
import CustomerDetailsScreen from '../screens/main/CustomerDetailsScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Customers: undefined;
  Inventory: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  OrderDetails: { orderId: string };
  CreateOrder: { customerId?: string };
  CustomerDetails: { customerId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Orders':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Customers':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Inventory':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen 
        name="CreateOrder" 
        component={CreateOrderScreen}
        options={{ title: 'Create Order' }}
      />
      <Stack.Screen 
        name="CustomerDetails" 
        component={CustomerDetailsScreen}
        options={{ title: 'Customer Details' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;