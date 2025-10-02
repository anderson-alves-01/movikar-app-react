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
import { formatCurrencyBRL } from '../utils/currency';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  pricePerDay: number;
  location: string;
  images: string[];
  category: string;
  transmission: string;
  fuelType: string;
  features: string[];
  isHighlighted?: boolean;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load data in background, never crash the app
    loadInitialData().catch(err => {
      console.warn('Background data load failed:', err);
      setLoading(false);
    });
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFeaturedVehicles().catch(e => console.warn('Featured vehicles failed:', e)),
        loadRecentVehicles().catch(e => console.warn('Recent vehicles failed:', e))
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Don't show alert on initial load - just fail silently
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedVehicles = async () => {
    try {
      const response = await apiService.getFeaturedVehicles();
      setFeaturedVehicles(response || []);
    } catch (error) {
      console.warn('Error loading featured vehicles:', error);
      setFeaturedVehicles([]);
    }
  };

  const loadRecentVehicles = async () => {
    try {
      const response = await apiService.getVehicles({ limit: 10 });
      setVehicles(response || []);
    } catch (error) {
      console.warn('Error loading vehicles:', error);
      setVehicles([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const navigateToVehicleDetail = (vehicle: Vehicle) => {
    (navigation as any).navigate('VehicleDetail', { vehicleId: vehicle.id });
  };

  const navigateToSearch = () => {
    navigation.navigate('Search' as never);
  };

  const formatPrice = (price: unknown) => {
    return formatCurrencyBRL(price);
  };

  const renderVehicleCard = ({ item }: { item: Vehicle }) => {
    const imageUri = item.images && item.images.length > 0 
      ? (item.images[0].startsWith('http') 
          ? item.images[0] 
          : `https://alugae.mobi${item.images[0]}`)
      : null;

    return (
      <TouchableOpacity 
        style={[
          styles.vehicleCard,
          item.isHighlighted && styles.highlightedCard
        ]} 
        onPress={() => navigateToVehicleDetail(item)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.vehicleImage} />
        ) : (
          <View style={[styles.vehicleImage, styles.placeholderImage]}>
            <Ionicons name="car-outline" size={40} color="#ccc" />
          </View>
        )}
        
        {item.isHighlighted && (
          <View style={styles.highlightBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.highlightText}>Destaque</Text>
          </View>
        )}

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {item.brand} {item.model}
          </Text>
          <Text style={styles.vehicleYear}>{item.year}</Text>
          <Text style={styles.vehicleLocation}>
            <Ionicons name="location-outline" size={14} color="#666" />
            {item.location}
          </Text>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleCategory}>{item.category}</Text>
            <Text style={styles.vehicleTransmission}>{item.transmission}</Text>
          </View>
          <Text style={styles.vehiclePrice}>{formatPrice(item.pricePerDay)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFeaturedVehicle = ({ item }: { item: Vehicle }) => {
    const imageUri = item.images && item.images.length > 0 
      ? (item.images[0].startsWith('http') 
          ? item.images[0] 
          : `https://alugae.mobi${item.images[0]}`)
      : null;

    return (
      <TouchableOpacity 
        style={styles.featuredCard} 
        onPress={() => navigateToVehicleDetail(item)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.featuredImage} />
        ) : (
          <View style={[styles.featuredImage, styles.placeholderImage]}>
            <Ionicons name="car-outline" size={50} color="#ccc" />
          </View>
        )}
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredName}>
            {item.brand} {item.model}
          </Text>
          <Text style={styles.featuredPrice}>{formatPrice(item.pricePerDay)}</Text>
        </View>
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={16} color="#FFD700" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20B2AA" />
          <Text style={styles.loadingText}>Carregando veículos...</Text>
        </View>
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
          <Text style={styles.welcomeText}>Bem-vindo ao alugae</Text>
          <Text style={styles.subtitleText}>Encontre o carro perfeito</Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={navigateToSearch}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <Text style={styles.searchText}>Buscar veículos...</Text>
        </TouchableOpacity>

        {/* Featured Vehicles */}
        {featuredVehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Veículos em Destaque</Text>
            <FlatList
              horizontal
              data={featuredVehicles}
              renderItem={renderFeaturedVehicle}
              keyExtractor={(item) => `featured-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* Recent Vehicles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veículos Recentes</Text>
          {vehicles.length > 0 ? (
            <FlatList
              data={vehicles}
              renderItem={renderVehicleCard}
              keyExtractor={(item) => `vehicle-${item.id}`}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum veículo encontrado</Text>
            </View>
          )}
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  featuredList: {
    paddingHorizontal: 15,
  },
  featuredCard: {
    width: 250,
    height: 150,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
  },
  featuredName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuredPrice: {
    color: '#20B2AA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    padding: 5,
  },
  row: {
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '45%',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    position: 'relative',
  },
  highlightedCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  vehicleImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  vehicleInfo: {
    padding: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleYear: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vehicleLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  vehicleDetails: {
    flexDirection: 'row',
    marginTop: 6,
  },
  vehicleCategory: {
    fontSize: 11,
    backgroundColor: '#e0e0e0',
    color: '#666',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  vehicleTransmission: {
    fontSize: 11,
    backgroundColor: '#e0e0e0',
    color: '#666',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#20B2AA',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});