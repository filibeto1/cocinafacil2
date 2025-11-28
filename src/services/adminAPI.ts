// src/services/adminAPI.ts - VERSIÓN CORREGIDA
import { User, Recipe, Question, AdminStats, UserManagement } from '../types';

// Usar la función apiRequest de tu archivo api.ts existente
import { apiRequest } from './api';

export const adminAPI = {
  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================
  getStats: async (): Promise<AdminStats> => {
    try {
      const data = await apiRequest('/admin/stats', {
        method: 'GET'
      });
      return data.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  // ==========================================================================
  // GESTIÓN DE USUARIOS
  // ==========================================================================
  getUsers: async (): Promise<UserManagement[]> => {
    try {
      const data = await apiRequest('/admin/users', {
        method: 'GET'
      });
      return data.data;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  },

  updateUserRole: async (userId: string, newRole: string): Promise<User> => {
    try {
      const data = await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        data: { newRole }
      });
      return data.data;
    } catch (error) {
      console.error('Error actualizando rol:', error);
      throw error;
    }
  },

  toggleUserStatus: async (userId: string): Promise<{ id: string; isActive: boolean }> => {
    try {
      const data = await apiRequest(`/admin/users/${userId}/toggle-status`, {
        method: 'PATCH'
      });
      return data.data;
    } catch (error) {
      console.error('Error cambiando estado de usuario:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  },

  // ==========================================================================
  // MODERACIÓN DE CONTENIDO
  // ==========================================================================
  getPendingRecipes: async (): Promise<Recipe[]> => {
    try {
      const data = await apiRequest('/admin/recipes/pending', {
        method: 'GET'
      });
      return data.data;
    } catch (error) {
      console.error('Error obteniendo recetas pendientes:', error);
      throw error;
    }
  },

  approveRecipe: async (recipeId: string, approved: boolean): Promise<Recipe> => {
    try {
      const data = await apiRequest(`/admin/recipes/${recipeId}/approve`, {
        method: 'PATCH',
        data: { approved }
      });
      return data.data;
    } catch (error) {
      console.error('Error aprobando receta:', error);
      throw error;
    }
  },

  getPendingQuestions: async (): Promise<Question[]> => {
    try {
      const data = await apiRequest('/admin/questions/pending', {
        method: 'GET'
      });
      return data.data;
    } catch (error) {
      console.error('Error obteniendo preguntas pendientes:', error);
      throw error;
    }
  },

  moderateQuestion: async (questionId: string, approved: boolean, reason?: string): Promise<Question> => {
    try {
      const data = await apiRequest(`/admin/questions/${questionId}/moderate`, {
        method: 'PATCH',
        data: { approved, reason }
      });
      return data.data;
    } catch (error) {
      console.error('Error moderando pregunta:', error);
      throw error;
    }
  },

  getReports: async (): Promise<any[]> => {
    try {
      const data = await apiRequest('/admin/reports', {
        method: 'GET'
      });
      return data.data;
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      throw error;
    }
  }
};