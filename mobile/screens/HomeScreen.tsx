import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  pricePerDay: string;
  images: string[];
  location: string;
  category: string;
  rating: number;
  isHighlighted: boolean;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = async () => {
    try {
      // Simulação de API call - substituir pela URL real da API
      const response = await fetch('https://alugae.mobi/api/vehicles?limit=10');
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      // Dados mock para demonstração
      setVehicles([
        {
          id: 1,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          pricePerDay: '180.00',
          images: ['https://via.placeholder.com/300x200/20B2AA/ffffff?text=Toyota+Corolla'],
          location: 'São Paulo, SP',
          category: 'sedan',
          rating: 4.8,
          isHighlighted: true,
        },
        {
          id: 2,
          brand: 'Honda',
          model: 'Civic',
          year: 2022,
          pricePerDay: '165.00',
          images: ['https://via.placeholder.com/300x200/20B2AA/ffffff?text=Honda+Civic'],
          location: 'Rio de Janeiro, RJ',
          category: 'sedan',
          rating: 4.6,
          isHighlighted: false,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };

  const renderVehicleCard = (vehicle: Vehicle) => (
    <TouchableOpacity
      key={vehicle.id}
      style={[
        styles.vehicleCard,
        vehicle.isHighlighted && styles.highlightedCard
      ]}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: vehicle.images[0] }}
          style={styles.vehicleImage}
          resizeMode="cover"
        />
        {vehicle.isHighlighted && (
          <View style={styles.highlightBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.highlightText}>Destaque</Text>
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{vehicle.rating}</Text>
        </View>
      </View>
      
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>
          {vehicle.brand} {vehicle.model} {vehicle.year}
        </Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText}>{vehicle.location}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>R$ {vehicle.pricePerDay}</Text>
          <Text style={styles.priceLabel}>/dia</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20B2AA" />
        <Text style={styles.loadingText}>Carregando veículos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bem-vindo ao</Text>
          <Text style={styles.brandText}>alugae</Text>
          <Text style={styles.subtitleText}>Encontre o carro perfeito para você</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={24} color="#20B2AA" />
            <Text style={styles.actionText}>Buscar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="location" size={24} color="#20B2AA" />
            <Text style={styles.actionText}>Próximos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart" size={24} color="#20B2AA" />
            <Text style={styles.actionText}>Favoritos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="filter" size={24} color="#20B2AA" />
            <Text style={styles.actionText}>Filtros</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Vehicles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veículos em Destaque</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {vehicles
              .filter(v => v.isHighlighted)
              .map(vehicle => (
                <View key={vehicle.id} style={styles.featuredCard}>
                  {renderVehicleCard(vehicle)}
                </View>
              ))}
          </ScrollView>
        </View>

        {/* All Vehicles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Todos os Veículos</Text>
          <View style={styles.vehicleGrid}>
            {vehicles.map(vehicle => renderVehicleCard(vehicle))}
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#20B2AA',
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  brandText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  subtitleText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    color: '#20B2AA',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
    color: '#333',
  },
  featuredCard: {
    marginLeft: 20,
    width: width * 0.8,
  },
  vehicleGrid: {
    paddingHorizontal: 20,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  imageContainer: {
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  highlightBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highlightText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  vehicleInfo: {
    padding: 15,
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
    marginBottom: 10,
  },
  locationText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#20B2AA',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
});