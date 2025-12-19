import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useState } from 'react';

export const useNativeCamera = () => {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const takePicture = async (): Promise<Photo | null> => {
    if (!isNative) {
      console.log('Camera is only available on native platforms');
      return null;
    }

    setLoading(true);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      setPhoto(image);
      return image;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async (): Promise<Photo | null> => {
    if (!isNative) {
      console.log('Gallery is only available on native platforms');
      return null;
    }

    setLoading(true);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });
      setPhoto(image);
      return image;
    } catch (error) {
      console.error('Error picking from gallery:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pickMultipleFromGallery = async (): Promise<Photo[]> => {
    if (!isNative) {
      console.log('Gallery is only available on native platforms');
      return [];
    }

    setLoading(true);
    try {
      const images = await Camera.pickImages({
        quality: 90,
      });
      return images.photos.map(p => ({
        ...p,
        format: p.format || 'jpeg',
      })) as Photo[];
    } catch (error) {
      console.error('Error picking multiple images:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    if (!isNative) return { camera: 'granted', photos: 'granted' };
    
    const permissions = await Camera.checkPermissions();
    return permissions;
  };

  const requestPermissions = async () => {
    if (!isNative) return { camera: 'granted', photos: 'granted' };
    
    const permissions = await Camera.requestPermissions();
    return permissions;
  };

  return {
    photo,
    loading,
    isNative,
    takePicture,
    pickFromGallery,
    pickMultipleFromGallery,
    checkPermissions,
    requestPermissions,
  };
};
