// src/services/storage.ts - VERSIÓN CORREGIDA CON SOPORTE WEB
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, UserProfileData } from '../types';

// Perfil por defecto
const defaultProfile: UserProfileData = {
  personalInfo: {},
  healthInfo: {
    allergies: [],
    dietaryRestrictions: [],
    healthConditions: [],
    healthGoals: []
  },
  preferences: {
    favoriteCuisines: [],
    dislikedIngredients: [],
    cookingSkills: 'beginner'
  }
};

// ✅ Helper para detectar si estamos en web
const isWeb = Platform.OS === 'web';

// ✅ Storage alternativo para web
const webStorage = {
  setItem(key: string, value: string): void {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('localStorage no disponible:', error);
      }
    }
  },

  getItem(key: string): string | null {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage no disponible:', error);
        return null;
      }
    }
    return null;
  },

  removeItem(key: string): void {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('localStorage no disponible:', error);
      }
    }
  }
};

// ✅ Función debugAuth corregida
const debugAuth = async () => {
  console.log('🐛 DEBUG AUTH:');
  
  const token = await storage.getToken();
  const storedUser = await storage.getUser();
  
  console.log('- Storage token:', token);
  console.log('- Storage user:', storedUser);
  
  if (Platform.OS === 'web') {
    console.log('- localStorage token:', localStorage.getItem('auth_token'));
    console.log('- localStorage user:', localStorage.getItem('user_data'));
  }
};

// ✅ API unificada para todos los entornos
export const storage = {
  async saveToken(token: string): Promise<void> {
    try {
      if (isWeb) {
        webStorage.setItem('auth_token', token);
      } else {
        await SecureStore.setItemAsync('auth_token', token);
      }
      console.log('✅ Token guardado exitosamente');
    } catch (error) {
      console.error('❌ Error saving token:', error);
      throw new Error('No se pudo guardar el token de autenticación');
    }
  },

  async getToken(): Promise<string | null> {
    try {
      let token: string | null;
      
      if (isWeb) {
        token = webStorage.getItem('auth_token');
      } else {
        token = await SecureStore.getItemAsync('auth_token');
      }
      
      console.log('🔍 Token recuperado:', token ? '✅ Existe' : '❌ No existe');
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (isWeb) {
        webStorage.removeItem('auth_token');
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
      console.log('✅ Token eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error removing token:', error);
      throw new Error('No se pudo eliminar el token de autenticación');
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      const userToSave: User = {
        ...user,
        profile: user.profile || defaultProfile
      };
      
      if (isWeb) {
        webStorage.setItem('user_data', JSON.stringify(userToSave));
      } else {
        await SecureStore.setItemAsync('user_data', JSON.stringify(userToSave));
      }
      
      console.log('✅ Usuario guardado exitosamente');
    } catch (error) {
      console.error('❌ Error saving user:', error);
      throw new Error('No se pudo guardar la información del usuario');
    }
  },

  async getUser(): Promise<User | null> {
    try {
      let userData: string | null;
      
      if (isWeb) {
        userData = webStorage.getItem('user_data');
      } else {
        userData = await SecureStore.getItemAsync('user_data');
      }
      
      if (userData) {
        const user = JSON.parse(userData);
        const userWithProfile: User = {
          ...user,
          profile: user.profile || defaultProfile
        };
        
        console.log('✅ Usuario recuperado exitosamente');
        return userWithProfile;
      }
      
      console.log('ℹ️ No hay usuario guardado');
      return null;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return null;
    }
  },

  async removeUser(): Promise<void> {
    try {
      if (isWeb) {
        webStorage.removeItem('user_data');
      } else {
        await SecureStore.deleteItemAsync('user_data');
      }
      console.log('✅ Usuario eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error removing user:', error);
      throw new Error('No se pudo eliminar la información del usuario');
    }
  },

  async clearAuth(): Promise<void> {
    console.log('🧹 STORAGE - LIMPIEZA AGRESIVA INICIADA');
    
    try {
      // Limpiar TODO
      if (Platform.OS === 'web') {
        // WEB: Limpiar todo
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('auth_state');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user_data');
        
        // Intentar limpiar también indexedDB por si acaso
        if ('indexedDB' in window) {
          indexedDB.databases().then(dbs => {
            dbs.forEach(db => {
              if (db.name) indexedDB.deleteDatabase(db.name);
            });
          }).catch(() => {});
        }
        
        console.log('✅ Web storage limpiado completamente');
      } else {
        // MOBILE
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
        console.log('✅ SecureStore limpiado completamente');
      }
      
      console.log('🧹 STORAGE - LIMPIEZA COMPLETADA');
    } catch (error) {
      console.error('❌ Error en clearAuth:', error);
      // No lanzar error para no bloquear el logout
    }
  },

  async clearAuthData(): Promise<void> {
    return this.clearAuth();
  },

  async clear(): Promise<void> {
    return this.clearAuth();
  },

  async clearAll(): Promise<void> {
    try {
      console.log('🧹 Limpiando todo el storage...');
      await this.clearAuth();
      console.log('✅ Storage limpiado completamente');
    } catch (error) {
      console.error('❌ Error clearing all storage:', error);
      throw error;
    }
  },

  // ✅ Exportar debugAuth como método
  debugAuth
};

// ✅ Exportar funciones individuales
export const saveToken = storage.saveToken.bind(storage);
export const getToken = storage.getToken.bind(storage);
export const removeToken = storage.removeToken.bind(storage);
export const saveUser = storage.saveUser.bind(storage);
export const getUser = storage.getUser.bind(storage);
export const removeUser = storage.removeUser.bind(storage);
export const clearAuth = storage.clearAuth.bind(storage);
export const clearAuthData = storage.clearAuthData.bind(storage);
export const clearStorage = storage.clearAll.bind(storage);

// ✅ Exportar debugAuth como función independiente
export { debugAuth, defaultProfile };