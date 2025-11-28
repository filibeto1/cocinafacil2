// AuthContext.tsx - VERSIÓN COMPLETA CORREGIDA
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { authAPI } from '../services/api';
import { userProfileAPI } from '../services/userProfileAPI';
import { storage } from '../services/storage'; 
import { User, UserProfileData } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => Promise<void>;
  updatePersonalInfo: (personalInfo: UserProfileData['personalInfo']) => Promise<void>;
  updateHealthInfo: (healthInfo: UserProfileData['healthInfo']) => Promise<void>;
  updatePreferences: (preferences: UserProfileData['preferences']) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  canManageUsers: () => boolean;
  canManageContent: () => boolean;
  canModerate: () => boolean;
  canDelete: (authorId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;

  const canManageUsers = (): boolean => isAdmin;
  const canManageContent = (): boolean => isAdmin || isModerator;
  const canModerate = (): boolean => isAdmin || isModerator;
  const canDelete = (authorId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    if (isModerator) return true;
    return user.id === authorId;
  };

  // ✅ LOGOUT MEJORADO - CON MANEJO SEGURO DE ERRORES EN authAPI.logout
  const logout = useCallback(async (): Promise<void> => {
    console.log('🚪 AuthContext - LOGOUT INICIADO');
    
    try {
      // 1. Notificar al backend (con manejo seguro de errores)
      try {
        // ✅ VERIFICAR QUE authAPI.logout EXISTA ANTES DE LLAMARLO
        if (authAPI && typeof authAPI.logout === 'function') {
          await authAPI.logout();
          console.log('✅ Backend notificado del logout');
        } else {
          console.warn('⚠️ authAPI.logout no disponible, continuando con logout local');
        }
      } catch (serverError) {
        console.warn('⚠️ No se pudo notificar al backend (continuando):', serverError);
      }
      
      // 2. LIMPIAR ESTADOS DE REACT PRIMERO (síncrono)
      console.log('🔄 Limpiando estados de React...');
      setUser(null);
      setUserProfile(null);
      
      // 3. Limpiar storage después
      console.log('🔄 Limpiando storage...');
      await storage.clearAuth();
      
      // 4. Verificación adicional
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const tokenCheck = await storage.getToken();
      const userCheck = await storage.getUser();
      
      if (tokenCheck || userCheck) {
        console.warn('⚠️ Storage no se limpió completamente, reintentando...');
        await storage.clearAuth();
        
        // Si es web, limpiar directamente
        if (Platform.OS === 'web') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }
      
      console.log('✅ Logout completado exitosamente');
      
    } catch (error) {
      console.error('❌ Error en logout:', error);
      
      // GARANTIZAR limpieza incluso si hay error
      setUser(null);
      setUserProfile(null);
      
      try {
        await storage.clearAuth();
      } catch (storageError) {
        console.error('❌ Error limpiando storage:', storageError);
      }
    }
  }, []);

  // ✅ FORCE LOGOUT - LIMPIEZA NUCLEAR
  const forceLogout = useCallback(async (): Promise<void> => {
    console.log('💥 AuthContext - FORCE LOGOUT NUCLEAR');
    
    // 1. Limpiar estados SÍNCRONAMENTE
    setUser(null);
    setUserProfile(null);
    
    // 2. Limpiar storage (sin esperar)
    storage.clearAuth().catch(error => {
      console.error('Error en clearAuth:', error);
    });
    
    // 3. Si es web, limpieza directa
    if (Platform.OS === 'web') {
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpiar cookies
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        
        console.log('✅ Web storage completamente limpiado');
      } catch (e) {
        console.error('Error limpiando web storage:', e);
      }
    }
    
    // 4. Forzar múltiples renders para asegurar actualización
    setTimeout(() => setUser(null), 50);
    setTimeout(() => setUser(null), 100);
    setTimeout(() => setUser(null), 200);
    
    console.log('💥 Force logout completado');
  }, []);

  // CARGA INICIAL DE USUARIO
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUser = await storage.getUser();
      const token = await storage.getToken();
      
      console.log('🔍 AuthContext - Cargando datos...', {
        hasUser: !!storedUser,
        hasToken: !!token,
        user: storedUser?.username
      });

      if (storedUser && token) {
        console.log('👤 Usuario encontrado:', storedUser.username);
        setUser(storedUser);
        
        try {
          const profileData = await userProfileAPI.getProfile();
          setUserProfile(profileData);
          console.log('✅ Perfil cargado');
        } catch (error: any) {
          console.error('❌ Error cargando perfil:', error);
          
          if (error.message?.includes('Token inválido') || 
              error.message?.includes('401') || 
              error.message?.includes('Unauthorized')) {
            console.log('🔐 Token inválido, cerrando sesión...');
            await logout();
            return;
          }
          
          // ✅ Perfil vacío por defecto
          const emptyProfile: UserProfileData = {
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
          setUserProfile(emptyProfile);
        }
      } else {
        console.log('🔐 No hay usuario autenticado');
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      await logout();
    } finally {
      setLoading(false);
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
      console.log('✅ Sesión iniciada. Rol:', response.user.role);
      
      try {
        await refreshUserProfile();
      } catch (profileError) {
        console.warn('⚠️ No se pudo cargar perfil, inicializando vacío');
        const emptyProfile: UserProfileData = {
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
        setUserProfile(emptyProfile);
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      await logout();
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
      
      const emptyProfile: UserProfileData = {
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
      setUserProfile(emptyProfile);
      
      console.log('✅ Usuario registrado. Rol:', response.user.role);
    } catch (error) {
      console.error('❌ Error en registro:', error);
      await logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    try {
      console.log('🔄 Actualizando perfil...');
      const profileData = await userProfileAPI.getProfile();
      
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
      
      setUserProfile(completeProfile);
      
    } catch (error: any) {
      console.error('❌ Error actualizando perfil:', error);
      
      if (error.message?.includes('401') || 
          error.message?.includes('Token inválido') ||
          error.message?.includes('Unauthorized')) {
        console.log('🔐 Token inválido, cerrando sesión...');
        await logout();
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      
      throw error;
    }
  };

  const updatePersonalInfo = async (personalInfo: UserProfileData['personalInfo']): Promise<void> => {
    try {
      console.log('💾 Actualizando información personal...');
      
      const updatedProfile = await userProfileAPI.updatePersonalInfo(personalInfo);
      
      setUserProfile(prev => ({
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
      }));
      
      console.log('✅ Información personal actualizada');
    } catch (error: any) {
      console.error('❌ Error actualizando información personal:', error);
      
      if (error.message?.includes('401') || 
          error.message?.includes('Token inválido') ||
          error.message?.includes('Unauthorized')) {
        await logout();
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      
      throw error;
    }
  };

  const updateHealthInfo = async (healthInfo: UserProfileData['healthInfo']): Promise<void> => {
    try {
      console.log('💾 Actualizando información de salud...');
      
      const updatedProfile = await userProfileAPI.updateHealthInfo(healthInfo);
      
      setUserProfile(prev => ({
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
      }));
      
      console.log('✅ Información de salud actualizada');
    } catch (error: any) {
      console.error('❌ Error actualizando información de salud:', error);
      
      if (error.message?.includes('401') || 
          error.message?.includes('Token inválido') ||
          error.message?.includes('Unauthorized')) {
        await logout();
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      
      throw error;
    }
  };

  const updatePreferences = async (preferences: UserProfileData['preferences']): Promise<void> => {
    try {
      console.log('💾 Actualizando preferencias...');
      
      const updatedProfile = await userProfileAPI.updatePreferences(preferences);
      
      setUserProfile(prev => ({
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
      }));
      
      console.log('✅ Preferencias actualizadas');
    } catch (error: any) {
      console.error('❌ Error actualizando preferencias:', error);
      
      if (error.message?.includes('401') || 
          error.message?.includes('Token inválido') ||
          error.message?.includes('Unauthorized')) {
        await logout();
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
    isModerator,
    loading,
    login,
    register,
    logout,
    forceLogout,
    updatePersonalInfo,
    updateHealthInfo,
    updatePreferences,
    refreshUserProfile,
    canManageUsers,
    canManageContent,
    canModerate,
    canDelete
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