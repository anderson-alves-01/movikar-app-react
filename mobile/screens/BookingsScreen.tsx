import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/apiService';
import authService from '../services/authService';
import { formatCurrencyBRLTotal } from '../utils/currency';

interface Booking {
  id: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    images: string[];
    location: string;
  };
  owner?: {
    id: number;
    name: string;
    profileImage?: string;
  };
  renter?: {
    id: number;
    name: string;
    profileImage?: string;
  };
}

const STATUS_COLORS = {
  pending: '#FFA500',
  confirmed: '#20B2AA',
  active: '#32CD32',
  completed: '#808080',
  cancelled: '#FF6347',
};

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function BookingsScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'renter' | 'owner'>('renter');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [activeTab, isAuthenticated]);

  const checkAuthentication = () => {
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Login' as never);
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBookings(activeTab);
      setBookings(response || []);
    } catch (error) {
      console.warn('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: unknown) => {
    return formatCurrencyBRLTotal(price);
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleBookingPress = (booking: Booking) => {
    Alert.alert(
      'Detalhes da Reserva',
      `Reserva #${booking.id}\nStatus: ${STATUS_LABELS[booking.status]}`,
      [
        { text: 'Fechar', style: 'cancel' },
        {
          text: 'Ver Veículo',
          onPress: () => (navigation as any).navigate('VehicleDetail', { vehicleId: booking.vehicleId })
        }
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const imageUri = item.vehicle.images && item.vehicle.images.length > 0 
      ? (item.vehicle.images[0].startsWith('http') 
          ? item.vehicle.images[0] 
          : `https://alugae.mobi${item.vehicle.images[0]}`)
      : null;

    const days = calculateDays(item.startDate, item.endDate);
    const person = activeTab === 'renter' ? item.owner : item.renter;

    return (
      <TouchableOpacity style={styles.bookingCard} onPress={() => handleBookingPress(item)}>
        <View style={styles.bookingHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
          <Text style={styles.bookingId}>#{item.id}</Text>
        </View>

        <View style={styles.bookingContent}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.vehicleImage} />
          ) : (
            <View style={[styles.vehicleImage, styles.placeholderImage]}>
              <Ionicons name="car-outline" size={30} color="#ccc" />
            </View>
          )}

          <View style={styles.bookingInfo}>
            <Text style={styles.vehicleName}>
              {item.vehicle.brand} {item.vehicle.model} {item.vehicle.year}
            </Text>
            <Text style={styles.vehicleLocation}>
              <Ionicons name="location-outline" size={14} color="#666" />
              {item.vehicle.location}
            </Text>
            
            <View style={styles.dateRange}>
              <Text style={styles.dateText}>
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </Text>
              <Text style={styles.daysText}>({days} dia{days !== 1 ? 's' : ''})</Text>
            </View>

            {person && (
              <View style={styles.personInfo}>
                <Text style={styles.personLabel}>
                  {activeTab === 'renter' ? 'Proprietário:' : 'Locatário:'}
                </Text>
                <Text style={styles.personName}>{person.name}</Text>
              </View>
            )}

            <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
          </View>
        </View>

        <View style={styles.bookingActions}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Cancelar</Text>
              </TouchableOpacity>
              {activeTab === 'owner' && (
                <TouchableOpacity style={[styles.actionButton, styles.confirmButton]}>
                  <Text style={[styles.actionButtonText, styles.confirmButtonText]}>Confirmar</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {item.status === 'confirmed' && (
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={16} color="#20B2AA" />
              <Text style={styles.actionButtonText}>Mensagem</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Show login required screen if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginRequiredContainer}>
          <Ionicons name="calendar-outline" size={80} color="#ccc" />
          <Text style={styles.loginRequiredTitle}>Login Necessário</Text>
          <Text style={styles.loginRequiredSubtitle}>
            Você precisa estar logado para ver suas reservas.
          </Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLoginPress}
          >
            <Text style={styles.loginButtonText}>Fazer Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'renter' && styles.activeTab]}
          onPress={() => setActiveTab('renter')}
        >
          <Text style={[styles.tabText, activeTab === 'renter' && styles.activeTabText]}>
            Minhas Reservas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'owner' && styles.activeTab]}
          onPress={() => setActiveTab('owner')}
        >
          <Text style={[styles.tabText, activeTab === 'owner' && styles.activeTabText]}>
            Meus Veículos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#20B2AA" />
            <Text style={styles.loadingText}>Carregando reservas...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'renter' ? 'Nenhuma reserva encontrada' : 'Nenhuma reserva nos seus veículos'}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'renter' 
                ? 'Quando você reservar um veículo, ele aparecerá aqui' 
                : 'Quando alguém reservar seus veículos, aparecerão aqui'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => `booking-${item.id}`}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.bookingsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#20B2AA',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#20B2AA',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loginRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  loginRequiredSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#20B2AA',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingsList: {
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingId: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  bookingContent: {
    flexDirection: 'row',
    padding: 15,
  },
  vehicleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dateRange: {
    marginTop: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  daysText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  personInfo: {
    marginTop: 8,
  },
  personLabel: {
    fontSize: 12,
    color: '#666',
  },
  personName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#20B2AA',
    marginTop: 8,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#20B2AA',
  },
  confirmButton: {
    backgroundColor: '#20B2AA',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#20B2AA',
    marginLeft: 4,
  },
  confirmButtonText: {
    color: '#fff',
  },
});