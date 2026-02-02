/**
 * useLocationPermission Hook
 * Handles location permissions and fetching user coordinates using expo-location
 * GIG-009: Location-Based Filtering
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export interface UserCoordinates {
  lat: number;
  lng: number;
}

export interface UseLocationPermissionReturn {
  permissionStatus: Location.PermissionStatus | null;
  isLoading: boolean;
  error: string | null;
  coordinates: UserCoordinates | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<UserCoordinates | null>;
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (err) {
      setError('Failed to request location permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<UserCoordinates | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check permission first
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setError('Location permission not granted');
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: UserCoordinates = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setCoordinates(coords);
      return coords;
    } catch (err) {
      setError('Failed to get current location');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission]);

  return {
    permissionStatus,
    isLoading,
    error,
    coordinates,
    requestPermission,
    getCurrentLocation,
  };
}
