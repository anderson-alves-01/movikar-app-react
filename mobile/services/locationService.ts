import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface VehicleLocation extends LocationData {
  vehicleId: number;
  timestamp: number;
}

class LocationService {
  private watchPositionSubscription: Location.LocationSubscription | null = null;
  private currentLocation: LocationData | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Get reverse geocoding for address
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          locationData.address = `${address.street || ''} ${address.streetNumber || ''}`.trim();
          locationData.city = address.city || '';
          locationData.state = address.region || '';
          locationData.country = address.country || '';
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
      }

      this.currentLocation = locationData;
      await this.saveLocationToStorage(locationData);

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async watchLocation(callback: (location: LocationData) => void): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      this.watchPositionSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          this.currentLocation = locationData;
          callback(locationData);
        }
      );

      return true;
    } catch (error) {
      console.error('Error watching location:', error);
      return false;
    }
  }

  stopWatchingLocation(): void {
    if (this.watchPositionSubscription) {
      this.watchPositionSubscription.remove();
      this.watchPositionSubscription = null;
    }
  }

  async searchNearbyVehicles(radius = 10): Promise<VehicleLocation[]> {
    try {
      const currentLocation = this.currentLocation || await this.getCurrentLocation();
      
      if (!currentLocation) {
        return [];
      }

      // This would typically make an API call to find nearby vehicles
      // For now, return empty array as placeholder
      console.log(`Searching for vehicles within ${radius}km of current location`);
      return [];
    } catch (error) {
      console.error('Error searching nearby vehicles:', error);
      return [];
    }
  }

  async getDistanceBetweenPoints(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): Promise<number> {
    try {
      // Using Haversine formula to calculate distance
      const R = 6371; // Earth's radius in kilometers
      const dLat = this.toRadians(point2.latitude - point1.latitude);
      const dLon = this.toRadians(point2.longitude - point1.longitude);
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRadians(point1.latitude)) * 
        Math.cos(this.toRadians(point2.latitude)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance;
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 0;
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async geocodeAddress(address: string): Promise<LocationData | null> {
    try {
      const geocoded = await Location.geocodeAsync(address);
      
      if (geocoded.length > 0) {
        const location = geocoded[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  private async saveLocationToStorage(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem('last_known_location', JSON.stringify(location));
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
  }

  async getLastKnownLocation(): Promise<LocationData | null> {
    try {
      const locationString = await AsyncStorage.getItem('last_known_location');
      if (locationString) {
        return JSON.parse(locationString);
      }
      return null;
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }
}

export default new LocationService();