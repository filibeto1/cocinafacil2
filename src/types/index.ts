// src/types/index.ts - VERSIÓN CORREGIDA Y UNIFICADA
export interface User {
  id: string;
  username: string;
  email: string;
  role?: 'admin' | 'user' | 'moderator';
  isActive?: boolean;
  profile?: UserProfileData;
}

// ✅ DEFINICIÓN PRINCIPAL DE UserProfileData
export interface UserProfileData {
  personalInfo?: {
    age?: number;
    weight?: number;
    height?: number;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | string; // Permitir string también
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    dailyCalorieGoal?: number;
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
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Difficulty = 'Fácil' | 'Medio' | 'Difícil' | 'Media';
export type Category = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Postre' | 'Snack' | 'Bebida' | 'Mariscos' | 'Ensalada' | 'General' | 'Carne de Res' | 'Pollo' | 'Pasta' | 'Vegetariano';

export interface Recipe {
  _id?: string;
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
  nutritionInfo?: NutritionInfo;
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

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Home: undefined;
  Recipes: { category?: string } | undefined;
  Profile: undefined;
  Admin: undefined;
  RecipeDetail: { recipeId: string };
  CreateRecipe: undefined;
  CommunityRecipes: undefined;
  MyRecipes: undefined;
};