  export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user' | 'moderator'; // ✅ OBLIGATORIO
    isActive: boolean;
    profile?: UserProfileData;
    createdAt?: string;
    updatedAt?: string;
  }

  // src/types/index.ts - CORREGIDO
  export interface UserProfileData {
    personalInfo: {
      age?: number;                    // ✅ Hacer opcional
      weight?: number;                 // ✅ Hacer opcional  
      height?: number;                 // ✅ Hacer opcional
      gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | string; // ✅ Hacer opcional
      activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
      dailyCalorieGoal?: number;       // ✅ Hacer opcional
      avatar?: string;
    };
    healthInfo: {
      allergies: string[];
      dietaryRestrictions: string[];
      healthConditions: string[];
      healthGoals: string[];
    };
    preferences: {
      favoriteCuisines: string[];
      dislikedIngredients: string[];
      cookingSkills: 'beginner' | 'intermediate' | 'advanced';
    };
    bmi?: number;
    lastUpdated?: string;
    createdAt?: string;
  }

  export interface Ingredient {
    name: string;
    quantity: string;
    unit: string;
  }

  export interface Instruction {
    step: number;
    description: string;
  }

  export interface Rating {
    user: string;
    rating: number;
    comment?: string;
    createdAt?: string;
  }

  export interface NutritionInfo {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  }

  export type Difficulty = 'Fácil' | 'Medio' | 'Difícil';
export type Category = 
  | 'Desayuno' | 'Almuerzo' | 'Cena' | 'Postre' | 'Snack' | 'Bebida' 
  | 'Mariscos' | 'Ensalada' | 'General' | 'Carne de Res' | 'Pollo' 
  | 'Pasta' | 'Vegetariano' | 'Vegano' | 'Sin Gluten' | 'Bajo en Carbohidratos'
  | string; // ✅ AGREGAR string para permitir cualquier categoría

  export interface Recipe {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    ingredients: Ingredient[];
    instructions: Instruction[];
    preparationTime: number;
    servings: number;
    difficulty: Difficulty;
    category: Category;
    image?: string;
    author: string | { id: string; username: string; email: string };
    authorName?: string;
    likes: string[];
    likesCount: number;
    ratings?: Rating[];
    averageRating?: number;
    nutritionInfo?: NutritionInfo;
    tags?: string[];
    isPublic?: boolean;
    isApproved?: boolean; // ✅ PARA MODERACIÓN
    createdAt?: string;
    updatedAt?: string;
  }

  export interface AuthResponse {
    message: string;
    token: string;
    user: User;
  }

  export interface RecipesResponse {
    recipes: Recipe[];
    totalPages: number; 
    currentPage: number;
    total: number;
  }

  export interface ApiError {
    message: string;
    status?: number;
    code?: string;
  }

  // ✅ TIPOS PARA ADMINISTRACIÓN
  export interface AdminStats {
    totalUsers: number;
    totalRecipes: number;
    totalQuestions: number;
    pendingModeration: number;
    activeAdmins: number;
  }

  export interface UserManagement {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user' | 'moderator';
    isActive: boolean;
    recipeCount: number;
    joinedAt: string;
    lastLogin?: string;
  }

  // ✅ PARAM LIST COMPLETO
  export type RootStackParamList = {
    // Auth
    Login: undefined;
    Register: undefined;
    
    // Main Tabs
    Main: undefined;
    Home: undefined;
    Recipes: { category?: string } | undefined;
    Profile: undefined;
    Admin: undefined;
    CreateRecipe: undefined;
    
    // Stack Screens
    RecipeDetail: { recipeId: string };
    CommunityRecipes: undefined;
    MyRecipes: undefined;
    
    // Admin Screens (si se necesitan)
    UserManagement: undefined;
    ContentModeration: undefined;
    SystemSettings: undefined;
  };

  // ✅ TIPOS PARA PREGUNTAS Y RESPUESTAS
  export interface Question {
    _id?: string;
    id?: string;
    recipeId: string;
    userId: string;
    user?: {
      id: string;
      username: string;
      email: string;
    };
    question: string;
    answers: Answer[];
    isAnswered: boolean;
    createdAt: string;
    updatedAt: string;
  }

  export interface Answer {
    _id?: string;
    id?: string;
    questionId: string;
    userId: string;
    user?: {
      id: string;
      username: string;
      email: string;
    };
    answer: string;
    isHelpful?: boolean;
    helpfulVotes?: string[];
    createdAt: string;
    updatedAt: string;
  }

  // ✅ TIPOS PARA NOTIFICACIONES
  export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    action?: {
      type: string;
      data: any;
    };
  }

  // ✅ ENUMS PARA MEJOR TIPADO
  export enum UserRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    USER = 'user'
  }

  export enum ActivityLevel {
    SEDENTARY = 'sedentary',
    LIGHT = 'light',
    MODERATE = 'moderate',
    ACTIVE = 'active',
    VERY_ACTIVE = 'very_active'
  }

  export enum CookingSkills {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced'
  }