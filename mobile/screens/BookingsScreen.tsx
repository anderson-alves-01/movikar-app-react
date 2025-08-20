import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Booking {
  id: number;
  vehicleBrand: string;
  vehicleModel: string;
  startDate: string;
  endDate: string;
  totalPrice: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';
  location: string;
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const loadBookings = async () => {
    try {
      // Simulação de API call - substituir pela URL real da API
      const response = await fetch('https://alugae.mobi/api/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      // Dados mock para demonstração
      setBookings([
        {
          id: 1,
          vehicleBrand: 'Toyota',
          vehicleModel: 'Corolla',
          startDate: '2025-08-25',
          endDate: '2025-08-30',
          totalPrice: '900.00',
          status: 'approved',
          location: 'São Paulo, SP',
        },
        {
          id: 2,
          vehicleBrand: 'Honda',
          vehicleModel: 'Civic',
          startDate: '2025-08-15',
          endDate: '2025-08-20',
          totalPrice: '825.00',
          status: 'completed',
          location: 'Rio de Janeiro, RJ',
        },
        {
          id: 3,
          vehicleBrand: 'Hyundai',
          vehicleModel: 'HB20',
          startDate: '2025-09-01',
          endDate: '2025-09-05',
          totalPrice: '600.00',
          status: 'pending',
          location: 'Belo Horizonte, MG',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'approved':
        return '#20B2AA';
      case 'active':
        return '#34C759';
      case 'completed':
        return '#8E8E93';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovada';
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'approved':
        return 'checkmark-circle-outline';
      case 'active':
        return 'car-outline';
      case 'completed':
        return 'checkmark-done-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'active') {
      return ['pending', 'approved', 'active'].includes(booking.status);
    } else {
      return ['completed', 'cancelled'].includes(booking.status);
    }
  });

  const renderBookingCard = (booking: Booking) => (
    <TouchableOpacity key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleTitle}>
            {booking.vehicleBrand} {booking.vehicleModel}
          </Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText}>{booking.location}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Ionicons 
            name={getStatusIcon(booking.status) as keyof typeof Ionicons.glyphMap} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateLabel}>Retirada</Text>
            <Text style={styles.dateValue}>{formatDate(booking.startDate)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateLabel}>Devolução</Text>
            <Text style={styles.dateValue}>{formatDate(booking.endDate)}</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>R$ {booking.totalPrice}</Text>
        </View>
      </View>

      <View style={styles.bookingActions}>
        {booking.status === 'pending' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                Ver Detalhes
              </Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'approved' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Contato</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                Iniciar Locação
              </Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'active' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Suporte</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                Finalizar
              </Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'completed' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Avaliar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                Alugar Novamente
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20B2AA" />
        <Text style={styles.loadingText}>Carregando reservas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Ativas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'active' ? 'calendar-outline' : 'time-outline'} 
              size={64} 
              color="#ccc" 
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' ? 'Nenhuma reserva ativa' : 'Nenhuma reserva no histórico'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active' 
                ? 'Suas próximas reservas aparecerão aqui'
                : 'Suas reservas concluídas aparecerão aqui'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.bookingsContainer}>
            {filteredBookings.map(renderBookingCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#20B2AA',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#20B2AA',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  bookingsContainer: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bookingDetails: {
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  dateValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceLabel: {
    color: '#666',
    fontSize: 14,
  },
  priceValue: {
    color: '#20B2AA',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#20B2AA',
    alignItems: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#20B2AA',
  },
  actionButtonText: {
    color: '#20B2AA',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryActionButtonText: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});