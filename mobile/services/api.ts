import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://building-approval.onrender.com/api';

const TOKEN_KEY = 'cb_auth_token';
const USER_KEY = 'cb_auth_user';

export const storage = {
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (e) {
      console.error('Error saving token:', e);
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Error deleting token:', e);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      let str: string | null = null;
      if (Platform.OS === 'web') {
        str = localStorage.getItem(USER_KEY);
      } else {
        str = await SecureStore.getItemAsync(USER_KEY);
      }
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      const val = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(USER_KEY, val);
      } else {
        await SecureStore.setItemAsync(USER_KEY, val);
      }
    } catch (e) {
      console.error('Error saving user:', e);
    }
  },

  async removeUser(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  }
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const token = await storage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanPath}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const status = res.status;
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      return {
        status,
        error: data?.error || data?.message || `Request failed with status ${status}`,
      };
    }

    return { data, status };
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    return {
      status: 0,
      error: err.message || 'Network request failed. Please check your connection.',
    };
  }
}

export { API_BASE_URL };
