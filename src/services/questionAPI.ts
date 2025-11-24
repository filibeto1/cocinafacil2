import { apiRequest } from './api';
import { Question, CreateQuestionData, CreateAnswerData } from '../types/question';

export { Question, CreateQuestionData, CreateAnswerData };
export const questionAPI = {
  // Obtener preguntas de una receta
  async getQuestionsByRecipe(recipeId: string): Promise<Question[]> {
    try {
      console.log('🔍 Obteniendo preguntas para receta:', recipeId);
      const data = await apiRequest(`/questions/recipe/${recipeId}`, {
        method: 'GET'
      });
      
      console.log(`📦 Preguntas recibidas: ${data.questions?.length || 0}`);
      return data.questions || [];
    } catch (error) {
      console.error('❌ Error obteniendo preguntas:', error);
      throw error;
    }
  },

  // Crear nueva pregunta
  async createQuestion(questionData: CreateQuestionData): Promise<Question> {
    try {
      console.log('🆕 Creando nueva pregunta...');
      const data = await apiRequest('/questions', {
        method: 'POST',
        data: questionData
      });
      
      console.log('✅ Pregunta creada exitosamente');
      return data.question;
    } catch (error) {
      console.error('❌ Error creando pregunta:', error);
      throw error;
    }
  },

  // Agregar respuesta
  async addAnswer(questionId: string, answerData: CreateAnswerData): Promise<Question> {
    try {
      console.log('💬 Agregando respuesta a pregunta:', questionId);
      const data = await apiRequest(`/questions/${questionId}/answers`, {
        method: 'POST',
        data: answerData
      });
      
      console.log('✅ Respuesta agregada exitosamente');
      return data.question;
    } catch (error) {
      console.error('❌ Error agregando respuesta:', error);
      throw error;
    }
  },

  // Marcar pregunta como resuelta
  async markAsResolved(questionId: string): Promise<Question> {
    try {
      console.log('✅ Marcando pregunta como resuelta:', questionId);
      const data = await apiRequest(`/questions/${questionId}/resolve`, {
        method: 'PATCH'
      });
      
      console.log('✅ Pregunta marcada como resuelta');
      return data.question;
    } catch (error) {
      console.error('❌ Error marcando pregunta como resuelta:', error);
      throw error;
    }
  },

  // Eliminar pregunta
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando pregunta:', questionId);
      await apiRequest(`/questions/${questionId}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Pregunta eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando pregunta:', error);
      throw error;
    }
  }
};