// src/hooks/usePermissions.tsx - VERSIÓN SIMPLIFICADA
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { storage } from '../services/storage';
import { User } from '../types';

// Interface para el contexto de permisos
interface PermissionsContextType {
  user: User | null;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  canManageUsers: () => boolean;
  canManageContent: () => boolean;
  canModerate: () => boolean;
  canDelete: (authorId: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Crear contexto
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Props para el provider
interface PermissionsProviderProps {
  children: ReactNode;
}

// Provider component
export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await storage.getUser();
        if (storedUser) {
          console.log('👤 Usuario cargado desde storage:', storedUser.username, 'Rol:', storedUser.role);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Funciones de permisos
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;

  const canManageUsers = (): boolean => {
    return isAdmin;
  };

  const canManageContent = (): boolean => {
    return isAdmin || isModerator;
  };

  const canModerate = (): boolean => {
    return isAdmin || isModerator;
  };

  const canDelete = (authorId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    if (isModerator) return true;
    return user.id === authorId;
  };

  // Funciones de autenticación
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      // Simulación de login para desarrollo
      const mockUser: User = {
        id: 'user_' + Date.now(),
        username: email.split('@')[0],
        email: email,
        role: email.includes('admin') ? 'admin' : 'user', // Para testing: usa admin@example.com
        isActive: true,
        profile: {
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
        }
      };
      
      setUser(mockUser);
      await storage.saveUser(mockUser);
      console.log('✅ Login exitoso. Rol:', mockUser.role);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    await storage.clearAuth();
    console.log('🚪 Sesión cerrada');
  };

  // Valor del contexto
  const value: PermissionsContextType = {
    user,
    isAdmin,
    isModerator,
    isLoading,
    canManageUsers,
    canManageContent,
    canModerate,
    canDelete,
    login,
    logout
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Hook personalizado
export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};