import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback } from 'react';

interface GeolocationState {
  position: Position | null;
  loading: boolean;
  error: string | null;
}

export const useNativeGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: false,
    error: null,
  });

  const isNative = Capacitor.isNativePlatform();

  const getCurrentPosition = useCallback(async (): Promise<Position | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      setState({ position, loading: false, error: null });
      return position;
    } catch (error: any) {
      const errorMessage = error?.message || 'فشل في الحصول على الموقع';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      console.error('Error getting position:', error);
      return null;
    }
  }, []);

  const watchPosition = useCallback((
    callback: (position: Position | null, error?: string) => void
  ) => {
    const watchId = Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
      (position, error) => {
        if (error) {
          callback(null, error.message);
        } else if (position) {
          callback(position);
        }
      }
    );

    return watchId;
  }, []);

  const clearWatch = useCallback(async (watchId: string) => {
    await Geolocation.clearWatch({ id: watchId });
  }, []);

  const checkPermissions = useCallback(async (): Promise<PermissionStatus> => {
    return await Geolocation.checkPermissions();
  }, []);

  const requestPermissions = useCallback(async (): Promise<PermissionStatus> => {
    return await Geolocation.requestPermissions();
  }, []);

  const getDistanceBetween = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }, []);

  return {
    ...state,
    isNative,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    checkPermissions,
    requestPermissions,
    getDistanceBetween,
  };
};
