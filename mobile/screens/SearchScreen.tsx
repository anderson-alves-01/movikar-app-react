import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('São Paulo, SP');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    category: '',
    transmission: '',
    fuel: '',
    features: {
      airConditioning: false,
      bluetooth: false,
      gps: false,
    },
  });

  const categories = [
    { id: 'sedan', name: 'Sedan' },
    { id: 'suv', name: 'SUV' },
    { id: 'hatchback', name: 'Hatchback' },
    { id: 'pickup', name: 'Pickup' },
  ];

  const transmissions = [
    { id: 'manual', name: 'Manual' },
    { id: 'automatic', name: 'Automático' },
  ];

  const fuels = [
    { id: 'gasoline', name: 'Gasolina' },
    { id: 'ethanol', name: 'Etanol' },
    { id: 'flex', name: 'Flex' },
    { id: 'diesel', name: 'Diesel' },
  ];

  const handleSearch = () => {
    console.log('Searching for:', searchQuery, 'in', location, 'with filters:', filters);
    // Implementar lógica de busca
  };

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      category: '',
      transmission: '',
      fuel: '',
      features: {
        airConditioning: false,
        bluetooth: false,
        gps: false,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por marca, modelo..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={20} color="#20B2AA" />
          <TextInput
            style={styles.locationInput}
            placeholder="Localização"
            value={location}
            onChangeText={setLocation}
          />
          <TouchableOpacity>
            <Ionicons name="locate" size={20} color="#20B2AA" />
          </TouchableOpacity>
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color="#fff" />
          <Text style={styles.filterButtonText}>Filtros</Text>
        </TouchableOpacity>

        {/* Search Button */}
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar Veículos</Text>
        </TouchableOpacity>

        {/* Quick Filters */}
        <View style={styles.quickFiltersContainer}>
          <Text style={styles.quickFiltersTitle}>Filtros Rápidos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.quickFilterChip,
                  filters.category === category.id && styles.quickFilterChipActive,
                ]}
                onPress={() =>
                  setFilters(prev => ({
                    ...prev,
                    category: prev.category === category.id ? '' : category.id,
                  }))
                }
              >
                <Text
                  style={[
                    styles.quickFilterText,
                    filters.category === category.id && styles.quickFilterTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Searches */}
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.sectionTitle}>Buscas Recentes</Text>
          <TouchableOpacity style={styles.recentSearchItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.recentSearchText}>Toyota Corolla São Paulo</Text>
            <TouchableOpacity>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </TouchableOpacity>
          <TouchableOpacity style={styles.recentSearchItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.recentSearchText}>Honda Civic Rio de Janeiro</Text>
            <TouchableOpacity>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearButton}>Limpar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Preço por Dia</Text>
              <View style={styles.priceInputContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={filters.priceMin}
                  onChangeText={(text) =>
                    setFilters(prev => ({ ...prev, priceMin: text }))
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>até</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={filters.priceMax}
                  onChangeText={(text) =>
                    setFilters(prev => ({ ...prev, priceMax: text }))
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categoria</Text>
              <View style={styles.optionContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.optionButton,
                      filters.category === category.id && styles.optionButtonActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        category: prev.category === category.id ? '' : category.id,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.category === category.id && styles.optionTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Transmission */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Transmissão</Text>
              <View style={styles.optionContainer}>
                {transmissions.map((transmission) => (
                  <TouchableOpacity
                    key={transmission.id}
                    style={[
                      styles.optionButton,
                      filters.transmission === transmission.id && styles.optionButtonActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        transmission: prev.transmission === transmission.id ? '' : transmission.id,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.transmission === transmission.id && styles.optionTextActive,
                      ]}
                    >
                      {transmission.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fuel */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Combustível</Text>
              <View style={styles.optionContainer}>
                {fuels.map((fuel) => (
                  <TouchableOpacity
                    key={fuel.id}
                    style={[
                      styles.optionButton,
                      filters.fuel === fuel.id && styles.optionButtonActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        fuel: prev.fuel === fuel.id ? '' : fuel.id,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.fuel === fuel.id && styles.optionTextActive,
                      ]}
                    >
                      {fuel.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Features */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Recursos</Text>
              <View style={styles.featureContainer}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureText}>Ar Condicionado</Text>
                  <Switch
                    value={filters.features.airConditioning}
                    onValueChange={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        features: { ...prev.features, airConditioning: value },
                      }))
                    }
                    trackColor={{ false: '#767577', true: '#20B2AA' }}
                  />
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureText}>Bluetooth</Text>
                  <Switch
                    value={filters.features.bluetooth}
                    onValueChange={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        features: { ...prev.features, bluetooth: value },
                      }))
                    }
                    trackColor={{ false: '#767577', true: '#20B2AA' }}
                  />
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureText}>GPS</Text>
                  <Switch
                    value={filters.features.gps}
                    onValueChange={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        features: { ...prev.features, gps: value },
                      }))
                    }
                    trackColor={{ false: '#767577', true: '#20B2AA' }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              setShowFilters(false);
              handleSearch();
            }}
          >
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20B2AA',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 15,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#20B2AA',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickFiltersContainer: {
    marginBottom: 20,
  },
  quickFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  quickFilterChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickFilterChipActive: {
    backgroundColor: '#20B2AA',
    borderColor: '#20B2AA',
  },
  quickFilterText: {
    color: '#666',
    fontSize: 14,
  },
  quickFilterTextActive: {
    color: '#fff',
  },
  recentSearchesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 8,
  },
  recentSearchText: {
    flex: 1,
    marginLeft: 10,
    color: '#333',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#20B2AA',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  priceSeparator: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 16,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#20B2AA',
  },
  optionText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  featureContainer: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#20B2AA',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    margin: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});