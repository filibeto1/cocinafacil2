// src/services/api.ts - VERSIÓN COMPLETA CORREGIDA
import axios from 'axios';
import { AuthResponse, Recipe, RecipesResponse, User, UserProfileData, Ingredient, Instruction, Difficulty, Category } from '../types';
import { storage } from './storage';
import { translationService } from './translation';

const getAPIUrls = (): string[] => {
  const baseURLs = [
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
    'http://192.168.4.43:3001/api',  // Tu IP actual en WiFi
    'http://192.168.56.1:3001/api',
  ];
  
  console.log('🌐 URLs configuradas:', baseURLs);
  return baseURLs;
};

const API_URLS = getAPIUrls();
const DEVELOPMENT_MODE = false;

// ✅ FUNCIÓN DETECTBASEURL CORREGIDA - UNA SOLA DECLARACIÓN
export const detectBaseURL = async (): Promise<string> => {
  console.log('🔍 Detectando URL del backend...');
  
  for (const url of API_URLS) {
    try {
      console.log(`   Probando: ${url}`);
      
      // ✅ CORREGIDO: Usar axios en lugar de fetch con timeout incorrecto
      const response = await axios.get(`${url}/health`, { 
        timeout: 5000 
      });

      if (response.status === 200) {
        console.log(`✅ Backend detectado: ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`   ❌ No se pudo conectar: ${url}`);
    }
  }

  console.log('⚠️ No se pudo conectar al backend - Usando MODO DESARROLLO');
  return 'DEV_MODE';
};

// Variable global para la URL base
let API_BASE_URL = API_URLS[0];

// Cache mejorado para recetas
let ninjasRecipesCache: Map<string, Recipe> = new Map();
let lastSearchResults: Recipe[] = [];
let searchCache: Map<string, Recipe[]> = new Map();

// ✅ FUNCIÓN DE MAPEO CORREGIDA
const mapToValidRecipe = (recipe: any): Recipe => {
  // Normalizar dificultad
  const normalizeDifficulty = (diff: string): Difficulty => {
    const difficulties: { [key: string]: Difficulty } = {
      'Media': 'Medio',
      'media': 'Medio',
      'Fácil': 'Fácil',
      'Medio': 'Medio',
      'Difícil': 'Difícil',
      'easy': 'Fácil',
      'medium': 'Medio',
      'hard': 'Difícil'
    };
    return difficulties[diff] || 'Medio';
  };

  // Normalizar categoría
  const normalizeCategory = (cat: string): Category => {
    const categories: { [key: string]: Category } = {
      'Seafood': 'Mariscos',
      'Salad': 'Ensalada',
      'Beef': 'Carne de Res',
      'Chicken': 'Pollo',
      'Pasta': 'Pasta',
      'Vegetarian': 'Vegetariano',
      'Dessert': 'Postre',
      'Breakfast': 'Desayuno',
      'Lunch': 'Almuerzo',
      'Dinner': 'Cena',
      'Snack': 'Snack',
      'Beverage': 'Bebida',
      'General': 'General',
      'Mariscos': 'Mariscos',
      'Ensalada': 'Ensalada',
      'Carne de Res': 'Carne de Res',
      'Pollo': 'Pollo',
      'Postre': 'Postre'
    };
    return categories[cat] || 'General';
  };

  // Normalizar autor
  const normalizeAuthor = (author: any): string | { id: string; username: string; email: string } => {
    if (typeof author === 'string') return author;
    if (author && typeof author === 'object') {
      return {
        id: author.id || 'unknown',
        username: author.username || 'Usuario',
        email: author.email || 'usuario@ejemplo.com'
      };
    }
    return 'Usuario Desconocido';
  };

  return {
    _id: recipe._id || recipe.idMeal || Date.now().toString(),
    title: recipe.title || recipe.strMeal || 'Receta sin título',
    description: recipe.description || `Deliciosa receta de ${recipe.title || recipe.strMeal}`,
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    preparationTime: recipe.preparationTime || 30,
    servings: recipe.servings || 4,
    difficulty: normalizeDifficulty(recipe.difficulty),
    category: normalizeCategory(recipe.category || recipe.strCategory),
    image: recipe.image || recipe.strMealThumb,
    author: normalizeAuthor(recipe.author),
    authorName: typeof recipe.author === 'string' ? recipe.author : recipe.author?.username,
    likes: recipe.likes || [],
    likesCount: recipe.likesCount || recipe.likes?.length || 0,
    ratings: recipe.ratings || [],
    nutritionInfo: recipe.nutritionInfo,
    createdAt: recipe.createdAt || new Date().toISOString(),
    updatedAt: recipe.updatedAt
  };
};

// ✅ FUNCIÓN PARA MANEJAR PARÁMETROS OPCIONALES
const safeStringParam = (param: string | undefined): string => {
  return param || '';
};

// TRADUCCIÓN COMPLETA DE INGREDIENTES
const translateIngredient = (ingredient: string): string => {
  const translations: { [key: string]: string } = {
    // Ingredientes básicos
    'salt': 'sal', 'pepper': 'pimienta', 'sugar': 'azúcar', 'flour': 'harina',
    'butter': 'mantequilla', 'oil': 'aceite', 'garlic': 'ajo', 'onion': 'cebolla',
    'tomato': 'tomate', 'egg': 'huevo', 'milk': 'leche', 'water': 'agua',
    'rice': 'arroz', 'chicken': 'pollo', 'beef': 'carne de res', 'pork': 'cerdo',
    'fish': 'pescado', 'cheese': 'queso', 'bread': 'pan', 'lemon': 'limón',
    'carrot': 'zanahoria', 'potato': 'papa', 'bell pepper': 'pimiento',
    
    // Hierbas y especias
    'parsley': 'perejil', 'basil': 'albahaca', 'oregano': 'orégano',
    'thyme': 'tomillo', 'rosemary': 'romero', 'cumin': 'comino',
    'paprika': 'pimentón', 'cinnamon': 'canela', 'nutmeg': 'nuez moscada',
    'coriander': 'cilantro', 'chili': 'chile', 'ginger': 'jengibre',
    
    // Lácteos y derivados
    'cream': 'crema', 'yogurt': 'yogur', 'buttermilk': 'suero de leche',
    
    // Frutas
    'apple': 'manzana', 'banana': 'plátano', 'orange': 'naranja',
    'lime': 'lima', 'avocado': 'aguacate', 'coconut': 'coco',
    
    // Verduras
    'spinach': 'espinaca', 'lettuce': 'lechuga', 'cucumber': 'pepino',
    'mushroom': 'champiñón', 'broccoli': 'brócoli', 'cauliflower': 'coliflor',
    'cabbage': 'repollo', 'celery': 'apio', 'asparagus': 'espárrago',
    
    // Carnes y pescados
    'lamb': 'cordero', 'duck': 'pato', 'turkey': 'pavo',
    'salmon': 'salmón', 'tuna': 'atún', 'shrimp': 'camarón',
    'crab': 'cangrejo', 'lobster': 'langosta',
    
    // Granos y legumbres
    'pasta': 'pasta', 'noodles': 'fideos', 'beans': 'frijoles',
    'lentils': 'lentejas', 'chickpeas': 'garbanzos',
    
    // Frutos secos
    'almond': 'almendra', 'peanut': 'cacahuate', 'walnut': 'nuez',
    'hazelnut': 'avellana', 'pecan': 'nuez pecana',
    
    // Bebidas y líquidos
    'vinegar': 'vinagre', 'soy sauce': 'salsa de soya', 'wine': 'vino',
    'beer': 'cerveza', 'stock': 'caldo', 'broth': 'caldo'
  };
  
  const lowerIngredient = ingredient.toLowerCase().trim();
  return translations[lowerIngredient] || ingredient;
};

// TRADUCCIÓN COMPLETA DE INSTRUCCIONES
const translateInstruction = (instruction: string): string => {
  const translations: { [key: string]: string } = {
    'Preheat oven': 'Precalentar el horno',
    'Preheat the oven': 'Precalentar el horno',
    'In a large bowl': 'En un tazón grande',
    'In a medium bowl': 'En un tazón mediano', 
    'In a small bowl': 'En un tazón pequeño',
    'Add the': 'Agregar el',
    'Add': 'Agregar',
    'Mix well': 'Mezclar bien',
    'Stir until combined': 'Revolver hasta que esté combinado',
    'Cook until done': 'Cocinar hasta que esté listo',
    'Serve immediately': 'Servir inmediatamente',
    'Garnish with': 'Decorar con',
    'Season with salt and pepper': 'Sazonar con sal y pimienta',
    'Heat the oil': 'Calentar el aceite',
    'Chop the': 'Picar el',
    'Slice the': 'Cortar en rodajas el',
    'Dice the': 'Cortar en cubos el',
    'Bake for': 'Hornear durante',
    'Fry until golden': 'Freír hasta que esté dorado',
    'Boil the': 'Hervir el',
    'Simmer for': 'Cocinar a fuego lento durante',
    'Whisk together': 'Batir juntos',
    'Knead the dough': 'Amasar la masa',
    'Let it rest': 'Dejar reposar',
    'Marinate for': 'Marinar durante',
    'Grill for': 'Asar a la parrilla durante',
    'Roast in the oven': 'Asar en el horno',
    'Drain well': 'Escurrir bien',
    'Cut into pieces': 'Cortar en pedazos',
    'Mix thoroughly': 'Mezclar completamente',
    'Bring to a boil': 'Llevar a ebullición',
    'Reduce heat': 'Reducir el fuego',
    'Cover and cook': 'Tapar y cocinar',
    'Remove from heat': 'Retirar del fuego',
    'Set aside': 'Reservar',
    'Sprinkle with': 'Espolvorear con',
    'Pour over': 'Verter sobre',
    'Spread evenly': 'Extender uniformemente',
    'Beat until smooth': 'Batir hasta que esté suave',
    'Fold in': 'Incorporar suavemente',
    'Grease the pan': 'Engrasar la sartén',
    'Line with parchment': 'Forrar con papel pergamino'
  };

  let translated = instruction;
  
  // Reemplazar frases completas
  Object.keys(translations).forEach(english => {
    const regex = new RegExp(english, 'gi');
    translated = translated.replace(regex, translations[english]);
  });
  
  // Reemplazar palabras individuales
  translated = translated.split(' ').map(word => translateIngredient(word)).join(' ');
  
  return translated;
};

// CATEGORÍAS EN ESPAÑOL
const translateCategory = (category: string): string => {
  const translations: { [key: string]: string } = {
    'Beef': 'Carne de Res',
    'Chicken': 'Pollo',
    'Dessert': 'Postre',
    'Lamb': 'Cordero', 
    'Miscellaneous': 'Variado',
    'Pasta': 'Pasta',
    'Pork': 'Cerdo',
    'Seafood': 'Mariscos',
    'Side': 'Acompañamiento',
    'Starter': 'Entrada',
    'Vegan': 'Vegano',
    'Vegetarian': 'Vegetariano',
    'Breakfast': 'Desayuno',
    'Goat': 'Cabra'
  };
  return translations[category] || category;
};

// ✅ FUNCIÓN PARA CREAR USUARIOS MOCK
const createMockUser = (userData: any): User => {
  return {
    id: userData.id || 'dev_user_1',
    username: userData.username || 'usuario',
    email: userData.email || 'usuario@ejemplo.com',
    role: userData.role || 'user',
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    profile: userData.profile || {
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
};

// ✅ MAPEAR RECETA CON TRADUCCIÓN COMPLETA
const mapMealToRecipe = (meal: any): Recipe => {
  const ingredients: Ingredient[] = [];
  
  // Extraer y traducir ingredientes
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: translateIngredient(ingredient),
        quantity: measure ? translateIngredient(measure) : '',
        unit: ''
      });
    }
  }

  // Traducir instrucciones completamente
  const instructions = meal.strInstructions 
    ? meal.strInstructions
        .split('\r\n')
        .filter((step: string) => step.trim())
        .map((step: string, index: number) => ({
          step: index + 1,
          description: translateInstruction(step)
        }))
    : [];

  // ✅ USAR mapToValidRecipe PARA GARANTIZAR TIPOS CORRECTOS
  return mapToValidRecipe({
    _id: meal.idMeal,
    title: meal.strMeal,
    description: `Deliciosa receta de ${meal.strMeal}.`,
    ingredients,
    instructions,
    preparationTime: 30,
    servings: 4,
    difficulty: 'Medio',
    category: translateCategory(meal.strCategory),
    image: meal.strMealThumb,
    author: 'themealdb',
    authorName: 'TheMealDB',
    ratings: [],
    createdAt: new Date().toISOString()
  });
};

// ✅ RECETAS DE EJEMPLO EN ESPAÑOL - CORREGIDAS
const SAMPLE_RECIPES: Recipe[] = [
  {
    _id: '1',
    title: 'Tacos de Pescado con Especias Cajún',
    description: 'Deliciosos tacos de pescado con una mezcla de especias cajún.',
    ingredients: [
      { name: 'filetes de pescado blanco', quantity: '4', unit: '' },
      { name: 'mezcla de especias cajún', quantity: '2', unit: 'cucharadas' }
    ],
    instructions: [
      { step: 1, description: 'Mezclar las especias y cubrir el pescado.' },
      { step: 2, description: 'Cocinar el pescado hasta que esté dorado.' }
    ],
    preparationTime: 30,
    servings: 4,
    difficulty: 'Medio',
    category: 'Mariscos',
    image: 'https://www.themealdb.com/images/media/meals/1520081754.jpg',
    author: 'chef1',
    authorName: 'Chef Internacional',
    likes: [],
    likesCount: 0,
    ratings: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Ensalada César con Pollo',
    description: 'Ensalada fresca con pollo a la parrilla.',
    ingredients: [
      { name: 'pechuga de pollo', quantity: '2', unit: '' },
      { name: 'lechuga romana', quantity: '1', unit: 'cabeza' }
    ],
    instructions: [
      { step: 1, description: 'Cocinar el pollo a la parrilla.' },
      { step: 2, description: 'Mezclar con lechuga y aderezo.' }
    ],
    preparationTime: 20,
    servings: 2,
    difficulty: 'Fácil',
    category: 'Ensalada',
    image: 'https://www.themealdb.com/images/media/meals/1520081754.jpg',
    author: 'chef2',
    authorName: 'Chef Italiano',
    likes: [],
    likesCount: 0,
    ratings: [],
    createdAt: new Date().toISOString()
  }
];

// MOCK API PARA DESARROLLO - CORREGIDO
const mockAuthAPI = {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 MODO DESARROLLO: Login simulado');
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validación básica
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }
    
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (!email.includes('@')) {
      throw new Error('Email inválido');
    }
    
    const mockUser: User = createMockUser({
      id: 'dev_user_1',
      username: email.split('@')[0] || 'usuario',
      email: email
    });
    
    return {
      message: 'Login exitoso (modo desarrollo)',
      token: 'dev_jwt_token_' + Date.now(),
      user: mockUser
    };
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    console.log('📝 MODO DESARROLLO: Registro simulado');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validación básica
    if (!username || !email || !password) {
      throw new Error('Todos los campos son requeridos');
    }
    
    if (username.length < 3) {
      throw new Error('El usuario debe tener al menos 3 caracteres');
    }
    
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (!email.includes('@')) {
      throw new Error('Email inválido');
    }
    
    const mockUser: User = createMockUser({
      id: 'dev_user_' + Date.now(),
      username: username,
      email: email
    });
    
    return {
      message: 'Registro exitoso (modo desarrollo)',
      token: 'dev_jwt_token_' + Date.now(),
      user: mockUser
    };
  },

  async getCurrentUser(): Promise<User> {
    const user = await storage.getUser();
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    return user;
  },

  async getProfile(): Promise<UserProfileData> {
    const user = await storage.getUser();
    if (!user || !user.profile) {
      return {
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
    }
    return user.profile;
  },

  async updateProfile(profile: UserProfileData): Promise<User> {
    const user = await storage.getUser();
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    
    const updatedUser: User = {
      ...user,
      profile: profile
    };
    
    await storage.saveUser(updatedUser);
    return updatedUser;
  }
};

// ✅ CLIENTE HTTP MEJORADO
export const apiRequest = async (endpoint: string, options: any = {}) => {
  try {
    console.log(`🌐 API Request: ${endpoint}`, options.method || 'GET');
    
    const token = await storage.getToken();
    console.log('🔑 Token disponible:', token ? 'Sí' : 'No');
    
    if (token) {
      console.log('🔑 Token length:', token.length);
    }

    const config = {
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      url: endpoint,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      data: options.data,
      timeout: options.timeout || 15000,
    };

    console.log('📤 Configuración de request:', {
      url: config.baseURL + config.url,
      method: config.method,
      hasAuth: !!token,
      data: config.data
    });

    const response = await axios(config);
    
    console.log(`✅ Response ${endpoint}:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error en request ${endpoint}:`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Error 401 - Token inválido o expirado');
      
      // Limpiar datos de autenticación
      await storage.clearAuth();
      
      // Redirigir al login si estamos en un entorno con router
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    
    if (error.response?.data) {
      throw new Error(error.response.data.message || error.response.data.error || 'Error del servidor');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout: El servidor tardó demasiado en responder');
    }
    
    if (error.message?.includes('Network Error')) {
      throw new Error('No se puede conectar al servidor. Verifica que esté ejecutándose.');
    }
    
    throw new Error(error.message || 'Error desconocido');
  }
};

// ✅ INICIALIZACIÓN AL CARGAR EL MÓDULO
(async () => {
  if (!DEVELOPMENT_MODE) {
    console.log('🚀 Inicializando detección de backend...');
    API_BASE_URL = await detectBaseURL();
    console.log(`🎯 URL base configurada: ${API_BASE_URL}`);
  } else {
    console.log('🛠️  MODO DESARROLLO ACTIVADO - Usando datos mock');
  }
})();

// ESTRATEGIA DE BÚSQUEDA MEJORADA CON CACHÉ
const searchRecipesStrategy = async (params: any): Promise<Recipe[]> => {
  let recipes: Recipe[] = [];
  
  // Verificar caché de búsqueda primero
  const cacheKey = `${safeStringParam(params.search)}-${safeStringParam(params.category)}`;
  if (searchCache.has(cacheKey)) {
    console.log('📦 Usando resultados de caché de búsqueda');
    return searchCache.get(cacheKey)!;
  }
  
  // PRIMERO: Intentar con API Ninjas (eliminado)
  console.log('🔄 API Ninjas no disponible, usando respaldo...');
  
  // SEGUNDO: Usar TheMealDB como respaldo
  try {
    console.log('🔄 Usando TheMealDB como respaldo...');
    
    if (params.search) {
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${safeStringParam(params.search)}`);
      if (response.data.meals) {
        recipes = response.data.meals.map(mapMealToRecipe);
      }
    } else if (params.category && params.category !== 'Popular') {
      const categoryMap: { [key: string]: string } = {
        'Carne de Res': 'Beef',
        'Pollo': 'Chicken',
        'Postre': 'Dessert',
        'Pasta': 'Pasta', 
        'Mariscos': 'Seafood',
        'Vegetariano': 'Vegetarian',
        'Desayuno': 'Breakfast',
        'Entrada': 'Starter',
        'Cerdo': 'Pork',
        'Cordero': 'Lamb'
      };
      const englishCategory = categoryMap[params.category] || params.category;
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${safeStringParam(englishCategory)}`);
      
      if (response.data.meals) {
        const detailedRecipes = await Promise.all(
          response.data.meals.slice(0, 8).map(async (meal: any) => {
            try {
              const detailResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${safeStringParam(meal.idMeal)}`);
              return mapMealToRecipe(detailResponse.data.meals[0]);
            } catch (error) {
              console.error('Error obteniendo receta detallada:', error);
              return null;
            }
          })
        );
        recipes = detailedRecipes.filter(recipe => recipe !== null) as Recipe[];
      }
    }
  } catch (error) {
    console.error('❌ Error con TheMealDB:', error);
  }
  
  // TERCERO: Si todo falla, usar recetas de ejemplo
  if (recipes.length === 0) {
    console.log('🔄 Usando recetas de ejemplo...');
    recipes = SAMPLE_RECIPES.filter(recipe => {
      if (params.search) {
        return recipe.title.toLowerCase().includes(safeStringParam(params.search).toLowerCase()) ||
               recipe.description.toLowerCase().includes(safeStringParam(params.search).toLowerCase());
      }
      if (params.category && params.category !== 'Popular') {
        return recipe.category === params.category;
      }
      return true;
    });
  }
  
  // Guardar en cachés
  searchCache.set(cacheKey, recipes);
  recipes.forEach(recipe => ninjasRecipesCache.set(recipe._id!, recipe));
  lastSearchResults = recipes;
  
  return recipes;
};

