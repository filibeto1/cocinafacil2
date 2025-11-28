import { apiRequest } from './api';

export const userAPI = {
  // Obtener todos los usuarios (solo admin)
  async getAllUsers() {
    try {
      const data = await apiRequest('/admin/users', {
        method: 'GET'
      });
      return data || [];
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  },

  // Cambiar rol de usuario (solo admin)
  async updateUserRole(userId: string, newRole: string) {
    try {
      const data = await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        data: { newRole }
      });
      return data;
    } catch (error) {
      console.error('Error actualizando rol:', error);
      throw error;
    }
  },

  // Obtener usuario por ID
  async getUserById(userId: string) {
    try {
      const data = await apiRequest(`/admin/users/${userId}`, {
        method: 'GET'
      });
      return data;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  },

  // Suspender/activar usuario
  async toggleUserStatus(userId: string) {
    try {
      const data = await apiRequest(`/admin/users/${userId}/toggle-status`, {
        method: 'PATCH'
      });
      return data;
    } catch (error) {
      console.error('Error cambiando estatus de usuario:', error);
      throw error;
    }
  }
};