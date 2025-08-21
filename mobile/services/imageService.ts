// import * as ImagePicker from 'expo-image-picker';

export interface ImagePickerOptions {
  mediaTypes?: 'Images' | 'Videos' | 'All';
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileSize?: number;
}

class ImageService {
  async requestPermissions(): Promise<boolean> {
    try {
      // const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      // const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      // return cameraPermission.status === 'granted' && libraryPermission.status === 'granted';
      return true; // Placeholder
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async pickImage(options: ImagePickerOptions = {}): Promise<ImageResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permissions not granted');
      }

      // const result = await ImagePicker.launchImageLibraryAsync({
      //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
      //   allowsEditing: options.allowsEditing ?? true,
      //   aspect: options.aspect ?? [4, 3],
      //   quality: options.quality ?? 0.8,
      //   allowsMultipleSelection: options.allowsMultipleSelection ?? false,
      //   selectionLimit: options.selectionLimit ?? 1,
      // });

      // if (!result.canceled && result.assets.length > 0) {
      //   const asset = result.assets[0];
      //   return {
      //     uri: asset.uri,
      //     width: asset.width,
      //     height: asset.height,
      //     type: asset.type,
      //     fileSize: asset.fileSize,
      //   };
      // }

      return null; // Placeholder
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  }

  async takePhoto(options: ImagePickerOptions = {}): Promise<ImageResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permissions not granted');
      }

      // const result = await ImagePicker.launchCameraAsync({
      //   allowsEditing: options.allowsEditing ?? true,
      //   aspect: options.aspect ?? [4, 3],
      //   quality: options.quality ?? 0.8,
      // });

      // if (!result.canceled && result.assets.length > 0) {
      //   const asset = result.assets[0];
      //   return {
      //     uri: asset.uri,
      //     width: asset.width,
      //     height: asset.height,
      //     type: asset.type,
      //     fileSize: asset.fileSize,
      //   };
      // }

      return null; // Placeholder
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  async uploadImage(imageUri: string, uploadUrl: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error uploading image:', error);
      return false;
    }
  }

  async resizeImage(uri: string, maxWidth: number, maxHeight: number): Promise<string | null> {
    try {
      // For now, return original URI
      // In a real implementation, you would use a library like expo-image-manipulator
      return uri;
    } catch (error) {
      console.error('Error resizing image:', error);
      return null;
    }
  }
}

export default new ImageService();