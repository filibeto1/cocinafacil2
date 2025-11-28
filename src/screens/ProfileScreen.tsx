// ProfileScreen.tsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { storage } from '../services/storage';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface PersonalInfoForm {
  gender: string;
  activityLevel: ActivityLevel | '';
  weight: string;
  height: string;
  age: string;
  dailyCalorieGoal: string;
}

// INTERFACES PARA LOS COMPONENTES
interface PersonalInfoSectionProps {
  personalInfo: PersonalInfoForm;
  handlePersonalInfoChange: (field: keyof PersonalInfoForm, value: string) => void;
  calculateBMI: () => string | null;
  getBMICategory: (bmi: string) => string;
  styles: any;
}

interface HealthInfoProps {
  healthInfo: {
    allergies: string[];
    dietaryRestrictions: string[];
    healthConditions: string[];
    healthGoals: string[];
  };
  newAllergy: string;
  setNewAllergy: (value: string) => void;
  newRestriction: string;
  setNewRestriction: (value: string) => void;
  newCondition: string;
  setNewCondition: (value: string) => void;
  newGoal: string;
  setNewGoal: (value: string) => void;
  handleAddAllergy: () => void;
  handleAddRestriction: () => void;
  handleAddCondition: () => void;
  handleAddGoal: () => void;
  handleRemoveAllergy: (index: number) => void;
  handleRemoveRestriction: (index: number) => void;
  handleRemoveCondition: (index: number) => void;
  handleRemoveGoal: (index: number) => void;
  styles: any;
}

interface PreferencesProps {
  preferences: {
    favoriteCuisines: string[];
    dislikedIngredients: string[];
  };
  newCuisine: string;
  setNewCuisine: (value: string) => void;
  newDislikedIngredient: string;
  setNewDislikedIngredient: (value: string) => void;
  handleAddCuisine: () => void;
  handleAddDislikedIngredient: () => void;
  handleRemoveCuisine: (index: number) => void;
  handleRemoveDislikedIngredient: (index: number) => void;
  styles: any;
}

// COMPONENTE PersonalInfoSection
const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = React.memo(({
  personalInfo,
  handlePersonalInfoChange,
  calculateBMI,
  getBMICategory,
  styles
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Información Personal</Text>
    
    {/* Selector de Género */}
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Género *</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity 
          style={[
            styles.radioButton, 
            personalInfo.gender === 'male' && styles.radioButtonSelected
          ]}
          onPress={() => handlePersonalInfoChange('gender', 'male')}
        >
          <Text style={[
            styles.radioText,
            personalInfo.gender === 'male' && styles.radioTextSelected
          ]}>
            👨 Hombre
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.radioButton, 
            personalInfo.gender === 'female' && styles.radioButtonSelected
          ]}
          onPress={() => handlePersonalInfoChange('gender', 'female')}
        >
          <Text style={[
            styles.radioText,
            personalInfo.gender === 'female' && styles.radioTextSelected
          ]}>
            👩 Mujer
          </Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Selector de Nivel de Actividad */}
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Nivel de Actividad *</Text>
      {[
        { value: 'sedentary', label: '💺 Sedentario', description: '(poco o ningún ejercicio)' },
        { value: 'light', label: '🚶 Ligero', description: '(ejercicio 1-3 días/semana)' },
        { value: 'moderate', label: '🏃 Moderado', description: '(ejercicio 3-5 días/semana)' },
        { value: 'active', label: '💪 Activo', description: '(ejercicio 6-7 días/semana)' },
        { value: 'very_active', label: '🔥 Muy Activo', description: '(ejercicio intenso diario)' }
      ].map((level) => (
        <TouchableOpacity
          key={level.value}
          style={[
            styles.radioButtonVertical,
            personalInfo.activityLevel === level.value && styles.radioButtonSelected
          ]}
          onPress={() => handlePersonalInfoChange('activityLevel', level.value as ActivityLevel)}
        >
          <View style={styles.activityLevelContent}>
            <Text style={[
              styles.radioText,
              personalInfo.activityLevel === level.value && styles.radioTextSelected
            ]}>
              {level.label}
            </Text>
            <Text style={[
              styles.radioDescription,
              personalInfo.activityLevel === level.value && styles.radioTextSelected
            ]}>
              {level.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>

    {/* Datos Corporales */}
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Datos Corporales *</Text>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.weight}
            onChangeText={(text) => handlePersonalInfoChange('weight', text)}
            placeholder="70"
            keyboardType="numeric"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            importantForAutofill="no"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.height}
            onChangeText={(text) => handlePersonalInfoChange('height', text)}
            placeholder="175"
            keyboardType="numeric"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            importantForAutofill="no"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Edad (años)</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.age}
            onChangeText={(text) => handlePersonalInfoChange('age', text)}
            placeholder="25"
            keyboardType="numeric"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            importantForAutofill="no"
          />
        </View>
      </View>
      
      {/* Cálculo de IMC */}
      {calculateBMI() && (
        <View style={[styles.bmiResult, { borderLeftColor: '#007AFF' }]}>
          <Text style={styles.bmiText}>
            Índice de Masa Corporal (IMC): <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>
              {calculateBMI()}
            </Text>
          </Text>
          <Text style={[styles.bmiCategory, { color: '#007AFF' }]}>
            {getBMICategory(calculateBMI()!)}
          </Text>
        </View>
      )}
    </View>

    {/* Calorías Calculadas */}
    {personalInfo.dailyCalorieGoal ? (
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesTitle}>🔥 Calorías Diarias Recomendadas</Text>
        <Text style={styles.caloriesText}>{personalInfo.dailyCalorieGoal} kcal</Text>
      </View>
    ) : (
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesPlaceholder}>
          Completa todos los campos para calcular tus calorías diarias
        </Text>
      </View>
    )}
  </View>
));

