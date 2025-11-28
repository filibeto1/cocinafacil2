// src/components/RecipeQA.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { questionAPI } from '../services/questionAPI';
import type { Question, CreateQuestionData, CreateAnswerData } from '../services/questionAPI';
import { useAuth } from '../context/AuthContext';


interface Props {
  recipeId: string;
}

// ✅ CORREGIDO: Interface Answer actualizada
interface Answer {
  _id?: string;
  author: string;
  authorName: string;
  createdAt: string;
  answer: string;
}

export const RecipeQA: React.FC<Props> = ({ recipeId }) => {
  const { user } = useAuth();
const { canDelete, canManageContent } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswers, setNewAnswers] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [recipeId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await questionAPI.getQuestionsByRecipe(recipeId);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error cargando preguntas:', error);
      Alert.alert('Error', 'No se pudieron cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    setRefreshing(false);
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) {
      Alert.alert('Error', 'Por favor escribe una pregunta');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para hacer una pregunta');
      return;
    }

    try {
      setSubmitting(true);
      const questionData: CreateQuestionData = {
        recipeId,
        question: newQuestion
      };

      const createdQuestion = await questionAPI.createQuestion(questionData);
      setQuestions(prev => [createdQuestion, ...prev]);
      setNewQuestion('');
      
      Alert.alert('Éxito', 'Pregunta publicada');
    } catch (error) {
      console.error('Error creando pregunta:', error);
      Alert.alert('Error', 'No se pudo publicar la pregunta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const answerText = newAnswers[questionId];
    
    if (!answerText?.trim()) {
      Alert.alert('Error', 'Por favor escribe una respuesta');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para responder');
      return;
    }

    try {
      setSubmitting(true);
      const answerData: CreateAnswerData = {
        answer: answerText
      };

      const updatedQuestion = await questionAPI.addAnswer(questionId, answerData);
      
      setQuestions(prev => 
        prev.map(q => q._id === questionId ? updatedQuestion : q)
      );
      
      setNewAnswers(prev => ({ ...prev, [questionId]: '' }));
      
      Alert.alert('Éxito', 'Respuesta publicada');
    } catch (error) {
      console.error('Error agregando respuesta:', error);
      Alert.alert('Error', 'No se pudo publicar la respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkResolved = async (questionId: string) => {
    try {
      const updatedQuestion = await questionAPI.markAsResolved(questionId);
      setQuestions(prev => 
        prev.map(q => q._id === questionId ? updatedQuestion : q)
      );
    } catch (error) {
      console.error('Error marcando como resuelta:', error);
      Alert.alert('Error', 'No se pudo marcar como resuelta');
    }
  };

  // ✅ CORREGIDO: Función para eliminar pregunta con verificación mejorada
  const handleDeleteQuestion = async (questionId: string, authorId: string) => {
    // Verificar permisos antes de mostrar alerta
    if (!canDelete(authorId) && !canManageContent()) {
      Alert.alert('Error', 'No tienes permisos para eliminar esta pregunta');
      return;
    }

    Alert.alert(
      'Eliminar Pregunta',
      '¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await questionAPI.deleteQuestion(questionId);
              setQuestions(prev => prev.filter(q => q._id !== questionId));
              Alert.alert('Éxito', 'Pregunta eliminada correctamente');
            } catch (error) {
              console.error('Error eliminando pregunta:', error);
              Alert.alert('Error', 'No se pudo eliminar la pregunta');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // ✅ CORREGIDO: Función para verificar si el usuario puede ver acciones de admin
  const canShowAdminActions = (authorId: string) => {
    return canDelete(authorId) || canManageContent();
  };

  const renderQuestion = (item: Question) => (
    <View key={item._id} style={[
      styles.questionCard,
      item.isResolved && styles.resolvedCard
    ]}>
      <View style={styles.questionHeader}>
        <View style={styles.questionAuthor}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.questionDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {item.isResolved && (
            <View style={styles.resolvedBadge}>
              <Text style={styles.resolvedText}>✅ Resuelta</Text>
            </View>
          )}
          {/* ✅ CORREGIDO: Mostrar badge de admin solo si tiene permisos */}
          {canShowAdminActions(item.author) && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>👑 Admin</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.questionText}>{item.question}</Text>

      {/* Respuestas */}
      {item.answers.length > 0 && (
        <View style={styles.answersContainer}>
          <Text style={styles.answersTitle}>Respuestas:</Text>
          {item.answers.map((answer: Answer, index: number) => (
            <View key={answer._id || `answer-${index}`} style={styles.answerCard}>
              <View style={styles.answerHeader}>
                <Text style={styles.answerAuthor}>{answer.authorName}</Text>
                <Text style={styles.answerDate}>
                  {formatDate(answer.createdAt)}
                </Text>
              </View>
              <Text style={styles.answerText}>{answer.answer}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Formulario de respuesta */}
      {!item.isResolved && user && (
        <View style={styles.answerForm}>
          <TextInput
            style={styles.answerInput}
            placeholder="Escribe tu respuesta..."
            value={newAnswers[item._id!] || ''}
            onChangeText={(text) => setNewAnswers(prev => ({
              ...prev,
              [item._id!]: text
            }))}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.submitAnswerButton}
            onPress={() => handleSubmitAnswer(item._id!)}
            disabled={submitting}
          >
            <Text style={styles.submitAnswerText}>
              {submitting ? 'Enviando...' : 'Responder'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        {/* Botón para marcar como resuelta (autor o admin) */}
        {!item.isResolved && user && (user.id === item.author || canManageContent()) && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => handleMarkResolved(item._id!)}
          >
            <Text style={styles.resolveText}>✅ Marcar Resuelta</Text>
          </TouchableOpacity>
        )}

        {/* ✅ CORREGIDO: Botón eliminar con verificación de permisos */}
        {canShowAdminActions(item.author) && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteQuestion(item._id!, item.author)}
          >
            <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando preguntas...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>💬 Preguntas y Respuestas</Text>

        {/* Formulario para nueva pregunta */}
        {user ? (
          <View style={styles.questionForm}>
            <TextInput
              style={styles.questionInput}
              placeholder="¿Tienes alguna pregunta sobre esta receta?"
              value={newQuestion}
              onChangeText={setNewQuestion}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={styles.submitQuestionButton}
              onPress={handleSubmitQuestion}
              disabled={submitting}
            >
              <Text style={styles.submitQuestionText}>
                {submitting ? 'Enviando...' : 'Publicar Pregunta'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>
              👤 Inicia sesión para hacer preguntas o responder
            </Text>
          </View>
        )}
      </View>

      {/* Lista de preguntas */}
      {questions.length > 0 ? (
        <View style={styles.questionsList}>
          {questions.map(renderQuestion)}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>🤔</Text>
          <Text style={styles.emptyStateTitle}>No hay preguntas todavía</Text>
          <Text style={styles.emptyStateSubtitle}>
            Sé el primero en preguntar sobre esta receta
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// Los estilos se mantienen igual...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  questionsList: {
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionForm: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 12,
  },
  submitQuestionButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitQuestionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loginPrompt: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  loginText: {
    color: '#3B82F6',
    fontSize: 14,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resolvedCard: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionAuthor: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  questionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  resolvedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resolvedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  adminBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  answersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  answersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  answerCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  answerAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  answerDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  answerText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  answerForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 60,
    marginBottom: 8,
  },
  submitAnswerButton: {
    backgroundColor: '#10B981',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitAnswerText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  resolveButton: {
    backgroundColor: '#10B981',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  resolveText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});