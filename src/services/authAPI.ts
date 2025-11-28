// src/services/authAPI.ts
import { apiRequest } from './api';
import { storage } from './storage';
import { Platform } from 'react-native';
import { User, UserProfileData, AuthResponse } from '../types';

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

class AuthAPI {
  /**
   * Iniciar sesión
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthAPI - Iniciando sesión para:', email);
      
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        data: {
          email: email.toLowerCase().trim(),
          password: password
        }
      });

      console.log('✅ AuthAPI - Login exitoso');
      return response;
    } catch (error: any) {
      console.error('❌ AuthAPI - Error en login:', error);
      
      const authError: AuthError = {
        message: this.getErrorMessage(error),
        code: error.response?.data?.code,
        status: error.response?.status
      };
      
      throw authError;
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('📝 AuthAPI - Registrando usuario:', username, email);
      
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        data: {
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password: password
        }
      });

      console.log('✅ AuthAPI - Registro exitoso');
      return response;
    } catch (error: any) {
      console.error('❌ AuthAPI - Error en registro:', error);
      
      const authError: AuthError = {
        message: this.getErrorMessage(error),
        code: error.response?.data?.code,
        status: error.response?.status
      };
      
      throw authError;
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 AuthAPI - Cerrando sesión en servidor...');
      
      const token = await storage.getToken();
      if (!token) {
        console.log('ℹ️ AuthAPI - No hay token, logout local solamente');
        return;
      }

      // Intentar notificar al servidor
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          timeout: 5000 // Timeout corto para no bloquear
        });
        console.log('✅ AuthAPI - Logout exitoso en servidor');
      } catch (serverError: any) {
        // No lanzar error para permitir logout local aunque falle el servidor
        console.warn('⚠️ AuthAPI - Error en logout del servidor (continuando local):', serverError?.message);
      }
      
    } catch (error: any) {
      console.error('❌ AuthAPI - Error en logout:', error);
      // No lanzar error para permitir logout local
    }
  }

  /**
   * Logout forzado - Limpieza nuclear
   */
  async forceLogout(): Promise<void> {
    console.log('💥 AuthAPI - FORCE LOGOUT NUCLEAR INICIADO');
    
    try {
      // 1. Limpiar storage sin esperar
      await storage.clearAuth().catch(error => {
        console.error('Error en clearAuth:', error);
      });
      
      // 2. Limpieza adicional agresiva en web
      if (Platform.OS === 'web') {
        try {
          // Limpiar todo el localStorage
          localStorage.clear();
          
          // Limpiar sessionStorage
          sessionStorage.clear();
          
          // Limpiar cookies
          document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
          });
          
          console.log('✅ AuthAPI - Web storage limpiado completamente');
        } catch (webError) {
          console.error('Error limpiando web storage:', webError);
        }
      }
      
