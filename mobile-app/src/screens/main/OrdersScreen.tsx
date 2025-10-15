import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Order, OrderStatus } from '../../types/Order';

type OrdersScreenNavigationProp = StackNavigationProp<MainStackParamList>;

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, selectedStatus]);

  const loadOrders = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await apiService.getOrders();
      // setOrders(response.data);
      
      // Mock data for now
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerId: '1',
          customer: { id: '1', name: 'ABC Store', email: 'abc@store.com', phone: '+234123456789', address: '123 Main St', city: 'Lagos', state: 'Lagos', country: 'Nigeria', customerType: 'Retail', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          salesAgentId: '1',
          salesAgent: { id: '1', email: 'agent@example.com', fullName: 'John Doe', role: 'Sales Agent', tenant: 'Company', isActive: true, permissions: [], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          items: [],
          totalAmount: 15000,
          status: OrderStatus.PENDING,
          orderDate: '2024-01-15',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          customerId: '2',
          customer: { id: '2', name: 'XYZ Mart', email: 'xyz@mart.com', phone: '+234987654321', address: '456 Oak Ave', city: 'Abuja', state: 'FCT', country: 'Nigeria', customerType: 'Wholesale', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          salesAgentId: '1',
          salesAgent: { id: '1', email: 'agent@example.com', fullName: 'John Doe', role: 'Sales Agent', tenant: 'Company', isActive: true, permissions: [], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          items: [],
          totalAmount: 32000,
          status: OrderStatus.CONFIRMED,
          orderDate: '2024-01-14',
          createdAt: '2024-01-14',
          updatedAt: '2024-01-14',
        },
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return '#FF9800';
      case OrderStatus.CONFIRMED:
        return '#2196F3';
      case OrderStatus.PROCESSING:
        return '#9C27B0';
      case OrderStatus.SHIPPED:
        return '#607D8B';
      case OrderStatus.DELIVERED:
        return '#4CAF50';
      case OrderStatus.CANCELLED:
        return '#F44336';
      case OrderStatus.RETURNED:
        return '#795548';
      default:
        return '#666';
    }
  };

  const StatusFilter: React.FC<{ status: OrderStatus | 'all'; title: string }> = ({ status, title }) => (
    <TouchableOpacity
      style={[
        styles.statusFilter,
        selectedStatus === status && styles.statusFilterActive,
      ]}
      onPress={() => setSelectedStatus(status)}
    >
      <Text
        style={[
          styles.statusFilterText,
          selectedStatus === status && styles.statusFilterTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const OrderItem: React.FC<{ order: Order }> = ({ order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>{order.customer.name}</Text>
      <View style={styles.orderFooter}>
        <Text style={styles.orderAmount}>₦{order.totalAmount.toLocaleString()}</Text>
        <Text style={styles.orderDate}>{new Date(order.orderDate).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateOrder', {})}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        <StatusFilter status="all" title="All" />
        <StatusFilter status={OrderStatus.PENDING} title="Pending" />
        <StatusFilter status={OrderStatus.CONFIRMED} title="Confirmed" />
        <StatusFilter status={OrderStatus.DELIVERED} title="Delivered" />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderItem order={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  statusFilterActive: {
    backgroundColor: '#007AFF',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusFilterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  orderItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
});

export default OrdersScreen;