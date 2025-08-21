import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  mediaTypes?: ImagePicker.MediaTypeOptions;
  maxImages?: number;
}

export interface ImageUploadResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  fileName: string;
  mimeType: string;
}

class ImageService {
  // Request camera permissions
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  // Request media library permissions
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  // Take photo with camera
  async takePhoto(options: ImagePickerOptions = {}): Promise<ImageUploadResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissão Necessária',
          'É necessário permitir o acesso à câmera para tirar fotos.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect || [1, 1],
        quality: options.quality || 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const processedImage = await this.processImage(asset.uri, {
          compress: 0.8,
          maxWidth: 1024,
          maxHeight: 1024,
        });

        return {
          uri: processedImage.uri,
          width: processedImage.width,
          height: processedImage.height,
          fileSize: asset.fileSize || 0,
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        };
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error('Erro ao tirar foto');
    }
  }

  // Pick image from gallery
  async pickImageFromGallery(options: ImagePickerOptions = {}): Promise<ImageUploadResult[]> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissão Necessária',
          'É necessário permitir o acesso à galeria para selecionar fotos.',
          [{ text: 'OK' }]
        );
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect || [1, 1],
        quality: options.quality || 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection ?? false,
        selectionLimit: options.maxImages || 1,
      });

      if (!result.canceled) {
        const processedImages: ImageUploadResult[] = [];

        for (const asset of result.assets) {
          const processedImage = await this.processImage(asset.uri, {
            compress: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
          });

          processedImages.push({
            uri: processedImage.uri,
            width: processedImage.width,
            height: processedImage.height,
            fileSize: asset.fileSize || 0,
            fileName: asset.fileName || `image_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
          });
        }

        return processedImages;
      }

      return [];
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      throw new Error('Erro ao selecionar imagem da galeria');
    }
  }

  // Show image picker options
  async showImagePickerOptions(options: ImagePickerOptions = {}): Promise<ImageUploadResult | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Selecionar Imagem',
        'Escolha uma opção',
        [
          {
            text: 'Câmera',
            onPress: async () => {
              const result = await this.takePhoto(options);
              resolve(result);
            },
          },
          {
            text: 'Galeria',
            onPress: async () => {
              const results = await this.pickImageFromGallery({
                ...options,
                allowsMultipleSelection: false,
              });
              resolve(results[0] || null);
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }

  // Process image (resize and compress)
  async processImage(
    uri: string,
    options: {
      compress?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: ImageManipulator.SaveFormat;
    } = {}
  ): Promise<ImageManipulator.ImageResult> {
    try {
      const actions: ImageManipulator.Action[] = [];

      // Resize if needed
      if (options.maxWidth || options.maxHeight) {
        actions.push({
          resize: {
            width: options.maxWidth,
            height: options.maxHeight,
          },
        });
      }

      const result = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        {
          compress: options.compress || 0.8,
          format: options.format || ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Erro ao processar imagem');
    }
  }

  // Upload image to server
  async uploadImage(imageResult: ImageUploadResult, uploadPath: string = 'images'): Promise<string> {
    try {
      const formData = new FormData();
      
      // Create file object for upload
      const fileData = {
        uri: imageResult.uri,
        type: imageResult.mimeType,
        name: imageResult.fileName,
      } as any;

      formData.append('image', fileData);
      formData.append('path', uploadPath);

      const response = await fetch('https://alugae.mobi/api/upload/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no upload da imagem');
      }

      const data = await response.json();
      return data.url || data.path;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Erro no upload da imagem');
    }
  }

  // Upload multiple images
  async uploadMultipleImages(
    images: ImageUploadResult[],
    uploadPath: string = 'images'
  ): Promise<string[]> {
    try {
      const uploadPromises = images.map(image => this.uploadImage(image, uploadPath));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Erro no upload das imagens');
    }
  }

  // Save image to device gallery
  async saveToGallery(uri: string): Promise<void> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissão Necessária',
          'É necessário permitir o acesso à galeria para salvar a imagem.',
          [{ text: 'OK' }]
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Sucesso', 'Imagem salva na galeria');
    } catch (error) {
      console.error('Error saving image to gallery:', error);
      throw new Error('Erro ao salvar imagem na galeria');
    }
  }

  // Get image info
  async getImageInfo(uri: string): Promise<{
    width: number;
    height: number;
    size?: number;
  }> {
    try {
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      throw new Error('Erro ao obter informações da imagem');
    }
  }

  // Create thumbnail
  async createThumbnail(
    uri: string,
    size: { width: number; height: number } = { width: 200, height: 200 }
  ): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: size }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw new Error('Erro ao criar miniatura');
    }
  }
}

export default new ImageService();