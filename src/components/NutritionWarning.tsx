// src/components/NutritionWarning.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView
} from 'react-native';
import { NutritionAnalysisResult, NutritionWarning } from '../services/nutritionAnalysis';

interface Props {
  analysis: NutritionAnalysisResult;
  onDismiss?: () => void;
}

export const NutritionWarningCard: React.FC<Props> = ({ analysis, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    setExpanded(!expanded);
    Animated.timing(animation, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  const getRiskColor = (risk: number): string => {
    if (risk <= 25) return '#10B981'; // Verde
    if (risk <= 50) return '#F59E0B'; // Amarillo
    if (risk <= 75) return '#F97316'; // Naranja
    return '#EF4444'; // Rojo
  };

  const getRiskLabel = (risk: number): string => {
    if (risk <= 25) return 'COMPATIBLE';
    if (risk <= 50) return 'PRECAUCIÓN';
    if (risk <= 75) return 'CUIDADO';
    return 'ALTO RIESGO';
  };

  const getRiskIcon = (risk: number): string => {
    if (risk <= 25) return '✅';
    if (risk <= 50) return '⚠️';
    if (risk <= 75) return '⚠️';
    return '🚫';
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'allergy': return '🚨';
      case 'restriction': return '🚫';
      case 'health': return '💊';
      case 'goal': return '🎯';
      case 'calories': return '🔥';
      default: return '💡';
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'allergy': return 'ALERGIA';
      case 'restriction': return 'RESTRICCIÓN DIETÉTICA';
      case 'health': return 'CONDICIÓN DE SALUD';
      case 'goal': return 'META DE SALUD';
      case 'calories': return 'CALORÍAS';
      default: return 'PREFERENCIA';
    }
  };

  const riskColor = getRiskColor(analysis.overallRisk);

  return (
    <View style={[styles.container, { borderLeftColor: riskColor }]}>
      {/* Header Principal */}
      <TouchableOpacity 
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{getRiskIcon(analysis.overallRisk)}</Text>
          </View>
          
          <View style={styles.headerTextContainer}>
            <View style={styles.riskBadge}>
              <Text style={[styles.riskLabel, { color: riskColor }]}>
                {getRiskLabel(analysis.overallRisk)}
              </Text>
              <View style={[styles.riskPercentage, { backgroundColor: riskColor }]}>
                <Text style={styles.riskPercentageText}>
                  {analysis.overallRisk}%
                </Text>
              </View>
            </View>
            <Text style={styles.summary}>{analysis.summary}</Text>
          </View>

          <View style={styles.expandButton}>
            <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Contenido Expandible */}
      {expanded && (
        <View style={styles.detailsContainer}>
          {analysis.warnings.length > 0 ? (
            <ScrollView 
              style={styles.warningsScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {analysis.warnings.map((warning, index) => (
                <WarningItem key={index} warning={warning} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noWarnings}>
              <Text style={styles.noWarningsIcon}>🎉</Text>
              <Text style={styles.noWarningsText}>
                ¡Perfecto! Esta receta es totalmente compatible con tu perfil.
              </Text>
            </View>
          )}

          {onDismiss && (
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={onDismiss}
            >
              <Text style={styles.dismissButtonText}>Entendido</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

interface WarningItemProps {
  warning: NutritionWarning;
}

const WarningItem: React.FC<WarningItemProps> = ({ warning }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'allergy': return '🚨';
      case 'restriction': return '🚫';
      case 'health': return '💊';
      case 'goal': return '🎯';
      case 'calories': return '🔥';
      default: return '💡';
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'allergy': return 'ALERGIA';
      case 'restriction': return 'RESTRICCIÓN DIETÉTICA';
      case 'health': return 'CONDICIÓN DE SALUD';
      case 'goal': return 'META DE SALUD';
      case 'calories': return 'CALORÍAS';
      default: return 'PREFERENCIA';
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'danger': return '#EF4444';
      case 'warning': return '#F97316';
      case 'caution': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const levelColor = getLevelColor(warning.level);

  return (
    <View style={[styles.warningItem, { borderLeftColor: levelColor }]}>
      <TouchableOpacity 
        style={styles.warningHeader}
        onPress={() => setShowDetails(!showDetails)}
        activeOpacity={0.7}
      >
        <View style={styles.warningTitleContainer}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(warning.category)}</Text>
          <View style={styles.warningTitleText}>
            <Text style={[styles.categoryLabel, { color: levelColor }]}>
              {getCategoryLabel(warning.category)}
            </Text>
            <Text style={styles.riskText}>Riesgo: {warning.riskPercentage}%</Text>
          </View>
        </View>
        <Text style={styles.expandIconSmall}>{showDetails ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.warningDetails}>
          {/* Razones */}
          {warning.reasons.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>📋 Razones:</Text>
              {warning.reasons.map((reason, idx) => (
                <Text key={idx} style={styles.detailText}>• {reason}</Text>
              ))}
            </View>
          )}

          {/* Ingredientes Afectados */}
          {warning.affectedIngredients.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>🥘 Ingredientes afectados:</Text>
              <View style={styles.ingredientsContainer}>
                {warning.affectedIngredients.map((ingredient, idx) => (
                  <View key={idx} style={[styles.ingredientChip, { backgroundColor: levelColor + '20' }]}>
                    <Text style={[styles.ingredientText, { color: levelColor }]}>
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recomendaciones */}
          {warning.recommendations.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>💡 Recomendaciones:</Text>
              {warning.recommendations.map((rec, idx) => (
                <View key={idx} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  riskPercentage: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskPercentageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summary: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  expandButton: {
    padding: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  warningsScroll: {
    maxHeight: 400,
  },
  warningItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  warningTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  warningTitleText: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  riskText: {
    fontSize: 11,
    color: '#6B7280',
  },
  expandIconSmall: {
    fontSize: 12,
    color: '#6B7280',
  },
  warningDetails: {
    padding: 12,
    paddingTop: 0,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 2,
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  ingredientChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  ingredientText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationItem: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  recommendationText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  noWarnings: {
    alignItems: 'center',
    padding: 20,
  },
  noWarningsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noWarningsText: {
    fontSize: 16,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});