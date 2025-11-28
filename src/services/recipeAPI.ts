// src/services/recipeAPI.ts - VERSIÓN COMPLETA CORREGIDA
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
  category: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Postre' | 'Snack' | 'Bebida' | string;
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
  // ✅ CORREGIDO: Obtener TODAS las recetas (para admin) - Con manejo robusto de errores
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      console.log('📚 Obteniendo todas las recetas (admin)...');
      
      // Intentar primero con el endpoint específico de admin
      let data;
      try {
        data = await apiRequest('/recipes/all', {
          method: 'GET'
        });
        console.log('✅ Endpoint /recipes/all disponible');
        
        // Verificar si hay error de permisos en la respuesta
        if (data.success === false) {
          if (data.message?.includes('Acceso denegado') || data.message?.includes('permisos')) {
            console.log('❌ Usuario no tiene permisos para /recipes/all:', data.message);
            return await this.getAllRecipesAlternative();
          }
          throw new Error(data.message || 'Error del servidor');
        }
        
      } catch (endpointError: any) {
        console.log('⚠️ Endpoint /recipes/all no disponible, usando método alternativo...');
        console.log('❌ Error del endpoint:', endpointError.message);
        
        // Usar el método alternativo como fallback
        return await this.getAllRecipesAlternative();
      }
      
      // Manejar diferentes formatos de respuesta
      let recipes: any[] = [];
      
      if (Array.isArray(data)) {
        recipes = data;
      } else if (Array.isArray(data?.data)) {
        recipes = data.data;
      } else if (Array.isArray(data?.recipes)) {
        recipes = data.recipes;
      } else if (data?.success && Array.isArray(data.data)) {
        recipes = data.data;
      } else {
        console.warn('⚠️ Formato de respuesta inesperado, usando método alternativo:', data);
        return await this.getAllRecipesAlternative();
      }
      
      console.log(`✅ ${recipes.length} recetas totales obtenidas del endpoint /recipes/all`);
      
      // Validar y normalizar cada receta
      return recipes.map((recipe: any) => ({
        _id: recipe._id || recipe.id || `temp_${Date.now()}_${Math.random()}`,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        image: recipe.image,
        author: recipe.author || 'unknown',
        authorName: recipe.authorName || (recipe.author?.username) || 'Anónimo',
        likes: Array.isArray(recipe.likes) ? recipe.likes : [],
        likesCount: recipe.likesCount || recipe.likes?.length || 0,
        createdAt: recipe.createdAt || new Date().toISOString(),
        updatedAt: recipe.updatedAt
      }));
    } catch (error) {
      console.error('❌ Error crítico obteniendo todas las recetas:', error);
      
      // Último fallback: método alternativo
      console.log('🔄 Usando método alternativo como último recurso...');
      return await this.getAllRecipesAlternative();
    }
  },

  // ✅ MÉTODO ALTERNATIVO CORREGIDO: Para cuando el endpoint /recipes/all falle
  async getAllRecipesAlternative(): Promise<Recipe[]> {
    try {
      console.log('🔄 Usando método alternativo para obtener recetas...');
      
      // Obtener recetas de la comunidad con límite muy alto
      const communityData = await this.getCommunityRecipes(1, 1000);
      
      // Si tienes endpoint de mis recetas y eres admin, podrías combinarlas
      let myRecipes: Recipe[] = [];
      try {
        const myRecipesData = await this.getMyRecipes(1, 1000);
        myRecipes = myRecipesData.recipes || [];
      } catch (error) {
        console.log('⚠️ No se pudieron obtener mis recetas:', error);
      }
      
      // Combinar y eliminar duplicados
      const allRecipes = [
        ...(communityData.recipes || []), 
        ...myRecipes
      ];
      
      const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
        index === self.findIndex(r => r._id === recipe._id)
      );
      
      console.log(`✅ ${uniqueRecipes.length} recetas únicas obtenidas (método alternativo)`);
      return uniqueRecipes;
    } catch (error) {
      console.error('❌ Error en método alternativo:', error);
      
      // Si todo falla, retornar array vacío
      console.log('🔄 Retornando array vacío...');
      return [];
    }
  },

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

  // ✅ NUEVO MÉTODO: Actualizar receta existente
  async updateRecipe(recipeId: string, recipeData: any): Promise<Recipe> {
    try {
      console.log('📝 Actualizando receta:', recipeId);
      console.log('📦 Datos a actualizar:', recipeData);
      
      const data = await apiRequest(`/recipes/${recipeId}`, {
        method: 'PUT',
        data: recipeData
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Error al actualizar receta');
      }
      
      console.log('✅ Receta actualizada exitosamente');
      return data.recipe;
    } catch (error) {
      console.error('❌ Error actualizando receta:', error);
      throw error;
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
        _id: recipe._id || recipe.id || `temp_${Date.now()}_${Math.random()}`,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        image: recipe.image,
        author: recipe.author || 'unknown',
        authorName: recipe.authorName || 'Anónimo',
        likes: Array.isArray(recipe.likes) ? recipe.likes : [],
        likesCount: recipe.likesCount || recipe.likes?.length || 0,
        createdAt: recipe.createdAt || new Date().toISOString(),
        updatedAt: recipe.updatedAt
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
      
      // En caso de error, retornar estructura vacía pero válida
      return {
        recipes: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalRecipes: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
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
        _id: recipe._id || recipe.id || `temp_${Date.now()}_${Math.random()}`,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        image: recipe.image,
        author: recipe.author || 'unknown',
        authorName: recipe.authorName || 'Anónimo',
        likes: Array.isArray(recipe.likes) ? recipe.likes : [],
        likesCount: recipe.likesCount || recipe.likes?.length || 0,
        createdAt: recipe.createdAt || new Date().toISOString(),
        updatedAt: recipe.updatedAt
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
      
      // En caso de error, retornar estructura vacía pero válida
      return {
        recipes: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalRecipes: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
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
        _id: recipe._id || recipe.id || `temp_${Date.now()}_${Math.random()}`,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        image: recipe.image,
        author: recipe.author || 'unknown',
        authorName: recipe.authorName || 'Anónimo',
        likes: Array.isArray(recipe.likes) ? recipe.likes : [],
        likesCount: recipe.likesCount || recipe.likes?.length || 0,
        createdAt: recipe.createdAt || new Date().toISOString(),
        updatedAt: recipe.updatedAt
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
        _id: recipe._id || recipe.id || `temp_${Date.now()}_${Math.random()}`,
        title: recipe.title || 'Receta sin título',
        description: recipe.description || 'Descripción no disponible',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Medio',
        preparationTime: recipe.preparationTime || 30,
        servings: recipe.servings || 1,
        image: recipe.image,
        author: recipe.author || 'unknown',
        authorName: recipe.authorName || 'Anónimo',
        likes: Array.isArray(recipe.likes) ? recipe.likes : [],
        likesCount: recipe.likesCount || recipe.likes?.length || 0,
        createdAt: recipe.createdAt || new Date().toISOString(),
        updatedAt: recipe.updatedAt
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
      
      // En caso de error, retornar estructura vacía pero válida
      return {
        recipes: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalRecipes: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
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
  },

  // ✅ NUEVO: Función para diagnosticar endpoints disponibles
  async diagnoseEndpoints(): Promise<{ [key: string]: boolean }> {
    const endpoints = {
      '/recipes/all': false,
      '/recipes/community': false,
      '/recipes/my-recipes': false,
      '/recipes/search': false
    };

    console.log('🔍 Diagnosticando endpoints de recetas...');

    for (const [endpoint, _] of Object.entries(endpoints)) {
      try {
        await apiRequest(endpoint, { method: 'GET' });
        endpoints[endpoint as keyof typeof endpoints] = true;
        console.log(`✅ ${endpoint}: DISPONIBLE`);
      } catch (error) {
        console.log(`❌ ${endpoint}: NO DISPONIBLE`);
        endpoints[endpoint as keyof typeof endpoints] = false;
      }
    }

    return endpoints;
  }
};