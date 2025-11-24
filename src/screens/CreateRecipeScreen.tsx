// src/screens/CreateRecipeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { recipeAPI, Ingredient, Instruction } from '../services/recipeAPI';

// Definir los tipos para la navegación
type RootStackParamList = {
  RecipeDetail: { recipeId: string };
  CreateRecipe: undefined;
};

type CreateRecipeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateRecipe'>;

const DIFFICULTY_OPTIONS = ['Fácil', 'Medio', 'Difícil'];
const CATEGORY_OPTIONS = ['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack', 'Bebida'];

export const CreateRecipeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<CreateRecipeScreenNavigationProp>();
  const [loading, setLoading] = useState(false);

  // Estado del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Medio' | 'Difícil'>('Fácil');
  const [category, setCategory] = useState<'Desayuno' | 'Almuerzo' | 'Cena' | 'Postre' | 'Snack' | 'Bebida'>('Almuerzo');

  // Ingredientes
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: '', unit: '' }
  ]);

  // Instrucciones
  const [instructions, setInstructions] = useState<Instruction[]>([
    { step: 1, description: '' }
  ]);

  // Agregar ingrediente
  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  // Actualizar ingrediente
  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  // Eliminar ingrediente
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  // Agregar instrucción
  const addInstruction = () => {
    setInstructions([...instructions, { step: instructions.length + 1, description: '' }]);
  };

  // Actualizar instrucción
  const updateInstruction = (index: number, description: string) => {
    const newInstructions = [...instructions];
    newInstructions[index].description = description;
    setInstructions(newInstructions);
  };

  // Eliminar instrucción
  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      const newInstructions = instructions.filter((_, i) => i !== index);
      // Reordenar steps
      newInstructions.forEach((inst, idx) => {
        inst.step = idx + 1;
      });
      setInstructions(newInstructions);
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return false;
    }
    if (!preparationTime || parseInt(preparationTime) <= 0) {
      Alert.alert('Error', 'El tiempo de preparación es requerido');
      return false;
    }
    if (!servings || parseInt(servings) <= 0) {
      Alert.alert('Error', 'El número de porciones es requerido');
      return false;
    }

    // Validar ingredientes - solo los que tienen nombre
    const ingredientesValidos = ingredients.filter(ing => ing.name.trim() !== '');
    if (ingredientesValidos.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un ingrediente');
      return false;
    }

    // Validar instrucciones - solo las que tienen descripción
    const instruccionesValidas = instructions.filter(inst => inst.description.trim() !== '');
    if (instruccionesValidas.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos una instrucción');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPreparationTime('');
    setServings('');
    setDifficulty('Fácil');
    setCategory('Almuerzo');
    setIngredients([{ name: '', quantity: '', unit: '' }]);
    setInstructions([{ step: 1, description: '' }]);
  };

  const handleCreateRecipe = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para crear una receta');
      return;
    }

    try {
      setLoading(true);

      // Filtrar solo ingredientes e instrucciones válidos
      const ingredientesValidos = ingredients.filter(ing => ing.name.trim() !== '');
      const instruccionesValidas = instructions.filter(inst => inst.description.trim() !== '');

      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredientesValidos.map(ing => ({
          name: ing.name.trim(),
          quantity: ing.quantity.trim(),
          unit: ing.unit.trim()
        })),
        instructions: instruccionesValidas.map((inst, index) => ({
          step: index + 1,
          description: inst.description.trim()
        })),
        preparationTime: parseInt(preparationTime) || 30,
        servings: parseInt(servings) || 4,
        difficulty,
        category,
        image: '',
        userId: user.id
      };

      const newRecipe = await recipeAPI.createRecipe(recipeData);

      Alert.alert(
        '¡Éxito!',
        `Tu receta "${newRecipe.title}" ha sido creada y compartida con la comunidad`,
        [
          {
            text: 'Ver Receta',
            onPress: () => {
              navigation.navigate('RecipeDetail', { recipeId: newRecipe._id! });
            }
          },
          {
            text: 'Crear Otra',
            onPress: () => {
              resetForm();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error creando receta:', error);
      
      let errorMessage = 'No se pudo crear la receta. ';
      
      if (error.message?.includes('sesión ha expirado')) {
        errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      } else if (error.message?.includes('autenticado')) {
        errorMessage = 'Debes iniciar sesión para crear recetas.';
      } else if (error.message?.includes('conexión') || error.message?.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Creando receta...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear Nueva Receta</Text>
          <Text style={styles.subtitle}>Comparte tu receta con la comunidad</Text>
        </View>

        {/* Información básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título de la receta *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Paella de mariscos"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe tu receta..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Tiempo (minutos) *</Text>
              <TextInput
                style={styles.textInput}
                value={preparationTime}
                onChangeText={setPreparationTime}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Porciones *</Text>
              <TextInput
                style={styles.textInput}
                value={servings}
                onChangeText={setServings}
                placeholder="4"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Dificultad</Text>
              <View style={styles.optionButtons}>
                {DIFFICULTY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      difficulty === option && styles.optionButtonSelected
                    ]}
                    onPress={() => setDifficulty(option as any)}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      difficulty === option && styles.optionButtonTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.optionButtons}>
                {CATEGORY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      category === option && styles.optionButtonSelected
                    ]}
                    onPress={() => setCategory(option as any)}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      category === option && styles.optionButtonTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Ingredientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <Text style={styles.addButtonText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.ingredientInputs}>
                <TextInput
                  style={[styles.textInput, styles.ingredientName]}
                  value={ingredient.name}
                  onChangeText={(value) => updateIngredient(index, 'name', value)}
                  placeholder="Nombre del ingrediente"
                />
                <TextInput
                  style={[styles.textInput, styles.ingredientQuantity]}
                  value={ingredient.quantity}
                  onChangeText={(value) => updateIngredient(index, 'quantity', value)}
                  placeholder="Cantidad"
                />
                <TextInput
                  style={[styles.textInput, styles.ingredientUnit]}
                  value={ingredient.unit}
                  onChangeText={(value) => updateIngredient(index, 'unit', value)}
                  placeholder="Unidad"
                />
              </View>
              {ingredients.length > 1 && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeIngredient(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Instrucciones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instrucciones</Text>
            <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
              <Text style={styles.addButtonText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>

          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <Text style={styles.stepNumber}>Paso {instruction.step}</Text>
              <View style={styles.instructionInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.instructionInput]}
                  value={instruction.description}
                  onChangeText={(value) => updateInstruction(index, value)}
                  placeholder="Describe este paso..."
                  multiline
                />
                {instructions.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeInstruction(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Botón crear - SOLO ESTE BOTÓN */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateRecipe}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creando...' : 'Crear Receta'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  textInput: {
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
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  optionButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ingredientName: {
    flex: 2,
  },
  ingredientQuantity: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1,
  },
  instructionRow: {
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  instructionInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  instructionInput: {
    flex: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});