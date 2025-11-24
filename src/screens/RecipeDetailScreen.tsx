// src/screens/RecipeDetailScreen.tsx - ACTUALIZADO

import { RouteProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { recipeAPI } from '../services/recipeAPI';
import { Recipe } from '../types';
import { RootStackParamList } from '../types/navigation';
import { translationService } from '../services/translation';
import { RecipeQA } from '../components/RecipeQ&A';
import { NutritionWarningCard } from '../components/NutritionWarning'; // ✅ NUEVO
import { useNutritionWarnings } from '../hooks/useNutritionWarnings'; // ✅ NUEVO

type RecipeDetailScreenRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

interface Props {
  route: RecipeDetailScreenRouteProp;
}

interface SafeAuthor {
  username?: string;
  email?: string;
  id?: string;
}

const getAuthorName = (recipe: Recipe): string => {
  if (recipe.authorName) {
    return recipe.authorName;
  }
  
  if (recipe.author) {
    if (typeof recipe.author === 'object') {
      const authorObj = recipe.author as SafeAuthor;
      if (authorObj.username) {
        return authorObj.username;
      }
    }
    
    if (typeof recipe.author === 'string') {
      return recipe.author;
    }
  }
  
  return 'Anónimo';
};

const getRecipeSource = (recipe: Recipe): string => {
  if (!recipe) {
    return 'Fuente desconocida';
  }

  if (recipe.author && typeof recipe.author === 'object') {
    const authorObj = recipe.author as SafeAuthor;
    if (authorObj.username === 'TheMealDB') {
      return 'TheMealDB';
    }
  }

  if (recipe._id && recipe._id.startsWith('themealdb-')) {
    return 'TheMealDB';
  }

  if (recipe.authorName === 'TheMealDB') {
    return 'TheMealDB';
  }

  if (recipe.authorName && recipe.authorName !== 'TheMealDB') {
    return `Receta de ${recipe.authorName}`;
  }

  return 'Receta de la comunidad';
};

export const RecipeDetailScreen: React.FC<Props> = ({ route }) => {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedRecipe, setTranslatedRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ NUEVO: Hook de advertencias nutricionales
  const { analysis, loading: analysisLoading, shouldWarn } = useNutritionWarnings(recipe);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Cargando receta con ID:', recipeId);

      if (!recipeId || recipeId.trim() === '') {
        throw new Error('ID de receta inválido');
      }

      console.log('🏠 Buscando receta en base de datos local');
      const recipeData = await recipeAPI.getRecipeById(recipeId);

      if (!recipeData) {
        throw new Error('Receta no encontrada');
      }

      const validatedRecipe = {
        ...recipeData,
        title: recipeData.title || 'Receta sin título',
        description: recipeData.description || 'Descripción no disponible',
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        category: recipeData.category || 'General',
        difficulty: recipeData.difficulty || 'Medio',
        preparationTime: recipeData.preparationTime || 30,
        servings: recipeData.servings || 1,
        likesCount: recipeData.likesCount || 0,
        authorName: recipeData.authorName || 'Anónimo'
      };

      setRecipe(validatedRecipe);
      console.log('✅ Receta cargada correctamente:', validatedRecipe.title);
    } catch (error) {
      console.error('❌ Error cargando receta:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al cargar la receta');
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!recipe) return;
    
    setIsTranslating(true);
    try {
      console.log('🔄 Iniciando traducción forzada...');
      
      const ingredientsToTranslate = recipe.ingredients || [];
      const instructionsToTranslate = recipe.instructions || [];

      console.log(`🥕 Traduciendo ${ingredientsToTranslate.length} ingredientes...`);
      console.log(`📝 Traduciendo ${instructionsToTranslate.length} instrucciones...`);

      const ingredientsTranslated = await translationService.translateIngredients(ingredientsToTranslate);
      const instructionsTranslated = await translationService.translateInstructions(instructionsToTranslate);
      
      setTranslatedRecipe({
        ...recipe,
        ingredients: ingredientsTranslated,
        instructions: instructionsTranslated
      });
      
      console.log('✅ Traducción forzada completada exitosamente');
    } catch (error) {
      console.error('❌ Error en traducción forzada:', error);
      setError('Error al traducir la receta');
    } finally {
      setIsTranslating(false);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return 'Fecha no disponible';
    }

    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  };

  const displayRecipe = translatedRecipe || recipe;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando receta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !displayRecipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error || 'Receta no encontrada'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRecipe}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {displayRecipe.image && (
          <Image 
            source={{ uri: displayRecipe.image }} 
            style={styles.recipeImage}
            resizeMode="cover"
            onError={() => console.log('❌ Error cargando imagen')}
          />
        )}

        {/* ✅ NUEVO: Tarjeta de Advertencias Nutricionales */}
        {!analysisLoading && analysis && (
          <NutritionWarningCard analysis={analysis} />
        )}

        <View style={styles.header}>
          <Text style={styles.title}>{displayRecipe.title}</Text>
          <Text style={styles.description}>{displayRecipe.description}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Tiempo</Text>
              <Text style={styles.metaValue}>⏱️ {displayRecipe.preparationTime || 'N/A'} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Dificultad</Text>
              <Text style={styles.metaValue}>📊 {displayRecipe.difficulty || 'No especificada'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Categoría</Text>
              <Text style={styles.metaValue}>🍽️ {displayRecipe.category || 'General'}</Text>
            </View>
          </View>

          <Text style={styles.author}>
            Creado por: {getAuthorName(displayRecipe)}
          </Text>

          {translationService.getCurrentLanguage() === 'es' && !translatedRecipe && (
            <TouchableOpacity 
              style={styles.translateButton} 
              onPress={handleTranslate}
              disabled={isTranslating}
            >
              <Text style={styles.translateButtonText}>
                {isTranslating ? 'Traduciendo...' : '🌍 Traducir Receta Completa'}
              </Text>
            </TouchableOpacity>
          )}

          {isTranslating && (
            <View style={styles.translatingIndicator}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.translatingText}>Traduciendo receta...</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Ingredientes</Text>
          {displayRecipe.ingredients && displayRecipe.ingredients.length > 0 ? (
            displayRecipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  • {ingredient.quantity || ''} {ingredient.unit || ''} {ingredient.name || 'Ingrediente sin nombre'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No hay ingredientes disponibles</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🍳 Instrucciones</Text>
          {displayRecipe.instructions && displayRecipe.instructions.length > 0 ? (
            displayRecipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{instruction.step || index + 1}</Text>
                  </View>
                  <Text style={styles.instructionStep}>Paso {instruction.step || index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>
                  {instruction.description || 'Instrucción no disponible'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No hay instrucciones disponibles</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Información</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Creado el:</Text>
            <Text style={styles.infoValue}>
              {formatDate(displayRecipe.createdAt)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fuente:</Text>
            <Text style={styles.infoValue}>
              {getRecipeSource(displayRecipe)}
            </Text>
          </View>
          {translatedRecipe && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Estado:</Text>
              <Text style={[styles.infoValue, styles.translatedStatus]}>
                ✅ Completamente traducida
              </Text>
            </View>
          )}
          {displayRecipe.likesCount !== undefined && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Likes:</Text>
              <Text style={styles.infoValue}>❤️ {displayRecipe.likesCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <RecipeQA recipeId={recipeId} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ✅ Los estilos permanecen iguales
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  recipeImage: {
    width: '100%',
    height: 250,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    margin: 16,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  author: {
    fontSize: 14,
    color: '#3B82F6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  translateButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  translateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  translatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  translatingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  ingredientItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  instructionItem: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    backgroundColor: '#3B82F6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  instructionStep: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  instructionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  translatedStatus: {
    color: '#10B981',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});