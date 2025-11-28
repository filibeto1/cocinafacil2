import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal
} from 'react-native';
import { adminAPI } from '../services/adminAPI';
import { Recipe, Question } from '../types';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type TabType = 'recipes' | 'questions' | 'reports';

export const ContentModerationScreen: React.FC = () => {
  const { canManageContent } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('recipes');
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'recipes':
          const recipes = await adminAPI.getPendingRecipes();
          setPendingRecipes(recipes);
          break;
        case 'questions':
          const questions = await adminAPI.getPendingQuestions();
          setPendingQuestions(questions);
          break;
        case 'reports':
          const reportsData = await adminAPI.getReports();
          setReports(reportsData);
          break;
      }
    } catch (error) {
      console.error('Error cargando contenido:', error);
      Alert.alert('Error', 'No se pudo cargar el contenido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveRecipe = async (recipeId: string, approved: boolean) => {
    try {
      setActionLoading(recipeId);
      await adminAPI.approveRecipe(recipeId, approved);
      
      // Remover de la lista
      setPendingRecipes(pendingRecipes.filter(recipe => recipe._id !== recipeId));
      
      Alert.alert('Éxito', `Receta ${approved ? 'aprobada' : 'rechazada'} correctamente`);
    } catch (error) {
      console.error('Error aprobando receta:', error);
      Alert.alert('Error', 'No se pudo procesar la receta');
    } finally {
      setActionLoading(null);
    }
  };

  const handleModerateQuestion = async (questionId: string, approved: boolean) => {
    try {
      setActionLoading(questionId);
      await adminAPI.moderateQuestion(questionId, approved, 'Moderación manual');
      
      // Remover de la lista
      setPendingQuestions(pendingQuestions.filter(q => q._id !== questionId));
      
      Alert.alert('Éxito', `Pregunta ${approved ? 'aprobada' : 'rechazada'} correctamente`);
    } catch (error) {
      console.error('Error moderando pregunta:', error);
      Alert.alert('Error', 'No se pudo procesar la pregunta');
    } finally {
      setActionLoading(null);
    }
  };

  const renderRecipesTab = () => (
    <View style={styles.tabContent}>
      {pendingRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-circle" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No hay recetas pendientes</Text>
          <Text style={styles.emptyStateText}>
            Todas las recetas han sido moderadas correctamente
          </Text>
        </View>
      ) : (
        pendingRecipes.map((recipe) => (
          <View key={recipe._id} style={styles.contentCard}>
            <View style={styles.contentHeader}>
              <Text style={styles.contentTitle}>{recipe.title}</Text>
              <Text style={styles.contentAuthor}>
                por {typeof recipe.author === 'object' ? recipe.author.username : 'Usuario'}
              </Text>
            </View>
            
            <Text style={styles.contentDescription} numberOfLines={3}>
              {recipe.description}
            </Text>
            
            <View style={styles.contentMeta}>
              <Text style={styles.contentMetaText}>
                ⏱ {recipe.preparationTime} min • 🍽 {recipe.servings} porciones
              </Text>
              <Text style={styles.contentMetaText}>
                🏷 {recipe.category} • 🎯 {recipe.difficulty}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApproveRecipe(recipe._id!, true)}
                disabled={actionLoading === recipe._id}
              >
                <MaterialCommunityIcons name="check" size={20} color="#10B981" />
                <Text style={styles.actionButtonText}>Aprobar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleApproveRecipe(recipe._id!, false)}
                disabled={actionLoading === recipe._id}
              >
                <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>

            {actionLoading === recipe._id && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderQuestionsTab = () => (
    <View style={styles.tabContent}>
      {pendingQuestions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-circle" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No hay preguntas pendientes</Text>
          <Text style={styles.emptyStateText}>
            Todas las preguntas han sido moderadas correctamente
          </Text>
        </View>
      ) : (
        pendingQuestions.map((question) => (
          <View key={question._id} style={styles.contentCard}>
            <View style={styles.contentHeader}>
              <Text style={styles.contentTitle}>Pregunta sobre receta</Text>
              <Text style={styles.contentAuthor}>
                por {question.user?.username || 'Usuario'}
              </Text>
            </View>
            
            <Text style={styles.contentDescription}>
              {question.question}
            </Text>
            
            <View style={styles.contentMeta}>
              <Text style={styles.contentMetaText}>
                📅 {new Date(question.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleModerateQuestion(question._id!, true)}
                disabled={actionLoading === question._id}
              >
                <MaterialCommunityIcons name="check" size={20} color="#10B981" />
                <Text style={styles.actionButtonText}>Aprobar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleModerateQuestion(question._id!, false)}
                disabled={actionLoading === question._id}
              >
                <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>

            {actionLoading === question._id && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="shield-check" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No hay reportes pendientes</Text>
          <Text style={styles.emptyStateText}>
            No hay contenido reportado que requiera atención
          </Text>
        </View>
      ) : (
        reports.map((report) => (
          <View key={report.id} style={styles.contentCard}>
            <Text style={styles.reportTitle}>Contenido Reportado</Text>
            <Text style={styles.reportReason}>Motivo: {report.reason}</Text>
            <Text style={styles.reportDetails}>
              Tipo: {report.type} • Estado: {report.status}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  if (!canManageContent()) {
    return (
      <View style={styles.accessDenied}>
        <MaterialCommunityIcons name="shield-off" size={64} color="#EF4444" />
        <Text style={styles.accessDeniedTitle}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedText}>
          No tienes permisos para acceder a la moderación de contenido
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
          onPress={() => setActiveTab('recipes')}
        >
          <MaterialCommunityIcons 
            name="food" 
            size={20} 
            color={activeTab === 'recipes' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>
            Recetas ({pendingRecipes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'questions' && styles.activeTab]}
          onPress={() => setActiveTab('questions')}
        >
          <MaterialCommunityIcons 
            name="comment-question" 
            size={20} 
            color={activeTab === 'questions' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'questions' && styles.activeTabText]}>
            Preguntas ({pendingQuestions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={20} 
            color={activeTab === 'reports' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Reportes ({reports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadContent} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Cargando contenido...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'recipes' && renderRecipesTab()}
            {activeTab === 'questions' && renderQuestionsTab()}
            {activeTab === 'reports' && renderReportsTab()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#3B82F6',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  tabContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  contentAuthor: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  contentDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  contentMeta: {
    marginBottom: 12,
  },
  contentMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#ECFDF5',
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  reportReason: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  reportDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
});