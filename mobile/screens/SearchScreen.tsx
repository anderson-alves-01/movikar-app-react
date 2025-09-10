import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
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

interface SearchFilters {
  location?: string;
  category?: string;
  priceMin?: string;
  priceMax?: string;
  transmission?: string;
  fuelType?: string;
  startDate?: string;
  endDate?: string;
}

const CATEGORIES = ['Hatchback', 'Sedan', 'SUV', 'Pickup', 'Conversível'];
const TRANSMISSIONS = ['Manual', 'Automático'];
const FUEL_TYPES = ['Gasolina', 'Flex', 'Diesel', 'Elétrico'];

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchVehicles();
    } else if (searchQuery.length === 0) {
      setVehicles([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      searchVehicles();
    }
  }, [filters]);

  const searchVehicles = async () => {
    try {
      setLoading(true);
      const searchParams = {
        search: searchQuery,
        ...filters,
        limit: 50,
      };

      const results = await apiService.searchVehicles(searchQuery, filters);
      setVehicles(results || []);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      Alert.alert('Erro', 'Não foi possível realizar a busca');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    if (searchQuery) {
      searchVehicles();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === prev[key] ? undefined : value
    }));
  };

  const navigateToVehicleDetail = (vehicle: Vehicle) => {
    (navigation as any).navigate('VehicleDetail', { vehicleId: vehicle.id });
  };

  const formatPrice = (price: unknown) => {
    return formatCurrencyBRL(price);
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => {
    const imageUri = item.images && item.images.length > 0 
      ? (item.images[0].startsWith('http') 
          ? item.images[0] 
          : `https://alugae.mobi${item.images[0]}`)
      : null;

    return (
      <TouchableOpacity 
        style={[
          styles.vehicleItem,
          item.isHighlighted && styles.highlightedItem
        ]} 
        onPress={() => navigateToVehicleDetail(item)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.vehicleItemImage} />
        ) : (
          <View style={[styles.vehicleItemImage, styles.placeholderImage]}>
            <Ionicons name="car-outline" size={30} color="#ccc" />
          </View>
        )}

        {item.isHighlighted && (
          <View style={styles.highlightBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
          </View>
        )}

        <View style={styles.vehicleItemInfo}>
          <Text style={styles.vehicleItemName}>
            {item.brand} {item.model}
          </Text>
          <Text style={styles.vehicleItemYear}>{item.year}</Text>
          <Text style={styles.vehicleItemLocation}>
            <Ionicons name="location-outline" size={14} color="#666" />
            {item.location}
          </Text>
          <View style={styles.vehicleItemTags}>
            <Text style={styles.vehicleTag}>{item.category}</Text>
            <Text style={styles.vehicleTag}>{item.transmission}</Text>
            <Text style={styles.vehicleTag}>{item.fuelType}</Text>
          </View>
          <Text style={styles.vehicleItemPrice}>{formatPrice(item.pricePerDay)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterChip = (
    label: string,
    value: string,
    filterKey: keyof SearchFilters,
    options: string[]
  ) => {
    const isActive = filters[filterKey] === value;
    
    return (
      <TouchableOpacity
        key={value}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => updateFilter(filterKey, value)}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por marca, modelo, cidade..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={Object.keys(filters).length > 0 ? '#20B2AA' : '#666'} 
          />
        </TouchableOpacity>
      </View>

      {/* Filters Section */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersContainer}>
              {/* Category Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Categoria</Text>
                <View style={styles.filterChips}>
                  {CATEGORIES.map(category => 
                    renderFilterChip('Categoria', category, 'category', CATEGORIES)
                  )}
                </View>
              </View>

              {/* Transmission Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Transmissão</Text>
                <View style={styles.filterChips}>
                  {TRANSMISSIONS.map(transmission => 
                    renderFilterChip('Transmissão', transmission, 'transmission', TRANSMISSIONS)
                  )}
                </View>
              </View>

              {/* Fuel Type Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Combustível</Text>
                <View style={styles.filterChips}>
                  {FUEL_TYPES.map(fuel => 
                    renderFilterChip('Combustível', fuel, 'fuelType', FUEL_TYPES)
                  )}
                </View>
              </View>

              {/* Clear Filters */}
              {Object.keys(filters).length > 0 && (
                <TouchableOpacity style={styles.clearFilters} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Limpar Filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#20B2AA" />
            <Text style={styles.loadingText}>Buscando veículos...</Text>
          </View>
        ) : searchQuery.length === 0 && Object.keys(filters).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Buscar Veículos</Text>
            <Text style={styles.emptyStateText}>
              Digite uma marca, modelo ou cidade para encontrar veículos
            </Text>
          </View>
        ) : vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Nenhum veículo encontrado</Text>
            <Text style={styles.emptyStateText}>
              Tente ajustar os filtros ou buscar por outros termos
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''} encontrado{vehicles.length !== 1 ? 's' : ''}
            </Text>
            <FlatList
              data={vehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => `search-${item.id}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
            />
          </>
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    marginLeft: 10,
    padding: 10,
  },
  filtersSection: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContainer: {
    paddingHorizontal: 15,
  },
  filterGroup: {
    marginBottom: 15,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#20B2AA',
    borderColor: '#20B2AA',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearFilters: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  clearFiltersText: {
    color: '#20B2AA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    padding: 15,
  },
  resultsCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  resultsList: {
    paddingBottom: 20,
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
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  vehicleItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    position: 'relative',
  },
  highlightedItem: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  vehicleItemImage: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    padding: 4,
  },
  vehicleItemInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  vehicleItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleItemYear: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vehicleItemLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  vehicleItemTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  vehicleTag: {
    fontSize: 10,
    backgroundColor: '#e0e0e0',
    color: '#666',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vehicleItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#20B2AA',
    marginTop: 8,
  },
});