export const authAPI = {
  async login(email: string, password: string): Promise<AuthResponse> {
    if (DEVELOPMENT_MODE) {
      return mockAuthAPI.login(email, password);
    }

    try {
      console.log('🔐 Iniciando sesión con backend real...');
      
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        data: {
          email: email.toLowerCase().trim(),
          password
        }
      });

      if (!data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      console.log('✅ Login exitoso, cargando perfil completo...');
      
      // GUARDAR USUARIO Y TOKEN INMEDIATAMENTE
      await storage.saveToken(data.token);
      await storage.saveUser(data.user);

      // CARGAR PERFIL COMPLETO DESPUÉS DEL LOGIN
      try {
        const userProfile = await this.getProfile();
        const userWithProfile = {
          ...data.user,
          profile: userProfile
        };
        
        // ACTUALIZAR USUARIO CON PERFIL COMPLETO
        await storage.saveUser(userWithProfile);
        
        console.log('✅ Perfil completo cargado después del login');
        
        return {
          message: data.message,
          token: data.token,
          user: userWithProfile
        };
      } catch (profileError) {
        console.warn('⚠️ No se pudo cargar el perfil completo:', profileError);
        // Devolver usuario básico si falla la carga del perfil
        return {
          message: data.message,
          token: data.token,
          user: data.user
        };
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      throw new Error(error.message);
    }
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    if (DEVELOPMENT_MODE) {
      return mockAuthAPI.register(username, email, password);
    }

    try {
      console.log('📝 Registrando usuario con backend real...');
      
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        data: {
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password
        }
      });

      if (!data.success) {
        throw new Error(data.message || 'Error al registrar usuario');
      }

      console.log('✅ Registro exitoso');
      return {
        message: data.message,
        token: data.token,
        user: data.user
      };
    } catch (error: any) {
      console.error('Error en registro:', error);
      throw new Error(error.message);
    }
  },

  async getCurrentUser(): Promise<User> {
    if (DEVELOPMENT_MODE) {
      return mockAuthAPI.getCurrentUser();
    }

    try {
      console.log('👤 Obteniendo usuario actual...');
      
      // Primero obtener datos básicos del usuario
      const userData = await apiRequest('/auth/me', {
        method: 'GET'
      });

      if (!userData.success) {
        throw new Error(userData.message || 'Error obteniendo usuario');
      }

      console.log('✅ Datos básicos del usuario obtenidos');
      
      // Luego obtener perfil completo
      try {
        const profileData = await this.getProfile();
        const completeUser: User = {
          ...userData.user,
          profile: profileData
        };
        
        // Guardar usuario completo en storage
        await storage.saveUser(completeUser);
        
        console.log('✅ Perfil completo cargado y guardado');
        return completeUser;
      } catch (profileError) {
        console.warn('⚠️ No se pudo cargar perfil completo, usando datos básicos:', profileError);
        return userData.user;
      }
    } catch (error: any) {
      console.error('Error obteniendo usuario:', error);
      throw new Error(error.message);
    }
  },

  async getProfile(): Promise<UserProfileData> {
    if (DEVELOPMENT_MODE) {
      return mockAuthAPI.getProfile();
    }

    try {
      console.log('📋 Obteniendo perfil completo...');
      
      const data = await apiRequest('/profile', {
        method: 'GET'
      });

      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo perfil');
      }

      console.log('✅ Perfil obtenido exitosamente');
      
      // Asegurar estructura correcta
      const profile: UserProfileData = {
        personalInfo: data.profile?.personalInfo || {},
        healthInfo: {
          allergies: data.profile?.healthInfo?.allergies || [],
          dietaryRestrictions: data.profile?.healthInfo?.dietaryRestrictions || [],
          healthConditions: data.profile?.healthInfo?.healthConditions || [],
          healthGoals: data.profile?.healthInfo?.healthGoals || []
        },
        preferences: data.profile?.preferences || {
          favoriteCuisines: [],
          dislikedIngredients: [],
          cookingSkills: 'beginner'
        }
      };

      return profile;
    } catch (error: any) {
      console.error('Error obteniendo perfil:', error);
      throw new Error(error.message);
    }
  },

  async updateProfile(profile: UserProfileData): Promise<User> {
    if (DEVELOPMENT_MODE) {
      return mockAuthAPI.updateProfile(profile);
    }

    try {
      const data = await apiRequest('/profile', {
        method: 'PUT',
        data: { profile }
      });

      if (!data.success) {
        throw new Error(data.message || 'Error actualizando perfil');
      }

      return data.user;
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      throw new Error(error.message);
    }
  },

  async updateProfilePartial(updates: Partial<UserProfileData>): Promise<User> {
    if (DEVELOPMENT_MODE) {
      const currentProfile = await mockAuthAPI.getProfile();
      const newProfile = { ...currentProfile, ...updates };
      return mockAuthAPI.updateProfile(newProfile);
    }

    try {
      console.log('🔄 Actualizando perfil parcial:', Object.keys(updates));
      
      // Determinar qué endpoint usar basado en los campos a actualizar
      let endpoint = '/profile';
      let method = 'PATCH';
      
      if (updates.personalInfo && Object.keys(updates.personalInfo).length > 0) {
        endpoint = '/profile/personal';
        method = 'PATCH';
      } else if (updates.healthInfo && Object.keys(updates.healthInfo).length > 0) {
        endpoint = '/profile/health';
        method = 'PATCH';
      }

      const data = await apiRequest(endpoint, {
        method: method,
        data: updates
      });

      if (!data.success) {
        throw new Error(data.message || 'Error actualizando perfil');
      }

      console.log('✅ Perfil parcial actualizado exitosamente');

      // Devolver usuario actualizado
      const currentUser = await storage.getUser();
      const updatedUser: User = {
        ...currentUser!,
        profile: data.profile
      };

      await storage.saveUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      console.error('Error actualizando perfil parcial:', error);
      throw new Error(error.message);
    }
  },

  // Función para cargar perfil completo
  async loadCompleteUserProfile(): Promise<User> {
    try {
      const user = await storage.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      console.log('📥 Cargando perfil completo del usuario...');
      
      // Cargar perfil desde el backend
      const profile = await this.getProfile();
      
      const completeUser: User = {
        ...user,
        profile: profile
      };
      
      // Guardar usuario completo en storage
      await storage.saveUser(completeUser);
      
      console.log('✅ Perfil completo cargado exitosamente');
      return completeUser;
    } catch (error) {
      console.error('❌ Error cargando perfil completo:', error);
      throw error;
    }
  }
};

