// src/services/recipeAPI.ts - VERSIÓN SOLO BASE DE DATOS LOCAL
import { apiRequest } from './api';
import { storage } from './storage';

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Instruction {
  step: number;
  description: string;
}

export interface Recipe {
  _id?: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  preparationTime: number;
  servings: number;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  category: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Postre' | 'Snack' | 'Bebida';
  image?: string;
  author: string;
  authorName: string;
  likes: string[];
  likesCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse {
  recipes: Recipe[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecipes: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const recipeAPI = {
  // Crear nueva receta
  async createRecipe(recipeData: Omit<Recipe, '_id' | 'author' | 'authorName' | 'likes' | 'likesCount' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    try {
      console.log('🆕 Creando nueva receta...', recipeData);
      
      const token = await storage.getToken();
      if (!token) {
        throw new Error('No estás autenticado. Inicia sesión nuevamente.');
      }

      const data = await apiRequest('/recipes', {
        method: 'POST',
        data: recipeData
      });

      if (!data.success) {
        throw new Error(data.message || 'Error del servidor al crear receta');
      }

      if (!data.recipe) {
        throw new Error('No se recibió la receta creada del servidor');
      }

      console.log('✅ Receta creada exitosamente:', data.recipe.title);
      return data.recipe;
      
    } catch (error: any) {
      console.error('❌ Error creando receta:', error);
      
      if (error.message?.includes('401') || error.message?.includes('Token')) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      
      throw new Error(error.message || 'No se pudo crear la receta. Verifica tu conexión.');
    }
  },

  // Obtener recetas de la comunidad con paginación
  async getCommunityRecipes(page: number = 1, limit: number = 10, category?: string): Promise<PaginatedResponse> {
    try {
      console.log(`🔍 Obteniendo recetas de la comunidad - Página: ${page}, Límite: ${limit}, Categoría: ${category || 'Todas'}`);
      
      let url = `/recipes/community?page=${page}&limit=${limit}`;
      if (category && category.trim() !== '') {
        url += `&category=${encodeURIComponent(category)}`;
      }
      
      const data = await apiRequest(url, {
        method: 'GET'
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Error al obtener recetas');
      }
      
      console.log(`📦 Recetas recibidas: ${data.recipes?.length || 0} de ${data.pagination?.totalRecipes || 0} totales`);
      
      const validatedRecipes = (data.recipes || []).map((recipe: any) => ({
        ...recipe,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        likesCount: recipe.likesCount || 0,
        authorName: recipe.authorName || 'Anónimo'
      }));
      
      return {
        recipes: validatedRecipes,
        pagination: data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalRecipes: validatedRecipes.length,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo recetas de la comunidad:', error);
      throw error;
    }
  },

  // Obtener mis recetas con paginación
  async getMyRecipes(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
    try {
      console.log(`🔍 Obteniendo mis recetas - Página: ${page}`);
      const data = await apiRequest(`/recipes/my-recipes?page=${page}&limit=${limit}`, {
        method: 'GET'
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Error al obtener tus recetas');
      }
      
      const validatedRecipes = (data.recipes || []).map((recipe: any) => ({
        ...recipe,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        likesCount: recipe.likesCount || 0,
        authorName: recipe.authorName || 'Anónimo'
      }));
      
      return {
        recipes: validatedRecipes,
        pagination: data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalRecipes: validatedRecipes.length,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    } catch (error) {
      console.error('Error obteniendo mis recetas:', error);
      throw error;
    }
  },

  // Obtener receta por ID
  async getRecipeById(id: string): Promise<Recipe> {
    try {
      console.log('🔍 Llamando a API para receta ID:', id);
      const data = await apiRequest(`/recipes/${id}`, {
        method: 'GET'
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Error al obtener receta');
      }
      
      if (!data.recipe) {
        throw new Error('Receta no encontrada');
      }
      
      console.log('✅ Receta recibida de API:', data.recipe.title);
      
      const recipe = data.recipe;
      const validatedRecipe = {
        ...recipe,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        likesCount: recipe.likesCount || 0,
        authorName: recipe.authorName || 'Anónimo'
      };
      
      return validatedRecipe;
    } catch (error) {
      console.error('❌ Error obteniendo receta de API:', error);
      throw error;
    }
  },

  // Buscar recetas por término
  async searchRecipes(query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
    try {
      console.log(`🔍 Buscando recetas: "${query}" - Página: ${page}`);
      const data = await apiRequest(`/recipes/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
        method: 'GET'
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Error al buscar recetas');
      }
      
      const validatedRecipes = (data.recipes || []).map((recipe: any) => ({
        ...recipe,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        likesCount: recipe.likesCount || 0,
        authorName: recipe.authorName || 'Anónimo'
      }));
      
      return {
        recipes: validatedRecipes,
        pagination: data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalRecipes: validatedRecipes.length,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    } catch (error) {
      console.error('Error buscando recetas:', error);
      throw error;
    }
  },

  // Like/Unlike receta
  async toggleLike(recipeId: string): Promise<{ likesCount: number; hasLiked: boolean }> {
    try {
      console.log('❤️ Procesando like para receta:', recipeId);
      const data = await apiRequest(`/recipes/${recipeId}/like`, {
        method: 'POST'
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Error al procesar like');
      }
      
      console.log('✅ Like procesado exitosamente');
      return data;
    } catch (error) {
      console.error('Error en like:', error);
      throw error;
    }
  },

  // Eliminar receta
  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando receta:', recipeId);
      const data = await apiRequest(`/recipes/${recipeId}`, {
        method: 'DELETE'
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Error al eliminar receta');
      }
      
      console.log('✅ Receta eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando receta:', error);
      throw error;
    }
  }
};