      console.log('💥 AuthAPI - FORCE LOGOUT COMPLETADO');
      
    } catch (error) {
      console.error('❌ AuthAPI - Error crítico en forceLogout:', error);
      // Aún así continuar
    }
  }

  /**
   * Verificar token
   */
  async verifyToken(): Promise<{ valid: boolean; user?: any }> {
    try {
      console.log('🔍 AuthAPI - Verificando token...');
      
      const token = await storage.getToken();
      if (!token) {
        console.log('❌ AuthAPI - No hay token');
        return { valid: false };
      }

      const response = await apiRequest('/auth/verify');
      console.log('✅ AuthAPI - Token válido');
      
      return { 
        valid: true, 
        user: response.user 
      };
    } catch (error: any) {
      console.error('❌ AuthAPI - Token inválido:', error);
      return { valid: false };
    }
  }

  /**
   * Renovar token
   */
  async refreshToken(): Promise<{ token: string }> {
    try {
      console.log('🔄 AuthAPI - Renovando token...');
      
      const response = await apiRequest('/auth/refresh', {
        method: 'POST'
      });
      
      console.log('✅ AuthAPI - Token renovado');
      
      return response;
    } catch (error: any) {
      console.error('❌ AuthAPI - Error renovando token:', error);
      
      const authError: AuthError = {
        message: this.getErrorMessage(error),
        code: error.response?.data?.code,
        status: error.response?.status
      };
      
      throw authError;
    }
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      console.log('📧 AuthAPI - Solicitando restablecimiento para:', email);
      
      await apiRequest('/auth/forgot-password', { 
        method: 'POST',
        data: { email } 
      });
      
      console.log('✅ AuthAPI - Solicitud de restablecimiento enviada');
    } catch (error: any) {
      console.error('❌ AuthAPI - Error en forgotPassword:', error);
      
      const authError: AuthError = {
        message: this.getErrorMessage(error),
        code: error.response?.data?.code,
        status: error.response?.status
      };
      
      throw authError;
    }
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      console.log('🔑 AuthAPI - Restableciendo contraseña...');
      
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        data: {
          token,
          newPassword
        }
      });
      
      console.log('✅ AuthAPI - Contraseña restablecida');
    } catch (error: any) {
      console.error('❌ AuthAPI - Error en resetPassword:', error);
      
      const authError: AuthError = {
        message: this.getErrorMessage(error),
        code: error.response?.data?.code,
        status: error.response?.status
      };
      
      throw authError;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('🔑 AuthAPI - Cambiando contraseña...');
      
      await apiRequest('/auth/change-password', {
        method: 'POST',
        data: {
          currentPassword,
          newPassword
        }
      });
      
      console.log('✅ AuthAPI - Contraseña cambiada');
    } catch (error: any) {
      console.error('❌ AuthAPI - Error en changePassword:', error);
      
      const authError: AuthError = {
        message: this.getErrorMessage(error),
        code: error.response?.data?.code,
        status: error.response?.status
      };
      
      throw authError;
    }
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<User> {
    try {
      console.log('👤 AuthAPI - Obteniendo usuario actual...');
      
      const response = await apiRequest('/auth/me');
      
      console.log('✅ AuthAPI - Usuario obtenido');
      return response.user;
    } catch (error: any) {
      console.error('❌ AuthAPI - Error obteniendo usuario:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Obtener perfil de usuario
   */
  async getProfile(): Promise<UserProfileData> {
    try {
      console.log('📋 AuthAPI - Obteniendo perfil...');
      
      const response = await apiRequest('/profile');
      
      console.log('✅ AuthAPI - Perfil obtenido');
      return response.profile;
    } catch (error: any) {
      console.error('❌ AuthAPI - Error obteniendo perfil:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Actualizar perfil completo
   */
  async updateProfile(profile: UserProfileData): Promise<User> {
    try {
      console.log('💾 AuthAPI - Actualizando perfil completo...');
      
      const response = await apiRequest('/profile', {
        method: 'PUT',
        data: { profile }
      });
      
      console.log('✅ AuthAPI - Perfil actualizado');
      return response.user;
    } catch (error: any) {
      console.error('❌ AuthAPI - Error actualizando perfil:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Actualizar perfil parcialmente
   */
  async updateProfilePartial(updates: Partial<UserProfileData>): Promise<User> {
    try {
      console.log('🔄 AuthAPI - Actualizando perfil parcial:', Object.keys(updates));
      
      // Determinar qué endpoint usar basado en los campos a actualizar
      let endpoint = '/profile';
      let method = 'PATCH';
      
      if (updates.personalInfo && Object.keys(updates.personalInfo).length > 0) {
        endpoint = '/profile/personal';
        method = 'PATCH';
      } else if (updates.healthInfo && Object.keys(updates.healthInfo).length > 0) {
        endpoint = '/profile/health';
        method = 'PATCH';
      } else if (updates.preferences && Object.keys(updates.preferences).length > 0) {
        endpoint = '/profile/preferences';
        method = 'PATCH';
      }

      const response = await apiRequest(endpoint, {
        method: method,
        data: updates
      });

      console.log('✅ AuthAPI - Perfil parcial actualizado');
      return response.user;
    } catch (error: any) {
      console.error('❌ AuthAPI - Error actualizando perfil parcial:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Cargar perfil completo del usuario
   */
  async loadCompleteUserProfile(): Promise<User> {
    try {
      const user = await storage.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      console.log('📥 AuthAPI - Cargando perfil completo del usuario...');
      
      // Cargar perfil desde el backend
      const profile = await this.getProfile();
      
      const completeUser: User = {
        ...user,
        profile: profile
      };
      
      // Guardar usuario completo en storage
      await storage.saveUser(completeUser);
      
      console.log('✅ AuthAPI - Perfil completo cargado exitosamente');
      return completeUser;
    } catch (error) {
      console.error('❌ AuthAPI - Error cargando perfil completo:', error);
      throw error;
    }
  }

  /**
   * Verificar estado de autenticación
   */
  async checkAuthStatus(): Promise<{ 
    isAuthenticated: boolean; 
    user?: User;
    needsRefresh?: boolean;
  }> {
    try {
      const token = await storage.getToken();
      const user = await storage.getUser();
      
      if (!token || !user) {
        return { isAuthenticated: false };
      }
      
      // Verificar si el token está próximo a expirar
      const tokenData = this.parseJwt(token);
      if (tokenData && tokenData.exp) {
        const now = Date.now() / 1000;
        const timeUntilExpiry = tokenData.exp - now;
        
        // Si expira en menos de 5 minutos, necesita refresh
        if (timeUntilExpiry < 300) {
          return { 
            isAuthenticated: true, 
            user,
            needsRefresh: true 
          };
        }
      }
      
      return { 
        isAuthenticated: true, 
        user 
      };
      
    } catch (error) {
      console.error('❌ AuthAPI - Error verificando estado:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Obtener mensajes de error amigables
   */
  private getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.status === 401) {
      return 'Credenciales inválidas. Verifica tu email y contraseña.';
    }
    
    if (error.response?.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    
    if (error.response?.status === 404) {
      return 'Servicio no disponible. Intenta más tarde.';
    }
    
    if (error.response?.status === 422) {
      return 'Datos de entrada inválidos. Verifica la información.';
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return 'Error de conexión. Verifica tu internet.';
    }
    
    if (error.code === 'TIMEOUT') {
      return 'Tiempo de espera agotado. Intenta nuevamente.';
    }
    
    return error.message || 'Error desconocido. Intenta nuevamente.';
  }

  /**
   * Decodificar token JWT
   */
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ AuthAPI - Error decodificando token:', error);
      return null;
    }
  }

  /**
   * Debug de autenticación
   */
  async debugAuth(): Promise<void> {
    console.log('🐛 AUTH DEBUG:');
    
    const token = await storage.getToken();
    const user = await storage.getUser();
    const authStatus = await this.checkAuthStatus();
    
    console.log('- Token exists:', !!token);
    console.log('- User exists:', !!user);
    console.log('- Auth status:', authStatus);
    
    if (token) {
      const tokenData = this.parseJwt(token);
      console.log('- Token data:', tokenData);
    }
    
    if (Platform.OS === 'web') {
      console.log('- localStorage token:', localStorage.getItem('auth_token'));
      console.log('- localStorage user:', localStorage.getItem('user_data'));
    }
  }
}

export const authAPI = new AuthAPI();