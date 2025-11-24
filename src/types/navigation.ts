// src/types/navigation.ts - ACTUALIZADO
import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  // Rutas de autenticación
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  
  // Rutas principales (solo autenticadas)
  Main: undefined;
  Home: undefined;
  Recipes: { category?: string } | undefined;
  RecipesList: { category?: string } | undefined;
  RecipeDetail: { recipeId: string };
  CreateRecipe: undefined;
  Profile: undefined;
  
  // Pantalla de carga
  Loading: undefined;
};

// Tipos para las props de navegación
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type RecipesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Recipes'>;
export type RecipeDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecipeDetail'>;
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
export type CreateRecipeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateRecipe'>;
export type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

// Props para los componentes que usan navegación
export interface WithNavigationProps {
  navigation: HomeScreenNavigationProp | 
               RecipesScreenNavigationProp | 
               RecipeDetailScreenNavigationProp |
               LoginScreenNavigationProp |
               RegisterScreenNavigationProp |
               CreateRecipeScreenNavigationProp |
               ProfileScreenNavigationProp;
}