// COMPONENTE HealthInfoSection
const HealthInfoSection: React.FC<HealthInfoProps> = React.memo(({
  healthInfo,
  newAllergy,
  setNewAllergy,
  newRestriction,
  setNewRestriction,
  newCondition,
  setNewCondition,
  newGoal,
  setNewGoal,
  handleAddAllergy,
  handleAddRestriction,
  handleAddCondition,
  handleAddGoal,
  handleRemoveAllergy,
  handleRemoveRestriction,
  handleRemoveCondition,
  handleRemoveGoal,
  styles
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Información de Salud</Text>
    
    {/* Alergias */}
    <View style={styles.listContainer}>
      <Text style={styles.label}>Alergias Alimentarias</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newAllergy}
          onChangeText={setNewAllergy}
          placeholder="Ej: Maní, mariscos, lactosa..."
          onSubmitEditing={handleAddAllergy}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="sentences"
          spellCheck={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddAllergy}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {healthInfo.allergies.map((allergy, index) => (
          <View key={`allergy-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{allergy}</Text>
            <TouchableOpacity onPress={() => handleRemoveAllergy(index)}>
              <Text style={styles.chipRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>

    {/* Restricciones Dietéticas */}
    <View style={styles.listContainer}>
      <Text style={styles.label}>Restricciones Dietéticas</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newRestriction}
          onChangeText={setNewRestriction}
          placeholder="Ej: Vegetariano, sin gluten..."
          onSubmitEditing={handleAddRestriction}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="sentences"
          spellCheck={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddRestriction}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {healthInfo.dietaryRestrictions.map((restriction, index) => (
          <View key={`restriction-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{restriction}</Text>
            <TouchableOpacity onPress={() => handleRemoveRestriction(index)}>
              <Text style={styles.chipRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>

    {/* Condiciones de Salud */}
    <View style={styles.listContainer}>
      <Text style={styles.label}>Condiciones de Salud</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newCondition}
          onChangeText={setNewCondition}
          placeholder="Ej: Diabetes, hipertensión..."
          onSubmitEditing={handleAddCondition}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="sentences"
          spellCheck={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCondition}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {healthInfo.healthConditions.map((condition, index) => (
          <View key={`condition-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{condition}</Text>
            <TouchableOpacity onPress={() => handleRemoveCondition(index)}>
              <Text style={styles.chipRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>

    {/* Metas de Salud */}
    <View style={styles.listContainer}>
      <Text style={styles.label}>Metas de Salud</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newGoal}
          onChangeText={setNewGoal}
          placeholder="Ej: Perder peso, ganar masa muscular..."
          onSubmitEditing={handleAddGoal}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="sentences"
          spellCheck={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {healthInfo.healthGoals.map((goal, index) => (
          <View key={`goal-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{goal}</Text>
            <TouchableOpacity onPress={() => handleRemoveGoal(index)}>
              <Text style={styles.chipRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  </View>
));

// COMPONENTE PreferencesSection
const PreferencesSection: React.FC<PreferencesProps> = React.memo(({
  preferences,
  newCuisine,
  setNewCuisine,
  newDislikedIngredient,
  setNewDislikedIngredient,
  handleAddCuisine,
  handleAddDislikedIngredient,
  handleRemoveCuisine,
  handleRemoveDislikedIngredient,
  styles
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Preferencias Alimentarias</Text>
    
    {/* Cocinas Favoritas */}
    <View style={styles.listContainer}>
      <Text style={styles.label}>Cocinas Favoritas</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newCuisine}
          onChangeText={setNewCuisine}
          placeholder="Ej: Mexicana, Italiana, China..."
          onSubmitEditing={handleAddCuisine}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="sentences"
          spellCheck={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCuisine}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {preferences.favoriteCuisines.map((cuisine, index) => (
          <View key={`cuisine-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{cuisine}</Text>
            <TouchableOpacity onPress={() => handleRemoveCuisine(index)}>
              <Text style={styles.chipRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>

    {/* Ingredientes No Deseados */}
    <View style={styles.listContainer}>
      <Text style={styles.label}>Ingredientes No Deseados</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newDislikedIngredient}
          onChangeText={setNewDislikedIngredient}
          placeholder="Ej: Cilantro, hígado, anchoas..."
          onSubmitEditing={handleAddDislikedIngredient}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="sentences"
          spellCheck={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddDislikedIngredient}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {preferences.dislikedIngredients.map((ingredient, index) => (
          <View key={`ingredient-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{ingredient}</Text>
            <TouchableOpacity onPress={() => handleRemoveDislikedIngredient(index)}>
              <Text style={styles.chipRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  </View>
));

// COMPONENTE PRINCIPAL ProfileScreen
const ProfileScreen: React.FC = () => {
  const { 
    user,
    userProfile, 
    updatePersonalInfo, 
    updateHealthInfo, 
    updatePreferences,
    logout,
    forceLogout,
    loading,
    isAuthenticated
  } = useAuth();
  
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoForm>({
    gender: '',
    activityLevel: '',
    weight: '',
    height: '',
    age: '',
    dailyCalorieGoal: ''
  });
  
  const [healthInfo, setHealthInfo] = useState({
    allergies: [] as string[],
    dietaryRestrictions: [] as string[],
    healthConditions: [] as string[],
    healthGoals: [] as string[]
  });
  
  const [preferences, setPreferences] = useState({
    favoriteCuisines: [] as string[],
    dislikedIngredients: [] as string[]
  });
  
  const [newAllergy, setNewAllergy] = useState('');
  const [newRestriction, setNewRestriction] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newCuisine, setNewCuisine] = useState('');
  const [newDislikedIngredient, setNewDislikedIngredient] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'personal' | 'health' | 'preferences'>('personal');

  // Cargar datos del usuario
  useEffect(() => {
    if (userProfile) {
      if (userProfile.personalInfo) {
        setPersonalInfo({
          gender: userProfile.personalInfo.gender || '',
          activityLevel: userProfile.personalInfo.activityLevel || '',
          weight: userProfile.personalInfo.weight?.toString() || '',
          height: userProfile.personalInfo.height?.toString() || '',
          age: userProfile.personalInfo.age?.toString() || '',
          dailyCalorieGoal: userProfile.personalInfo.dailyCalorieGoal?.toString() || ''
        });
      }
      
      if (userProfile.healthInfo) {
        setHealthInfo({
          allergies: userProfile.healthInfo.allergies || [],
          dietaryRestrictions: userProfile.healthInfo.dietaryRestrictions || [],
          healthConditions: userProfile.healthInfo.healthConditions || [],
          healthGoals: userProfile.healthInfo.healthGoals || []
        });
      }
      
      if (userProfile.preferences) {
        setPreferences({
          favoriteCuisines: userProfile.preferences.favoriteCuisines || [],
          dislikedIngredients: userProfile.preferences.dislikedIngredients || []
        });
      }
    }
  }, [userProfile]);

  // ✅ FUNCIÓN LOGOUT CORREGIDA - USANDO NAVEGACIÓN CORRECTA
  const handleLogout = async () => {
    console.log('🚪 ProfileScreen - Iniciando LOGOUT MEJORADO');
    
    try {
      setSaving(true);
      
      // 1. Ejecutar logout del contexto (limpia estados de React)
      console.log('🔄 Paso 1: Limpiando contexto de autenticación...');
      await logout();
      
      // 2. Esperar un momento para que los estados se propaguen
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. Verificar que se limpió correctamente
      console.log('🔍 Verificando limpieza...');
      const tokenCheck = await storage.getToken();
      const userCheck = await storage.getUser();
      
      if (tokenCheck || userCheck) {
        console.warn('⚠️ Limpieza incompleta, ejecutando forceLogout...');
        await forceLogout();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('✅ Logout completado exitosamente');
      
      // 4. NAVEGAR AL LOGIN - Usando CommonActions para resetear el stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
      
    } catch (error: any) {
      console.error('❌ Error en logout:', error);
      
      // FALLBACK NUCLEAR: Limpiar todo manualmente
      try {
        console.log('💥 Ejecutando fallback nuclear...');
        
        // Limpiar storage directamente
        await storage.clearAuth();
        
        // Si es web, limpiar también localStorage
        if (Platform.OS === 'web') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        // Navegar al login de todos modos
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
        
      } catch (fallbackError) {
        console.error('❌ Error crítico en fallback:', fallbackError);
        Alert.alert(
          'Error',
          'Hubo un problema al cerrar sesión. Por favor, cierra y vuelve a abrir la aplicación.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => console.log('Logout cancelado')
        },
        {
          text: "Cerrar sesión", 
          style: "destructive",
          onPress: handleLogout
        },
      ]
    );
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setHealthInfo(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const handleAddRestriction = () => {
    if (newRestriction.trim()) {
      setHealthInfo(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, newRestriction.trim()]
      }));
      setNewRestriction('');
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setHealthInfo(prev => ({
        ...prev,
        healthConditions: [...prev.healthConditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setHealthInfo(prev => ({
        ...prev,
        healthGoals: [...prev.healthGoals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const handleAddCuisine = () => {
    if (newCuisine.trim()) {
      setPreferences(prev => ({
        ...prev,
        favoriteCuisines: [...prev.favoriteCuisines, newCuisine.trim()]
      }));
      setNewCuisine('');
    }
  };

  const handleAddDislikedIngredient = () => {
    if (newDislikedIngredient.trim()) {
      setPreferences(prev => ({
        ...prev,
        dislikedIngredients: [...prev.dislikedIngredients, newDislikedIngredient.trim()]
      }));
      setNewDislikedIngredient('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setHealthInfo(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveRestriction = (index: number) => {
    setHealthInfo(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveCondition = (index: number) => {
    setHealthInfo(prev => ({
      ...prev,
      healthConditions: prev.healthConditions.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveGoal = (index: number) => {
    setHealthInfo(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveCuisine = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      favoriteCuisines: prev.favoriteCuisines.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveDislikedIngredient = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      dislikedIngredients: prev.dislikedIngredients.filter((_, i) => i !== index)
    }));
  };

  const handlePersonalInfoChange = (field: keyof PersonalInfoForm, value: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateBMI = () => {
    const weight = parseFloat(personalInfo.weight);
    const height = parseFloat(personalInfo.height);
    
    if (weight && height && height > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: string) => {
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return 'Bajo peso';
    if (bmiValue < 25) return 'Peso normal';
    if (bmiValue < 30) return 'Sobrepeso';
    return 'Obesidad';
  };

  // Calcular calorías automáticamente
  useEffect(() => {
    if (personalInfo.weight && personalInfo.height && personalInfo.age && 
        personalInfo.gender && personalInfo.activityLevel) {
      
      const weight = parseFloat(personalInfo.weight);
      const height = parseFloat(personalInfo.height);
      const age = parseFloat(personalInfo.age);
      
      if (isNaN(weight) || isNaN(height) || isNaN(age) || height === 0) {
        return;
      }
      
      let bmr;
      if (personalInfo.gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
      
      const activityFactors: Record<ActivityLevel, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      const calories = Math.round(bmr * (activityFactors[personalInfo.activityLevel as ActivityLevel] || 1.2));
      setPersonalInfo(prev => ({
        ...prev,
        dailyCalorieGoal: calories.toString()
      }));
    }
  }, [personalInfo.weight, personalInfo.height, personalInfo.age, personalInfo.gender, personalInfo.activityLevel]);

  const saveProfile = async () => {
    if (activeSection === 'personal') {
      const weight = parseFloat(personalInfo.weight) || 0;
      const height = parseFloat(personalInfo.height) || 0;
      const age = parseInt(personalInfo.age) || 0;

      if (!weight || !height || !age) {
        Alert.alert('Datos requeridos', 'Por favor ingresa peso, altura y edad válidos');
        return;
      }
    }

    setSaving(true);
    try {
      if (activeSection === 'personal') {
        const personalData = {
          gender: personalInfo.gender,
          activityLevel: personalInfo.activityLevel as ActivityLevel,
          weight: parseFloat(personalInfo.weight) || 0,
          height: parseFloat(personalInfo.height) || 0,
          age: parseInt(personalInfo.age) || 0,
          dailyCalorieGoal: parseInt(personalInfo.dailyCalorieGoal) || 0
        };
        await updatePersonalInfo(personalData);
      }
        
      if (activeSection === 'health') {
        const healthDataToSend = {
          allergies: healthInfo.allergies || [],
          dietaryRestrictions: healthInfo.dietaryRestrictions || [],
          healthConditions: healthInfo.healthConditions || [],
          healthGoals: healthInfo.healthGoals || []
        };
        await updateHealthInfo(healthDataToSend);
      }
        
      if (activeSection === 'preferences') {
        const preferencesDataToSend = {
          favoriteCuisines: preferences.favoriteCuisines || [],
          dislikedIngredients: preferences.dislikedIngredients || [],
          cookingSkills: 'beginner' as const
        };
        await updatePreferences(preferencesDataToSend);
      }
      
      Alert.alert('¡Éxito!', 'Tu información ha sido guardada correctamente.');
      
    } catch (error: any) {
      console.error('❌ Error guardando perfil:', error);
      let errorMessage = 'No se pudo guardar la información. Por favor intenta nuevamente.';
      
      if (error.message?.includes('Error de conexión') || error.message?.includes('No se puede conectar')) {
        errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
      } else if (error.message?.includes('Error del servidor') || error.message?.includes('servidor')) {
        errorMessage = 'Error en el servidor. Por favor contacta al administrador.';
      } else if (error.message?.includes('sesión ha expirado')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>👤 {user?.username || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.logoutButton, saving && styles.disabledButton]} 
          onPress={confirmLogout}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.logoutText}>🚪 Cerrar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'personal' && styles.activeTab]}
          onPress={() => setActiveSection('personal')}
        >
          <Text style={[styles.tabText, activeSection === 'personal' && styles.activeTabText]}>
            Personal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'health' && styles.activeTab]}
          onPress={() => setActiveSection('health')}
        >
          <Text style={[styles.tabText, activeSection === 'health' && styles.activeTabText]}>
            Salud
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'preferences' && styles.activeTab]}
          onPress={() => setActiveSection('preferences')}
        >
          <Text style={[styles.tabText, activeSection === 'preferences' && styles.activeTabText]}>
            Preferencias
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeSection === 'personal' && (
          <PersonalInfoSection
            personalInfo={personalInfo}
            handlePersonalInfoChange={handlePersonalInfoChange}
            calculateBMI={calculateBMI}
            getBMICategory={getBMICategory}
            styles={styles}
          />
        )}
        {activeSection === 'health' && (
          <HealthInfoSection
            healthInfo={healthInfo}
            newAllergy={newAllergy}
            setNewAllergy={setNewAllergy}
            newRestriction={newRestriction}
            setNewRestriction={setNewRestriction}
            newCondition={newCondition}
            setNewCondition={setNewCondition}
            newGoal={newGoal}
            setNewGoal={setNewGoal}
            handleAddAllergy={handleAddAllergy}
            handleAddRestriction={handleAddRestriction}
            handleAddCondition={handleAddCondition}
            handleAddGoal={handleAddGoal}
            handleRemoveAllergy={handleRemoveAllergy}
            handleRemoveRestriction={handleRemoveRestriction}
            handleRemoveCondition={handleRemoveCondition}
            handleRemoveGoal={handleRemoveGoal}
            styles={styles}
          />
        )}
        {activeSection === 'preferences' && (
          <PreferencesSection
            preferences={preferences}
            newCuisine={newCuisine}
            setNewCuisine={setNewCuisine}
            newDislikedIngredient={newDislikedIngredient}
            setNewDislikedIngredient={setNewDislikedIngredient}
            handleAddCuisine={handleAddCuisine}
            handleAddDislikedIngredient={handleAddDislikedIngredient}
            handleRemoveCuisine={handleRemoveCuisine}
            handleRemoveDislikedIngredient={handleRemoveDislikedIngredient}
            styles={styles}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              💾 Guardar {activeSection === 'personal' ? 'Información Personal' : 
                       activeSection === 'health' ? 'Información de Salud' : 'Preferencias'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ESTILOS 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ff8a80',
    opacity: 0.7,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  selectorContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  radioButtonVertical: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  radioButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  radioTextSelected: {
    color: '#fff',
  },
  radioDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  activityLevelContent: {
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    fontWeight: '500',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  bmiResult: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  bmiText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bmiCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  caloriesContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  caloriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  caloriesText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  caloriesPlaceholder: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  listContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    width: 50,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  chipText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 6,
  },
  chipRemove: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowColor: '#bdc3c7',
  },
  saveButtonText: {
    color: '#fff', 
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export { ProfileScreen };