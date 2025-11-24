// src/services/userProfileAPI.ts - VERSIÓN CORREGIDA
import { apiRequest } from './api';
import { UserProfileData } from '../types';

// Definir tipos que coincidan con tu estructura
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain';

export const userProfileAPI = {
  // Obtener perfil completo
  async getProfile(): Promise<UserProfileData> {
    try {
      console.log('📋 Obteniendo perfil completo...');
      const data = await apiRequest('/profile', { method: 'GET' });

      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo perfil');
      }

      console.log('✅ Perfil obtenido exitosamente');
      
      const defaultProfile: UserProfileData = {
        personalInfo: {
          age: 0,
          weight: 0,
          height: 0,
          gender: '',
          activityLevel: undefined,
          dailyCalorieGoal: 0,
          avatar: ''
        },
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

      return {
        personalInfo: {
          ...defaultProfile.personalInfo,
          ...data.profile?.personalInfo
        },
        healthInfo: {
          ...defaultProfile.healthInfo,
          ...data.profile?.healthInfo
        },
        preferences: {
          ...defaultProfile.preferences,
          ...data.profile?.preferences
        }
      };
    } catch (error: any) {
      console.error('❌ Error obteniendo perfil:', error);
      throw new Error(error.message || 'Error al obtener perfil');
    }
  },

  async updatePersonalInfo(personalInfo: any): Promise<UserProfileData> {
    try {
      console.log('🎯 Actualizando información personal via API...');
      
      const data = await apiRequest('/profile/personal', {
        method: 'PATCH',
        data: {
          personalInfo: personalInfo
        }
      });

      if (!data.success) {
        throw new Error(data.message || 'Error actualizando información personal');
      }

      console.log('✅ Información personal actualizada via API');
      return data.profile;
    } catch (error: any) {
      console.error('❌ Error en updatePersonalInfo API:', error);
      throw new Error(error.message || 'Error al actualizar información personal');
    }
  }, // ✅ AGREGAR COMA AQUÍ

  async updatePreferences(preferences: any): Promise<UserProfileData> {
    try {
      console.log('🍽️ FRONTEND: Actualizando preferencias...');
      console.log('📊 Datos de preferencias recibidos:', preferences);

      const dataToSend = {
        preferences: {
          favoriteCuisines: Array.isArray(preferences.favoriteCuisines) ? preferences.favoriteCuisines : [],
          dislikedIngredients: Array.isArray(preferences.dislikedIngredients) ? preferences.dislikedIngredients : [],
          cookingSkills: preferences.cookingSkills || 'beginner'
        }
      };

      console.log('📤 Enviando preferencias al backend:', JSON.stringify(dataToSend, null, 2));
      
      const data = await apiRequest('/profile/preferences', {
        method: 'PATCH',
        data: dataToSend,
        timeout: 10000
      });

      if (!data.success) {
        console.error('❌ Backend reportó error en preferencias:', data.message);
        throw new Error(data.message || 'Error del servidor al actualizar preferencias');
      }

      console.log('✅ Preferencias actualizadas exitosamente');
      return data.profile;

    } catch (error: any) {
      console.error('❌ Error en updatePreferences:', error);
      
      if (error.response?.data) {
        const backendError = error.response.data;
        throw new Error(backendError.message || backendError.error || 'Error del servidor');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: El servidor tardó demasiado en responder');
      }
      
      if (error.message?.includes('Network Error') || error.message?.includes('ECONNREFUSED')) {
        throw new Error('No se puede conectar al servidor. Verifica que esté ejecutándose.');
      }
      
      throw new Error(error.message || 'Error desconocido al actualizar preferencias');
    }
  }, // ✅ AGREGAR COMA AQUÍ

 async updateHealthInfo(healthInfo: any): Promise<UserProfileData> {
  try {
    console.log('🏥 FRONTEND: Iniciando actualización de salud...');
    console.log('📊 Datos de salud recibidos:', healthInfo);

    const dataToSend = {
      healthInfo: {
        allergies: Array.isArray(healthInfo.allergies) ? healthInfo.allergies : [],
        dietaryRestrictions: Array.isArray(healthInfo.dietaryRestrictions) ? healthInfo.dietaryRestrictions : [],
        healthConditions: Array.isArray(healthInfo.healthConditions) ? healthInfo.healthConditions : [],
        healthGoals: Array.isArray(healthInfo.healthGoals) ? healthInfo.healthGoals : []
      }
    };

    console.log('📤 Enviando al backend:', JSON.stringify(dataToSend, null, 2));
    
    const data = await apiRequest('/profile/health', {
      method: 'PATCH',
      data: dataToSend,
      timeout: 10000
    });

    if (!data.success) {
      console.error('❌ Backend reportó error:', data.message);
      throw new Error(data.message || 'Error del servidor al actualizar información de salud');
    }

    console.log('✅ Información de salud actualizada exitosamente');
    console.log('📋 Perfil devuelto:', data.profile);
    
    // ✅ ASEGURAR QUE LOS ARRAYS SIEMPRE EXISTAN
    return {
      ...data.profile,
      healthInfo: {
        allergies: data.profile.healthInfo?.allergies || [],
        dietaryRestrictions: data.profile.healthInfo?.dietaryRestrictions || [],
        healthConditions: data.profile.healthInfo?.healthConditions || [],
        healthGoals: data.profile.healthInfo?.healthGoals || []
      }
    };

  } catch (error: any) {
    console.error('❌ Error en updateHealthInfo:', error);
    
    if (error.response?.data) {
      const backendError = error.response.data;
      console.error('🔍 Error del backend:', backendError);
      throw new Error(backendError.message || backendError.error || 'Error del servidor');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout: El servidor tardó demasiado en responder');
    }
    
    if (error.message?.includes('Network Error') || error.message?.includes('ECONNREFUSED')) {
      throw new Error('No se puede conectar al servidor. Verifica que esté ejecutándose.');
    }
    
    throw new Error(error.message || 'Error desconocido al actualizar información de salud');
  }
},

  // Calcular IMC
  async calculateBMI(): Promise<{ bmi: string; category: string }> {
    try {
      const data = await apiRequest('/profile/bmi', { method: 'GET' });
      
      if (!data.success) {
        throw new Error(data.message || 'Error calculando IMC');
      }

      return {
        bmi: data.bmi,
        category: data.category
      };
    } catch (error: any) {
      console.error('Error calculando IMC:', error);
      throw new Error(error.message || 'Error al calcular IMC');
    }
  },

  // Obtener estadísticas del perfil
  async getProfileStats(): Promise<any> {
    try {
      const data = await apiRequest('/profile/stats', { method: 'GET' });
      
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo estadísticas');
      }

      return data.stats;
    } catch (error: any) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error(error.message || 'Error al obtener estadísticas');
    }
  },

  // Obtener perfil vacío (para inicialización)
  getEmptyProfile(): UserProfileData {
    return {
      personalInfo: {
        age: 0,
        weight: 0,
        height: 0,
        gender: '',
        activityLevel: undefined,
        dailyCalorieGoal: 0,
        avatar: ''
      },
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
  }
};