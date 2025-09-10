import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../services/apiService';
import { formatCurrencyBRL } from '../utils/currency';

const { width } = Dimensions.get('window');

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
  description?: string;
  isHighlighted?: boolean;
  owner?: {
    id: number;
    name: string;
    profileImage?: string;
  };
}

interface RouteParams {
  vehicleId: number;
}

export default function VehicleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleId } = route.params as RouteParams;
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadVehicleDetails();
  }, [vehicleId]);

  const loadVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getVehicle(vehicleId);
      setVehicle(response);
    } catch (error) {
      console.error('Error loading vehicle details:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar os detalhes do veículo',
        [
          {
            text: 'Voltar',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBookVehicle = () => {
    if (vehicle) {
      // Navigate to booking screen or modal
      Alert.alert(
        'Reservar Veículo',
        `Deseja reservar o ${vehicle.brand} ${vehicle.model}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Reservar',
            onPress: () => {
              // TODO: Implement booking flow
              Alert.alert('Em Desenvolvimento', 'Funcionalidade de reserva será implementada em breve');
            }
          }
        ]
      );
    }
  };

  const handleContactOwner = () => {
    if (vehicle?.owner) {
      Alert.alert(
        'Entrar em Contato',
        `Deseja enviar uma mensagem para ${vehicle.owner.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar Mensagem',
            onPress: () => {
              // TODO: Implement messaging
              Alert.alert('Em Desenvolvimento', 'Sistema de mensagens será implementado em breve');
            }
          }
        ]
      );
    }
  };

  const formatPrice = (price: unknown) => {
    return formatCurrencyBRL(price);
  };

  const renderImagePagination = () => {
    if (!vehicle?.images || vehicle.images.length <= 1) return null;

    return (
      <View style={styles.imagePagination}>
        {vehicle.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentImageIndex && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20B2AA" />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
          <Text style={styles.errorText}>Veículo não encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {vehicle.images && vehicle.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(newIndex);
              }}
            >
              {vehicle.images.map((imageUrl, index) => {
                const imageUri = imageUrl.startsWith('http') 
                  ? imageUrl 
                  : `https://alugae.mobi${imageUrl}`;
                
                return (
                  <Image
                    key={index}
                    source={{ uri: imageUri }}
                    style={styles.vehicleImage}
                  />
                );
              })}
            </ScrollView>
          ) : (
            <View style={[styles.vehicleImage, styles.placeholderImage]}>
              <Ionicons name="car-outline" size={80} color="#ccc" />
            </View>
          )}
          
          {vehicle.isHighlighted && (
            <View style={styles.highlightBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.highlightText}>Destaque</Text>
            </View>
          )}
          
          {renderImagePagination()}
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <View style={styles.titleSection}>
            <Text style={styles.vehicleTitle}>
              {vehicle.brand} {vehicle.model}
            </Text>
            <Text style={styles.vehicleYear}>{vehicle.year}</Text>
            <Text style={styles.vehiclePrice}>{formatPrice(vehicle.pricePerDay)}</Text>
          </View>

          <View style={styles.locationSection}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.locationText}>{vehicle.location}</Text>
          </View>

          {/* Specs */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Especificações</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Ionicons name="car-outline" size={24} color="#20B2AA" />
                <Text style={styles.specLabel}>Categoria</Text>
                <Text style={styles.specValue}>{vehicle.category}</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="settings-outline" size={24} color="#20B2AA" />
                <Text style={styles.specLabel}>Transmissão</Text>
                <Text style={styles.specValue}>{vehicle.transmission}</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="water-outline" size={24} color="#20B2AA" />
                <Text style={styles.specLabel}>Combustível</Text>
                <Text style={styles.specValue}>{vehicle.fuelType}</Text>
              </View>
            </View>
          </View>

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Recursos</Text>
              <View style={styles.featuresList}>
                {vehicle.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#20B2AA" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {vehicle.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <Text style={styles.descriptionText}>{vehicle.description}</Text>
            </View>
          )}

          {/* Owner Info */}
          {vehicle.owner && (
            <View style={styles.ownerSection}>
              <Text style={styles.sectionTitle}>Proprietário</Text>
              <View style={styles.ownerInfo}>
                {vehicle.owner.profileImage ? (
                  <Image
                    source={{ uri: vehicle.owner.profileImage }}
                    style={styles.ownerImage}
                  />
                ) : (
                  <View style={[styles.ownerImage, styles.ownerImagePlaceholder]}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                  </View>
                )}
                <View style={styles.ownerDetails}>
                  <Text style={styles.ownerName}>{vehicle.owner.name}</Text>
                  <TouchableOpacity style={styles.contactButton} onPress={handleContactOwner}>
                    <Ionicons name="chatbubble-outline" size={16} color="#20B2AA" />
                    <Text style={styles.contactButtonText}>Enviar mensagem</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookVehicle}>
          <Text style={styles.bookButtonText}>Reservar Agora</Text>
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 30,
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
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageGallery: {
    height: 250,
    position: 'relative',
  },
  vehicleImage: {
    width: width,
    height: 250,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  imagePagination: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 2,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  vehicleInfo: {
    backgroundColor: '#fff',
    padding: 20,
  },
  titleSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 15,
    marginBottom: 20,
  },
  vehicleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleYear: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  vehiclePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#20B2AA',
    marginTop: 8,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  specsSection: {
    marginBottom: 25,
  },
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  specValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  featuresSection: {
    marginBottom: 25,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  descriptionSection: {
    marginBottom: 25,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  ownerSection: {
    marginBottom: 20,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  ownerImagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 14,
    color: '#20B2AA',
    marginLeft: 4,
  },
  bottomActions: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bookButton: {
    backgroundColor: '#20B2AA',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});