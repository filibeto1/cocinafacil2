// src/context/AuthContext.tsx - VERSIÓN CORREGIDA
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { userProfileAPI } from '../services/userProfileAPI';
import { storage } from '../services/storage';
import { User, UserProfileData } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePersonalInfo: (personalInfo: UserProfileData['personalInfo']) => Promise<void>;
  updateHealthInfo: (healthInfo: UserProfileData['healthInfo']) => Promise<void>;
  updatePreferences: (preferences: UserProfileData['preferences']) => Promise<void>; // ✅ DEBE ESTAR PRESENTE
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUser = await storage.getUser();
      const token = await storage.getToken();
      
      console.log('🔍 Cargando datos de usuario...', {
        hasUser: !!storedUser,
        hasToken: !!token,
        user: storedUser?.username
      });

      if (storedUser && token) {
        console.log('👤 Usuario encontrado en storage:', storedUser.username);
        setUser(storedUser);
        
        try {
          console.log('🔄 Verificando token y cargando perfil...');
          const profileData = await userProfileAPI.getProfile();
          setUserProfile(profileData);
          console.log('✅ Perfil cargado exitosamente');
        } catch (error: any) {
          console.error('❌ Error cargando perfil:', error);
          
          if (error.message?.includes('Token inválido')) {
            console.log('🔐 Token inválido, cerrando sesión automáticamente...');
            await clearAuthData();
            return;
          }
          
          const emptyProfile = userProfileAPI.getEmptyProfile();
          setUserProfile(emptyProfile);
        }
      } else {
        console.log('🔐 No hay usuario autenticado en storage');
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA LIMPIAR DATOS DE AUTENTICACIÓN
  const clearAuthData = async () => {
    try {
      await storage.clearAuth();
      setUser(null);
      setUserProfile(null);
      console.log('🧹 Datos de autenticación limpiados');
    } catch (error) {
      console.error('❌ Error limpiando datos de auth:', error);
    }
  };

const refreshUserProfile = async (): Promise<void> => {
  try {
    console.log('🔄 Actualizando perfil desde la base de datos...');
    const profileData = await userProfileAPI.getProfile();
    
    console.log('📦 Perfil completo recibido:', JSON.stringify(profileData, null, 2));
    
    // ✅ ASEGURAR ESTRUCTURA COMPLETA
    const completeProfile: UserProfileData = {
      personalInfo: {
        age: profileData.personalInfo?.age || 0,
        weight: profileData.personalInfo?.weight || 0,
        height: profileData.personalInfo?.height || 0,
        gender: profileData.personalInfo?.gender || '',
        activityLevel: profileData.personalInfo?.activityLevel || undefined,
        dailyCalorieGoal: profileData.personalInfo?.dailyCalorieGoal || 0,
        avatar: profileData.personalInfo?.avatar || ''
      },
      healthInfo: {
        allergies: Array.isArray(profileData.healthInfo?.allergies) ? profileData.healthInfo.allergies : [],
        dietaryRestrictions: Array.isArray(profileData.healthInfo?.dietaryRestrictions) ? profileData.healthInfo.dietaryRestrictions : [],
        healthConditions: Array.isArray(profileData.healthInfo?.healthConditions) ? profileData.healthInfo.healthConditions : [],
        healthGoals: Array.isArray(profileData.healthInfo?.healthGoals) ? profileData.healthInfo.healthGoals : []
      },
      preferences: {
        favoriteCuisines: Array.isArray(profileData.preferences?.favoriteCuisines) ? profileData.preferences.favoriteCuisines : [],
        dislikedIngredients: Array.isArray(profileData.preferences?.dislikedIngredients) ? profileData.preferences.dislikedIngredients : [],
        cookingSkills: profileData.preferences?.cookingSkills || 'beginner'
      }
    };
    
    console.log('✅ Perfil procesado:', JSON.stringify(completeProfile, null, 2));
    setUserProfile(completeProfile);
    
  } catch (error: any) {
    console.error('❌ Error actualizando perfil:', error);
    
    if (error.message?.includes('401') || 
        error.message?.includes('Token inválido') ||
        error.message?.includes('Unauthorized')) {
      console.log('🔐 Token inválido durante actualización, cerrando sesión...');
      await clearAuthData();
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    
    throw error;
  }
};

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      console.log('🔐 Iniciando sesión...');
      
      const response = await authAPI.login(email, password);
      
      await storage.saveToken(response.token);
      await storage.saveUser(response.user);
      
      setUser(response.user);
      console.log('✅ Sesión iniciada exitosamente. Rol:', response.user.role);
      
      try {
        await refreshUserProfile();
      } catch (profileError) {
        console.warn('⚠️ No se pudo cargar perfil completo, inicializando vacío:', profileError);
        const emptyProfile = userProfileAPI.getEmptyProfile();
        setUserProfile(emptyProfile);
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      await clearAuthData();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      console.log('📝 Registrando usuario...');
      
      const response = await authAPI.register(username, email, password);
      
      await storage.saveToken(response.token);
      await storage.saveUser(response.user);
      
      setUser(response.user);
      
      const emptyProfile = userProfileAPI.getEmptyProfile();
      setUserProfile(emptyProfile);
      
      console.log('✅ Usuario registrado exitosamente. Rol:', response.user.role);
    } catch (error) {
      console.error('❌ Error en registro:', error);
      await clearAuthData();
      throw error;
    } finally {
      setLoading(false);
    }
  };
 const logout = async (): Promise<void> => {
  try {
    setLoading(true);
    console.log('🚪 AuthContext: Cerrando sesión...');
    
    console.log('🔍 Paso 1: Antes de clearAuth()');
    
    // ✅ Usar la función principal de limpieza
    await storage.clearAuth();
    console.log('✅ Paso 2: Storage limpiado exitosamente');
    
    console.log('🔍 Paso 3: Antes de limpiar estados');
    // Limpiar estados locales
    setUser(null);
    setUserProfile(null);
    console.log('✅ Paso 4: Estados limpiados');
    
    console.log('✅ Paso 5: Sesión cerrada exitosamente');
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ AuthContext: Error cerrando sesión:', error.message);
      console.error('🔍 Stack:', error.stack);
      throw new Error('No se pudo cerrar la sesión. Intenta nuevamente. Detalles: ' + error.message);
    } else {
      console.error('❌ AuthContext: Error desconocido cerrando sesión:', error);
      throw new Error('No se pudo cerrar la sesión por un error desconocido.');
    }
  } finally {
    setLoading(false);
    console.log('🔍 Paso 6: Finally block ejecutado');
  }
};
// src/context/AuthContext.tsx - SOLUCIÓN DEFINITIVA COMPLETA
const updatePersonalInfo = async (personalInfo: any): Promise<void> => {
  try {
    console.log('💾 AuthContext: Actualizando información personal...');
    console.log('📤 Datos enviados:', personalInfo);
    
    const updatedProfile = await userProfileAPI.updatePersonalInfo(personalInfo);
    
    console.log('📦 Perfil actualizado recibido:', JSON.stringify(updatedProfile, null, 2));
    
    // ✅ ACTUALIZAR ESTADO COMPLETO
    setUserProfile(prev => {
      const newProfile = {
        personalInfo: {
          age: updatedProfile.personalInfo?.age || prev?.personalInfo?.age || 0,
          weight: updatedProfile.personalInfo?.weight || prev?.personalInfo?.weight || 0,
          height: updatedProfile.personalInfo?.height || prev?.personalInfo?.height || 0,
          gender: updatedProfile.personalInfo?.gender || prev?.personalInfo?.gender || '',
          activityLevel: updatedProfile.personalInfo?.activityLevel || prev?.personalInfo?.activityLevel,
          dailyCalorieGoal: updatedProfile.personalInfo?.dailyCalorieGoal || prev?.personalInfo?.dailyCalorieGoal || 0,
          avatar: updatedProfile.personalInfo?.avatar || prev?.personalInfo?.avatar || ''
        },
        healthInfo: prev?.healthInfo || updatedProfile.healthInfo || {
          allergies: [],
          dietaryRestrictions: [],
          healthConditions: [],
          healthGoals: []
        },
        preferences: prev?.preferences || updatedProfile.preferences || {
          favoriteCuisines: [],
          dislikedIngredients: [],
          cookingSkills: 'beginner'
        }
      };
      
      console.log('✅ Estado actualizado en AuthContext:', JSON.stringify(newProfile, null, 2));
      return newProfile;
    });
    
    console.log('✅ Información personal actualizada exitosamente');
  } catch (error: any) {
    console.error('❌ Error actualizando información personal:', error);
    throw error;
  }
};
const updateHealthInfo = async (healthInfo: UserProfileData['healthInfo']): Promise<void> => {
  try {
    console.log('💾 Actualizando información de salud...');
    console.log('📤 Datos enviados:', healthInfo);
    
    const updatedProfile = await userProfileAPI.updateHealthInfo(healthInfo);
    
    console.log('📦 Perfil actualizado recibido:', JSON.stringify(updatedProfile, null, 2));
    
    // ✅ ACTUALIZAR ESTADO COMPLETO
    setUserProfile(prev => {
      const newProfile = {
        personalInfo: prev?.personalInfo || updatedProfile.personalInfo || {
          age: 0,
          weight: 0,
          height: 0,
          gender: '',
          activityLevel: undefined,
          dailyCalorieGoal: 0,
          avatar: ''
        },
        healthInfo: {
          allergies: Array.isArray(updatedProfile.healthInfo?.allergies) ? updatedProfile.healthInfo.allergies : [],
          dietaryRestrictions: Array.isArray(updatedProfile.healthInfo?.dietaryRestrictions) ? updatedProfile.healthInfo.dietaryRestrictions : [],
          healthConditions: Array.isArray(updatedProfile.healthInfo?.healthConditions) ? updatedProfile.healthInfo.healthConditions : [],
          healthGoals: Array.isArray(updatedProfile.healthInfo?.healthGoals) ? updatedProfile.healthInfo.healthGoals : []
        },
        preferences: prev?.preferences || updatedProfile.preferences || {
          favoriteCuisines: [],
          dislikedIngredients: [],
          cookingSkills: 'beginner'
        }
      };
      
      console.log('✅ Estado actualizado en AuthContext:', JSON.stringify(newProfile, null, 2));
      return newProfile;
    });
    
    console.log('✅ Información de salud actualizada exitosamente');
  } catch (error: any) {
    console.error('❌ Error actualizando información de salud:', error);
    
    if (error.message?.includes('401') || 
        error.message?.includes('Token inválido') ||
        error.message?.includes('Unauthorized')) {
      console.log('🔐 Token inválido durante actualización, cerrando sesión...');
      await clearAuthData();
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    
    throw error;
  }
};

const updatePreferences = async (preferences: UserProfileData['preferences']): Promise<void> => {
  try {
    console.log('💾 AuthContext: Actualizando preferencias...');
    console.log('📤 Datos enviados:', preferences);
    
    const updatedProfile = await userProfileAPI.updatePreferences(preferences);
    
    console.log('📦 Perfil actualizado recibido:', JSON.stringify(updatedProfile, null, 2));
    
    // ✅ ACTUALIZAR ESTADO COMPLETO
    setUserProfile(prev => {
      const newProfile = {
        personalInfo: prev?.personalInfo || updatedProfile.personalInfo || {
          age: 0,
          weight: 0,
          height: 0,
          gender: '',
          activityLevel: undefined,
          dailyCalorieGoal: 0,
          avatar: ''
        },
        healthInfo: prev?.healthInfo || updatedProfile.healthInfo || {
          allergies: [],
          dietaryRestrictions: [],
          healthConditions: [],
          healthGoals: []
        },
        preferences: {
          favoriteCuisines: Array.isArray(updatedProfile.preferences?.favoriteCuisines) ? updatedProfile.preferences.favoriteCuisines : [],
          dislikedIngredients: Array.isArray(updatedProfile.preferences?.dislikedIngredients) ? updatedProfile.preferences.dislikedIngredients : [],
          cookingSkills: updatedProfile.preferences?.cookingSkills || 'beginner'
        }
      };
      
      console.log('✅ Estado actualizado en AuthContext:', JSON.stringify(newProfile, null, 2));
      return newProfile;
    });
    
    console.log('✅ Preferencias actualizadas exitosamente');
  } catch (error: any) {
    console.error('❌ Error actualizando preferencias:', error);
    
    if (error.message?.includes('401') || 
        error.message?.includes('Token inválido') ||
        error.message?.includes('Unauthorized')) {
      console.log('🔐 Token inválido durante actualización, cerrando sesión...');
      await clearAuthData();
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    
    throw error;
  }
};
  const value: AuthContextType = {
    user,
    userProfile,
    isAuthenticated: !!user,
    isAdmin,
    loading,
    login,
    register,
    logout,
    updatePersonalInfo,
    updateHealthInfo,
    updatePreferences,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};