import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

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
  description: string;
  features: string[];
  transmission: string;
  fuel: string;
  seats: number;
  owner: {
    name: string;
    avatar: string;
    rating: number;
  };
}

export default function VehicleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleId } = route.params as { vehicleId: number };
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      // Simulação de API call - substituir pela URL real da API
      const response = await fetch(`https://alugae.mobi/api/vehicles/${vehicleId}`);
      const data = await response.json();
      setVehicle(data);
    } catch (error) {
      console.error('Erro ao carregar veículo:', error);
      // Dados mock para demonstração
      setVehicle({
        id: vehicleId,
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        pricePerDay: '180.00',
        images: [
          'https://via.placeholder.com/400x250/20B2AA/ffffff?text=Toyota+Corolla+1',
          'https://via.placeholder.com/400x250/20B2AA/ffffff?text=Toyota+Corolla+2',
          'https://via.placeholder.com/400x250/20B2AA/ffffff?text=Toyota+Corolla+3',
        ],
        location: 'São Paulo, SP',
        category: 'sedan',
        rating: 4.8,
        description: 'Toyota Corolla 2023 em excelente estado de conservação. Veículo completo com todos os opcionais. Ideal para viagens longas ou uso urbano.',
        features: [
          'Ar condicionado',
          'Direção hidráulica',
          'Vidros elétricos',
          'Trava elétrica',
          'Bluetooth',
          'GPS',
          'Câmera de ré',
          'Sensor de estacionamento',
        ],
        transmission: 'Automático',
        fuel: 'Flex',
        seats: 5,
        owner: {
          name: 'Carlos Oliveira',
          avatar: 'https://via.placeholder.com/50x50/20B2AA/ffffff?text=CO',
          rating: 4.9,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRentNow = () => {
    // Navigate to booking screen
    console.log('Rent now for vehicle:', vehicleId);
  };

  const handleContactOwner = () => {
    // Navigate to chat or contact screen
    console.log('Contact owner for vehicle:', vehicleId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20B2AA" />
        <Text style={styles.loadingText}>Carregando veículo...</Text>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Veículo não encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const slideSize = event.nativeEvent.layoutMeasurement.width;
              const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
              setCurrentImageIndex(index);
            }}
          >
            {vehicle.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.vehicleImage} />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {vehicle.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{vehicle.rating}</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleTitle}>
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.locationText}>{vehicle.location}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>R$ {vehicle.pricePerDay}</Text>
            <Text style={styles.priceLabel}>/dia</Text>
          </View>
        </View>

        {/* Vehicle Specs */}
        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Ionicons name="settings-outline" size={20} color="#20B2AA" />
            <Text style={styles.specText}>{vehicle.transmission}</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="car-outline" size={20} color="#20B2AA" />
            <Text style={styles.specText}>{vehicle.fuel}</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="people-outline" size={20} color="#20B2AA" />
            <Text style={styles.specText}>{vehicle.seats} lugares</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="pricetag-outline" size={20} color="#20B2AA" />
            <Text style={styles.specText}>{vehicle.category}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.descriptionText}>{vehicle.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Recursos Inclusos</Text>
          <View style={styles.featuresList}>
            {vehicle.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Owner Info */}
        <View style={styles.ownerContainer}>
          <Text style={styles.sectionTitle}>Proprietário</Text>
          <View style={styles.ownerInfo}>
            <Image source={{ uri: vehicle.owner.avatar }} style={styles.ownerAvatar} />
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerName}>{vehicle.owner.name}</Text>
              <View style={styles.ownerRating}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ownerRatingText}>{vehicle.owner.rating}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactOwner}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#20B2AA" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.bottomPriceText}>R$ {vehicle.pricePerDay}</Text>
          <Text style={styles.bottomPriceLabel}>por dia</Text>
        </View>
        <TouchableOpacity style={styles.rentButton} onPress={handleRentNow}>
          <Text style={styles.rentButtonText}>Alugar Agora</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#20B2AA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageGallery: {
    position: 'relative',
  },
  vehicleImage: {
    width: width,
    height: 250,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  ratingBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  vehicleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#20B2AA',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  specsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  specItem: {
    alignItems: 'center',
  },
  specText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  descriptionContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  featuresContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  ownerContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ownerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerRatingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  contactButton: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingBottom: 30,
  },
  priceInfo: {
    flex: 1,
  },
  bottomPriceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#20B2AA',
  },
  bottomPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  rentButton: {
    backgroundColor: '#20B2AA',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});