// src/hooks/useNutritionWarnings.ts

import { useState, useEffect, useCallback } from 'react';
import { nutritionAnalysisService, NutritionAnalysisResult } from '../services/nutritionAnalysis';
import { useAuth } from '../context/AuthContext';
import { Recipe } from '../types'; // ✅ Usar el tipo Recipe de tu proyecto

interface UseNutritionWarningsResult {
  analysis: NutritionAnalysisResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  shouldWarn: boolean;
}

/**
 * Hook para obtener advertencias nutricionales de una receta
 * basadas en el perfil del usuario actual
 */
export const useNutritionWarnings = (recipe: Recipe | null): UseNutritionWarningsResult => {
  const { userProfile } = useAuth();
  const [analysis, setAnalysis] = useState<NutritionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyzeRecipe = useCallback(() => {
    if (!recipe || !userProfile) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Analizando receta:', recipe._id || 'sin ID');
      
      // ✅ Pasar userProfile tal como viene del contexto
      // El servicio ahora acepta cualquier estructura compatible
      const result = nutritionAnalysisService.analyzeRecipe(recipe, userProfile as any);
      
      console.log('✅ Análisis completado:', {
        riesgo: result.overallRisk,
        advertencias: result.warnings.length,
        segura: result.isSafe
      });

      setAnalysis(result);
    } catch (err) {
      console.error('❌ Error analizando receta:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [recipe, userProfile]);

  useEffect(() => {
    analyzeRecipe();
  }, [analyzeRecipe]);

  const refresh = useCallback(() => {
    analyzeRecipe();
  }, [analyzeRecipe]);

  const shouldWarn = analysis ? analysis.overallRisk > 25 : false;

  return {
    analysis,
    loading,
    error,
    refresh,
    shouldWarn
  };
};

/**
 * Hook para analizar múltiples recetas y filtrarlas por compatibilidad
 */
export const useRecipeFiltering = (recipes: Recipe[]) => {
  const { userProfile } = useAuth();
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(recipes);
  const [safeRecipes, setSafeRecipes] = useState<Recipe[]>([]);
  const [warningRecipes, setWarningRecipes] = useState<Recipe[]>([]);
  const [dangerRecipes, setDangerRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile || !recipes || recipes.length === 0) {
      setFilteredRecipes(recipes);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const safe: Recipe[] = [];
      const warning: Recipe[] = [];
      const danger: Recipe[] = [];

      recipes.forEach(recipe => {
        const analysis = nutritionAnalysisService.analyzeRecipe(recipe, userProfile as any);
        
        if (analysis.overallRisk <= 25) {
          safe.push(recipe);
        } else if (analysis.overallRisk <= 50) {
          warning.push(recipe);
        } else {
          danger.push(recipe);
        }
      });

      setSafeRecipes(safe);
      setWarningRecipes(warning);
      setDangerRecipes(danger);
      setFilteredRecipes(recipes);
    } catch (error) {
      console.error('❌ Error filtrando recetas:', error);
    } finally {
      setLoading(false);
    }
  }, [recipes, userProfile]);

  return {
    filteredRecipes,
    safeRecipes,
    warningRecipes,
    dangerRecipes,
    loading,
    stats: {
      total: recipes.length,
      safe: safeRecipes.length,
      warning: warningRecipes.length,
      danger: dangerRecipes.length,
    }
  };
};