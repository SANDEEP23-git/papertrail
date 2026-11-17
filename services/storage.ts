/**
 * PAPERTRAIL — Universal Persistent Storage Adapter
 * 
 * Supports all environments:
 * - Native Android & iOS (via @react-native-async-storage/async-storage)
 * - Web Browsers (via localStorage)
 * - Graceful in-memory fallback for headless/sandboxed execution
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

export const AppStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
      } else {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (err) {
      console.warn(`[AppStorage] Failed to read ${key}:`, err);
    }
    return memoryStore.get(key) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      memoryStore.set(key, value);
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
          return;
        }
      } else {
        await AsyncStorage.setItem(key, value);
        return;
      }
    } catch (err) {
      console.warn(`[AppStorage] Failed to write ${key}:`, err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      memoryStore.delete(key);
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
          return;
        }
      } else {
        await AsyncStorage.removeItem(key);
        return;
      }
    } catch (err) {
      console.warn(`[AppStorage] Failed to remove ${key}:`, err);
    }
  },
};
