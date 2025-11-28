// src/screens/EditRecipeScreen.tsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { recipeAPI, Recipe as APIRecipe } from '../services/recipeAPI';
import { Recipe, Ingredient, Instruction } from '../types';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const EditRecipeScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { canManageContent } = useAuth();
  
  const { recipeId } = route.params as { recipeId: string };
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ingredientModalVisible, setIngredientModalVisible] = useState(false);
  const [instructionModalVisible, setInstructionModalVisible] = useState(false);
  
  // Estados para formularios modales
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', unit: '' });
  const [newInstruction, setNewInstruction] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const recipeData = await recipeAPI.getRecipeById(recipeId);
      setRecipe(recipeData);
    } catch (error) {
      console.error('Error cargando receta:', error);
      Alert.alert('Error', 'No se pudo cargar la receta');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIONES HELPER PARA ACTUALIZACIÓN EN TIEMPO REAL
  const updateRecipeField = (field: string, value: any) => {
    if (!recipe) return;
    setRecipe({ ...recipe, [field]: value });
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    if (!recipe) return;
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setRecipe({ ...recipe, ingredients: updatedIngredients });
  };

  const updateInstruction = (index: number, description: string) => {
    if (!recipe) return;
    const updatedInstructions = [...recipe.instructions];
    updatedInstructions[index] = { ...updatedInstructions[index], description };
    setRecipe({ ...recipe, instructions: updatedInstructions });
  };

  // ✅ FUNCIÓN handleSave CORREGIDA
  const handleSave = async () => {
    if (!recipe) return;

    try {
      setSaving(true);
      
      // Preparar datos para enviar
      const updateData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        preparationTime: recipe.preparationTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        category: recipe.category,
        image: recipe.image || ''
      };

      console.log('💾 Guardando cambios...', updateData);
      
      // ✅ LLAMAR AL MÉTODO REAL DE ACTUALIZACIÓN
      await recipeAPI.updateRecipe(recipe._id!, updateData);
      
      Alert.alert('✅ Éxito', 'Receta actualizada correctamente');
      navigation.goBack();
      
    } catch (error) {
      console.error('❌ Error guardando receta:', error);
      Alert.alert('❌ Error', 'No se pudo guardar la receta: ' + (error as any).message);
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = () => {
    if (!recipe || !newIngredient.name.trim()) return;
    
    const updatedIngredients = [...recipe.ingredients, {
      name: newIngredient.name,
      quantity: newIngredient.quantity,
      unit: newIngredient.unit
    }];
    
    setRecipe({ ...recipe, ingredients: updatedIngredients });
    setNewIngredient({ name: '', quantity: '', unit: '' });
    setIngredientModalVisible(false);
  };

  const removeIngredient = (index: number) => {
    if (!recipe) return;
    
    const updatedIngredients = recipe.ingredients.filter((_, i) => i !== index);
    setRecipe({ ...recipe, ingredients: updatedIngredients });
  };

  const addInstruction = () => {
    if (!recipe || !newInstruction.trim()) return;
    
    const updatedInstructions = [...recipe.instructions, {
      step: recipe.instructions.length + 1,
      description: newInstruction
    }];
    
    setRecipe({ ...recipe, instructions: updatedInstructions });
    setNewInstruction('');
    setInstructionModalVisible(false);
  };

  const removeInstruction = (index: number) => {
    if (!recipe) return;
    
    const updatedInstructions = recipe.instructions.filter((_, i) => i !== index);
    // Re-numerar los pasos
    const renumberedInstructions = updatedInstructions.map((inst, idx) => ({
      ...inst,
      step: idx + 1
    }));
    
    setRecipe({ ...recipe, instructions: renumberedInstructions });
  };

  if (!canManageContent()) {
    return (
      <View style={styles.accessDenied}>
        <MaterialCommunityIcons name="shield-off" size={64} color="#EF4444" />
        <Text style={styles.accessDeniedTitle}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedText}>
          No tienes permisos para editar recetas
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando receta...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Receta no encontrada</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>✏️ Editar Receta</Text>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
      </View>

      {/* Información Básica */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={recipe.title}
            onChangeText={(text) => updateRecipeField('title', text)}
            placeholder="Título de la receta"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={recipe.description}
            onChangeText={(text) => updateRecipeField('description', text)}
            placeholder="Descripción de la receta"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Tiempo de preparación (min)</Text>
            <TextInput
              style={styles.input}
              value={recipe.preparationTime.toString()}
              onChangeText={(text) => updateRecipeField('preparationTime', parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Porciones</Text>
            <TextInput
              style={styles.input}
              value={recipe.servings.toString()}
              onChangeText={(text) => updateRecipeField('servings', parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Dificultad</Text>
            <View style={styles.radioContainer}>
              {['Fácil', 'Medio', 'Difícil'].map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.radioButton,
                    recipe.difficulty === difficulty && styles.radioButtonSelected
                  ]}
                  onPress={() => updateRecipeField('difficulty', difficulty)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      recipe.difficulty === difficulty && styles.radioTextSelected
                    ]}
                  >
                    {difficulty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Categoría</Text>
            <TextInput
              style={styles.input}
              value={recipe.category}
              onChangeText={(text) => updateRecipeField('category', text)}
              placeholder="Categoría"
            />
          </View>
        </View>
      </View>

      {/* Ingredientes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingredientes</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIngredientModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <View style={styles.ingredientInfo}>
              <TextInput
                style={styles.ingredientInput}
                value={ingredient.name}
                onChangeText={(text) => updateIngredient(index, 'name', text)}
                placeholder="Nombre del ingrediente"
              />
              <View style={styles.ingredientQuantityRow}>
                <TextInput
                  style={[styles.ingredientInput, styles.quantityInput]}
                  value={ingredient.quantity}
                  onChangeText={(text) => updateIngredient(index, 'quantity', text)}
                  placeholder="Cantidad"
                />
                <TextInput
                  style={[styles.ingredientInput, styles.unitInput]}
                  value={ingredient.unit}
                  onChangeText={(text) => updateIngredient(index, 'unit', text)}
                  placeholder="Unidad"
                />
              </View>
            </View>
            <TouchableOpacity 
              style={styles.deleteSmallButton}
              onPress={() => removeIngredient(index)}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}

        {recipe.ingredients.length === 0 && (
          <Text style={styles.emptyText}>No hay ingredientes agregados</Text>
        )}
      </View>

      {/* Instrucciones */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Instrucciones</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setInstructionModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {recipe.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <Text style={styles.instructionStep}>Paso {instruction.step}</Text>
            <TextInput
              style={[styles.input, styles.instructionInput]}
              value={instruction.description}
              onChangeText={(text) => updateInstruction(index, text)}
              placeholder="Descripción del paso"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity 
              style={styles.deleteSmallButton}
              onPress={() => removeInstruction(index)}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}

        {recipe.instructions.length === 0 && (
          <Text style={styles.emptyText}>No hay instrucciones agregadas</Text>
        )}
      </View>

      {/* Botones de Acción */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal para Agregar Ingrediente */}
      <Modal
        visible={ingredientModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIngredientModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Ingrediente</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre del ingrediente"
              value={newIngredient.name}
              onChangeText={(text) => setNewIngredient({ ...newIngredient, name: text })}
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.half]}
                placeholder="Cantidad"
                value={newIngredient.quantity}
                onChangeText={(text) => setNewIngredient({ ...newIngredient, quantity: text })}
              />
              
              <TextInput
                style={[styles.input, styles.half]}
                placeholder="Unidad"
                value={newIngredient.unit}
                onChangeText={(text) => setNewIngredient({ ...newIngredient, unit: text })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIngredientModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={addIngredient}
              >
                <Text style={styles.saveButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Agregar Instrucción */}
      <Modal
        visible={instructionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInstructionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Instrucción</Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción del paso"
              value={newInstruction}
              onChangeText={setNewInstruction}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setInstructionModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={addInstruction}
              >
                <Text style={styles.saveButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#3B82F6',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  radioTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  ingredientQuantityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  instructionItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  instructionStep: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  instructionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  deleteSmallButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});