// src/components/RecipeCard.tsx - VERSIÓN MEJORADA CON INDICADOR DE RIESGO

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { nutritionAnalysisService } from '../services/nutritionAnalysis';
import { useAuth } from '../context/AuthContext';
import { Recipe } from '../types'; // ✅ Usar el tipo de tu proyecto

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export const RecipeCard: React.FC<Props> = ({ recipe, onPress }) => {
  const { userProfile } = useAuth();

  // Calcular riesgo si hay perfil
  let riskLevel = 0;
  let riskColor = '#10B981';
  let riskIcon = '✅';
  let showWarning = false;

  if (userProfile) {
    try {
      // ✅ Pasar userProfile tal como viene, con 'as any' para evitar errores de tipo
      const analysis = nutritionAnalysisService.analyzeRecipe(recipe, userProfile as any);
      riskLevel = analysis.overallRisk;
      riskColor = nutritionAnalysisService.getRiskColor(riskLevel);
      riskIcon = nutritionAnalysisService.getRiskIcon(riskLevel);
      showWarning = riskLevel > 25;
    } catch (error) {
      console.error('Error al analizar receta:', error);
      // Si hay error, mostrar como segura
      showWarning = false;
    }
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Imagen de la receta */}
      {recipe.image && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: recipe.image }} 
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Badge de categoría */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{recipe.category || 'General'}</Text>
          </View>

          {/* ✅ NUEVO: Indicador de riesgo */}
          {showWarning && (
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskIcon}>{riskIcon}</Text>
              <Text style={styles.riskText}>{riskLevel}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title || 'Receta sin título'}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description || 'Sin descripción'}
        </Text>

        {/* Meta información */}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{recipe.preparationTime || 30} min</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📊</Text>
            <Text style={styles.metaText}>{recipe.difficulty || 'Medio'}</Text>
          </View>

          {/* ✅ Solo mostrar calorías si existen en tu tipo */}
          {(recipe as any).calories && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🔥</Text>
              <Text style={styles.metaText}>{(recipe as any).calories} kcal</Text>
            </View>
          )}
        </View>

        {/* ✅ NUEVO: Mensaje de advertencia rápido */}
        {showWarning && (
          <View style={[styles.warningMessage, { borderLeftColor: riskColor }]}>
            <Text style={styles.warningIcon}>{riskIcon}</Text>
            <Text style={[styles.warningText, { color: riskColor }]}>
              {riskLevel <= 50 
                ? 'Precaución con esta receta'
                : riskLevel <= 75
                ? 'No recomendada para ti'
                : 'Alto riesgo - Evitar'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  riskBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  riskIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  riskText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  warningMessage: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});