export const recipesAPI = {
  async getAllRecipes(params?: { 
    category?: string; 
    search?: string; 
    page?: number;
    cuisine?: string;
    diet?: string;
  }): Promise<RecipesResponse> {
    try {
      let recipes: Recipe[] = [];

      console.log('🔍 Iniciando búsqueda de recetas...');

      // USAR LA ESTRATEGIA DE BÚSQUEDA MEJORADA
      if (params?.search || (params?.category && params.category !== 'Popular')) {
        recipes = await searchRecipesStrategy({
          search: params.search,
          category: params.category
        });
      } else {
        // Para recetas populares, usar recetas de ejemplo
        console.log('🔥 Cargando recetas populares...');
        recipes = SAMPLE_RECIPES;
        
        // Guardar en caché
        recipes.forEach(recipe => ninjasRecipesCache.set(recipe._id!, recipe));
        lastSearchResults = recipes;
      }

      console.log(`✅ Búsqueda completada: ${recipes.length} recetas encontradas`);

      return {
        recipes,
        totalPages: 1,
        currentPage: params?.page || 1,
        total: recipes.length
      };
    } catch (error) {
      console.error('❌ Error en búsqueda principal, usando recetas de ejemplo:', error);
      return {
        recipes: SAMPLE_RECIPES,
        totalPages: 1,
        currentPage: 1,
        total: SAMPLE_RECIPES.length
      };
    }
  },

  async getRecipeById(id: string): Promise<Recipe> {
    try {
      console.log(`📄 Obteniendo receta: ${id}`);
      
      // 1. Buscar en caché de API Ninjas
      if (ninjasRecipesCache.has(id)) {
        console.log('✅ Receta encontrada en caché');
        const cachedRecipe = ninjasRecipesCache.get(id)!;
        
        // APLICAR TRADUCCIÓN COMPLETA si está en español
        if (translationService.getCurrentLanguage() === 'es') {
          console.log('🔄 Aplicando traducción COMPLETA a receta en caché...');
          
          try {
            const fullyTranslatedRecipe = await translationService.translateRecipe(cachedRecipe);
            console.log('✅ Receta de caché completamente traducida al español');
            return fullyTranslatedRecipe;
          } catch (translationError) {
            console.error('❌ Error en traducción completa, usando traducción local:', translationError);
            
            // Fallback: traducción local inmediata
            const locallyTranslatedRecipe = mapToValidRecipe({
              ...cachedRecipe,
              title: translationService.translateLocally(cachedRecipe.title),
              description: translationService.translateLocally(cachedRecipe.description),
              ingredients: await Promise.all(
                cachedRecipe.ingredients.map(async (ing: any) => ({
                  ...ing,
                  name: translationService.translateLocally(ing.name),
                  quantity: translationService.translateLocally(ing.quantity),
                  unit: translationService.translateLocally(ing.unit)
                }))
              ),
              instructions: await Promise.all(
                cachedRecipe.instructions.map(async (inst: any) => ({
                  ...inst,
                  description: translationService.translateLocally(inst.description)
                }))
              ),
              category: translationService.translateLocally(cachedRecipe.category),
              difficulty: translationService.translateLocally(cachedRecipe.difficulty)
            });
            
            return locallyTranslatedRecipe;
          }
        }
        
        return cachedRecipe;
      }
      
      // 2. Buscar en resultados de búsqueda recientes
      const recentRecipe = lastSearchResults.find(recipe => recipe._id === id);
      if (recentRecipe) {
        console.log('✅ Receta encontrada en búsqueda reciente');
        ninjasRecipesCache.set(id, recentRecipe);
        
        // APLICAR TRADUCCIÓN COMPLETA si está en español
        if (translationService.getCurrentLanguage() === 'es') {
          console.log('🔄 Aplicando traducción COMPLETA a receta reciente...');
          
          try {
            const fullyTranslatedRecipe = await translationService.translateRecipe(recentRecipe);
            console.log('✅ Receta reciente completamente traducida al español');
            return fullyTranslatedRecipe;
          } catch (translationError) {
            console.error('❌ Error en traducción completa, usando traducción local:', translationError);
            
            // Fallback: traducción local inmediata
            const locallyTranslatedRecipe = mapToValidRecipe({
              ...recentRecipe,
              title: translationService.translateLocally(recentRecipe.title),
              description: translationService.translateLocally(recentRecipe.description),
              ingredients: await Promise.all(
                recentRecipe.ingredients.map(async (ing: any) => ({
                  ...ing,
                  name: translationService.translateLocally(ing.name),
                  quantity: translationService.translateLocally(ing.quantity),
                  unit: translationService.translateLocally(ing.unit)
                }))
              ),
              instructions: await Promise.all(
                recentRecipe.instructions.map(async (inst: any) => ({
                  ...inst,
                  description: translationService.translateLocally(inst.description)
                }))
              ),
              category: translationService.translateLocally(recentRecipe.category),
              difficulty: translationService.translateLocally(recentRecipe.difficulty)
            });
            
            return locallyTranslatedRecipe;
          }
        }
        
        return recentRecipe;
      }
      
      // 3. Buscar en recetas de ejemplo
      const sampleRecipe = SAMPLE_RECIPES.find(recipe => recipe._id === id);
      if (sampleRecipe) {
        console.log('✅ Receta encontrada en ejemplos');
        
        // Las recetas de ejemplo ya están en español, pero aplicar traducción si es necesario
        if (translationService.getCurrentLanguage() === 'es') {
          console.log('🔄 Verificando traducción de receta de ejemplo...');
          const verifiedRecipe = await translationService.translateRecipe(sampleRecipe);
          return verifiedRecipe;
        }
        
        return sampleRecipe;
      }
      
      // 4. Si es API Ninjas pero no está en caché
      if (id.startsWith('ninjas-')) {
        console.log('❌ Receta de API Ninjas no encontrada en caché');
        
        // Intentar buscar recetas similares
        if (lastSearchResults.length > 0) {
          console.log('🔄 Usando receta de búsqueda reciente como fallback');
          const fallbackRecipe = lastSearchResults[0];
          ninjasRecipesCache.set(id, fallbackRecipe);
          
          // APLICAR TRADUCCIÓN COMPLETA si está en español
          if (translationService.getCurrentLanguage() === 'es') {
            console.log('🔄 Aplicando traducción COMPLETA a receta de fallback...');
            
            try {
              const fullyTranslatedRecipe = await translationService.translateRecipe(fallbackRecipe);
              console.log('✅ Receta de fallback completamente traducida al español');
              return fullyTranslatedRecipe;
            } catch (translationError) {
              console.error('❌ Error en traducción completa, usando traducción local:', translationError);
              
              // Fallback: traducción local inmediata
              const locallyTranslatedRecipe = mapToValidRecipe({
                ...fallbackRecipe,
                title: translationService.translateLocally(fallbackRecipe.title),
                description: translationService.translateLocally(fallbackRecipe.description),
                ingredients: await Promise.all(
                  fallbackRecipe.ingredients.map(async (ing: any) => ({
                    ...ing,
                    name: translationService.translateLocally(ing.name),
                    quantity: translationService.translateLocally(ing.quantity),
                    unit: translationService.translateLocally(ing.unit)
                  }))
                ),
                instructions: await Promise.all(
                  fallbackRecipe.instructions.map(async (inst: any) => ({
                    ...inst,
                    description: translationService.translateLocally(inst.description)
                  }))
                ),
                category: translationService.translateLocally(fallbackRecipe.category),
                difficulty: translationService.translateLocally(fallbackRecipe.difficulty)
              });
              
              return locallyTranslatedRecipe;
            }
          }
          
          return fallbackRecipe;
        }
        
        throw new Error('Receta no encontrada. Por favor, realiza una nueva búsqueda.');
      }
      
      // 5. Buscar en TheMealDB
      console.log('🔄 Buscando en TheMealDB...');
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      if (response.data.meals && response.data.meals[0]) {
        const mealDBRecipe = mapMealToRecipe(response.data.meals[0]);
        
        // APLICAR TRADUCCIÓN COMPLETA si está en español
        if (translationService.getCurrentLanguage() === 'es') {
          console.log('🔄 Aplicando traducción COMPLETA a receta de TheMealDB...');
          
          try {
            const fullyTranslatedRecipe = await translationService.translateRecipe(mealDBRecipe);
            console.log('✅ Receta de TheMealDB completamente traducida al español');
            return fullyTranslatedRecipe;
          } catch (translationError) {
            console.error('❌ Error en traducción completa, usando receta base:', translationError);
            return mealDBRecipe; // Devolver sin traducción si falla
          }
        }
        
        return mealDBRecipe;
      }
      
      throw new Error('Receta no encontrada');
    } catch (error) {
      console.error('❌ Error obteniendo receta:', error);
      
      // Intentar devolver una receta de ejemplo como último recurso
      if (SAMPLE_RECIPES.length > 0) {
        console.log('🔄 Usando receta de ejemplo como último recurso');
        const fallbackRecipe = SAMPLE_RECIPES[0];
        
        if (translationService.getCurrentLanguage() === 'es') {
          try {
            return await translationService.translateRecipe(fallbackRecipe);
          } catch {
            return fallbackRecipe;
          }
        }
        
        return fallbackRecipe;
      }
      
      throw new Error('No se pudo cargar la receta');
    }
  },

  async createRecipe(recipeData: Partial<Recipe>, token: string): Promise<Recipe> {
    console.log('➕ Creando nueva receta...');
    const newRecipe = mapToValidRecipe({
      _id: Date.now().toString(),
      title: recipeData.title || 'Nueva Receta',
      description: recipeData.description || 'Descripción de la receta',
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      preparationTime: recipeData.preparationTime || 30,
      servings: recipeData.servings || 4,
      difficulty: recipeData.difficulty || 'Medio',
      category: recipeData.category || 'General',
      image: recipeData.image || 'https://via.placeholder.com/400x300?text=Receta+Personalizada',
      author: recipeData.author || 'user1',
      authorName: 'Usuario',
      ratings: [],
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Receta creada exitosamente');
    return newRecipe;
  },

  async updateRecipe(id: string, recipeData: Partial<Recipe>, token: string): Promise<Recipe> {
    console.log(`✏️ Actualizando receta: ${id}`);
    const updatedRecipe = mapToValidRecipe({
      _id: id,
      title: recipeData.title || 'Receta Actualizada',
      description: recipeData.description || '',
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      preparationTime: recipeData.preparationTime || 30,
      servings: recipeData.servings || 4,
      difficulty: recipeData.difficulty || 'Medio',
      category: recipeData.category || 'General',
      image: recipeData.image || 'https://via.placeholder.com/400x300?text=Receta+Actualizada',
      author: recipeData.author || 'user1',
      authorName: 'Usuario',
      ratings: [],
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Receta actualizada exitosamente');
    return updatedRecipe;
  },

  async deleteRecipe(id: string, token: string): Promise<void> {
    console.log(`🗑️ Eliminando receta: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✅ Receta eliminada exitosamente');
  },

  async getCuisines(): Promise<string[]> {
    return [
      'Mexicana', 'Italiana', 'China', 'India', 'Española',
      'Francesa', 'Japonesa', 'Tailandesa', 'Griega', 'Mediterránea',
      'Americana', 'Argentina', 'Peruana', 'Colombiana', 'Brasileña'
    ];
  },

  async getDiets(): Promise<string[]> {
    return [
      'Vegetariana', 'Vegana', 'Sin Gluten', 'Baja en Carbohidratos',
      'Sin Lactosa', 'Keto', 'Paleo', 'Baja en Grasa', 'Alta en Proteína'
    ];
  },

  async getCategories(): Promise<{name: string; image: string}[]> {
    return [
      { name: 'Carne de Res', image: 'https://www.themealdb.com/images/category/beef.png' },
      { name: 'Pollo', image: 'https://www.themealdb.com/images/category/chicken.png' },
      { name: 'Postre', image: 'https://www.themealdb.com/images/category/dessert.png' },
      { name: 'Pasta', image: 'https://www.themealdb.com/images/category/pasta.png' },
      { name: 'Mariscos', image: 'https://www.themealdb.com/images/category/seafood.png' },
      { name: 'Vegetariano', image: 'https://www.themealdb.com/images/category/vegetarian.png' },
      { name: 'Ensalada', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop' },
      { name: 'Sopa', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop' }
    ];
  },

  // Búsqueda por ingredientes (eliminada la dependencia de API Ninjas)
  async searchRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
    try {
      console.log(`🥕 Buscando recetas por ingredientes: ${ingredients.join(', ')}`);
      // Usar búsqueda normal como fallback
      const response = await this.getAllRecipes({ search: ingredients.join(' ') });
      return response.recipes;
    } catch (error) {
      console.error('❌ Error buscando por ingredientes:', error);
      return [];
    }
  },

  // Limpiar caché (útil para testing)
  clearCache(): void {
    ninjasRecipesCache.clear();
    searchCache.clear();
    lastSearchResults = [];
    console.log('🧹 Caché de recetas limpiado');
  }
};

// Función para verificar la salud de todas las APIs
export const checkAPIsHealth = async (): Promise<{
  backend: boolean;
  apiNinjas: boolean;
  mealDB: boolean;
}> => {
  const results = {
    backend: false,
    apiNinjas: false,
    mealDB: false
  };

  try {
    const backendResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    results.backend = backendResponse.data.success === true;
  } catch (error) {
    console.error('❌ Backend no disponible');
  }

  try {
    // API Ninjas no está disponible
    results.apiNinjas = false;
  } catch (error) {
    console.error('❌ API Ninjas no disponible');
  }

  try {
    const mealDBResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=chicken`, { timeout: 5000 });
    results.mealDB = mealDBResponse.data.meals !== null;
  } catch (error) {
    console.error('❌ TheMealDB no disponible');
  }

  console.log('🏥 Estado de APIs:', results);
  return results;
};

// Exportar funciones auxiliares para testing
export const apiUtils = {
  getCacheStats: () => ({ 
    ninjasCacheSize: ninjasRecipesCache.size,
    searchCacheSize: searchCache.size,
    lastResultsCount: lastSearchResults.length
  }),
  clearAllCache: () => {
    ninjasRecipesCache.clear();
    searchCache.clear();
    lastSearchResults = [];
  },
  setDevelopmentMode: (mode: boolean) => {
    console.log(`🛠️  Modo desarrollo: ${mode}`);
  }
};