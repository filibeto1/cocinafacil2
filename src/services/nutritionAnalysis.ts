// src/services/nutritionAnalysis.ts

interface UserProfile {
  userId?: any; // ✅ Opcional para compatibilidad
  personalInfo?: {
    gender?: string;
    activityLevel?: string;
    weight?: number;
    height?: number;
    age?: number;
    dailyCalorieGoal?: number;
    [key: string]: any; // ✅ Permitir otras propiedades
  };
  healthInfo?: {
    allergies?: string[];
    dietaryRestrictions?: string[];
    healthConditions?: string[];
    healthGoals?: string[];
    [key: string]: any; // ✅ Permitir otras propiedades
  };
  preferences?: {
    dislikedIngredients?: string[];
    [key: string]: any; // ✅ Permitir otras propiedades
  };
  [key: string]: any; // ✅ Permitir cualquier otra propiedad del perfil
}

interface Recipe {
  _id?: string;
  ingredients?: Array<{ name: string; quantity?: string; unit?: string }>;
  category?: string;
  preparationTime?: number;
  difficulty?: string;
  calories?: number; // ✅ Opcional - puede no existir en tu tipo
  nutritionInfo?: {
    carbs?: number;
    protein?: number;
    fat?: number;
    sodium?: number;
    sugar?: number;
  };
  [key: string]: any; // ✅ Permitir otras propiedades
}

export interface NutritionWarning {
  level: 'safe' | 'caution' | 'warning' | 'danger';
  riskPercentage: number;
  reasons: string[];
  recommendations: string[];
  affectedIngredients: string[];
  category: 'allergy' | 'restriction' | 'health' | 'goal' | 'calories' | 'nutrition';
}

export interface NutritionAnalysisResult {
  overallRisk: number;
  isSafe: boolean;
  warnings: NutritionWarning[];
  summary: string;
}

class NutritionAnalysisService {
  
  // Palabras clave para detectar alergenos comunes
  private allergenKeywords: { [key: string]: string[] } = {
    'lácteos': ['leche', 'queso', 'yogur', 'mantequilla', 'crema', 'nata', 'suero', 'lactosa'],
    'huevo': ['huevo', 'huevos', 'yema', 'clara'],
    'gluten': ['trigo', 'harina', 'pan', 'pasta', 'cebada', 'centeno', 'avena'],
    'frutos secos': ['nuez', 'almendra', 'avellana', 'pistacho', 'anacardo', 'castaña', 'maní', 'cacahuate'],
    'mariscos': ['camarón', 'langosta', 'cangrejo', 'mejillón', 'almeja', 'calamar', 'pulpo'],
    'pescado': ['pescado', 'salmón', 'atún', 'trucha', 'bacalao', 'sardina'],
    'soja': ['soja', 'soya', 'tofu', 'tempeh', 'miso', 'edamame'],
    'mostaza': ['mostaza'],
    'apio': ['apio'],
    'sésamo': ['sésamo', 'ajonjolí'],
  };

  // Palabras clave para restricciones dietéticas
  private restrictionKeywords: { [key: string]: string[] } = {
    'vegetariano': ['carne', 'pollo', 'res', 'cerdo', 'pescado', 'mariscos', 'atún'],
    'vegano': ['carne', 'pollo', 'res', 'cerdo', 'pescado', 'mariscos', 'huevo', 'leche', 'queso', 'miel'],
    'sin gluten': ['trigo', 'harina', 'pan', 'pasta', 'cebada', 'centeno'],
    'kosher': ['cerdo', 'mariscos'],
    'halal': ['cerdo', 'alcohol'],
    'bajo en sodio': ['sal', 'salsa de soja', 'caldo'],
  };

  // Condiciones de salud y alimentos a evitar
  private healthConditionKeywords: { [key: string]: string[] } = {
    'diabetes': ['azúcar', 'miel', 'jarabe', 'dulce', 'refresco', 'jugo'],
    'hipertensión': ['sal', 'salsa de soja', 'embutido', 'tocino', 'jamón'],
    'colesterol alto': ['mantequilla', 'tocino', 'yema', 'embutido', 'fritura'],
    'enfermedad renal': ['sal', 'plátano', 'tomate', 'espinaca', 'aguacate'],
    'gota': ['mariscos', 'vísceras', 'carne roja', 'cerveza'],
  };

  // Metas de salud y recomendaciones
  private healthGoalKeywords: { [key: string]: { avoid: string[], prefer: string[] } } = {
    'perder peso': {
      avoid: ['fritura', 'azúcar', 'aceite', 'mantequilla', 'crema'],
      prefer: ['ensalada', 'verdura', 'proteína', 'pescado', 'pechuga']
    },
    'ganar masa muscular': {
      avoid: ['azúcar', 'refresco', 'alcohol'],
      prefer: ['proteína', 'carne', 'pollo', 'pescado', 'huevo', 'legumbre']
    },
    'mantener peso': {
      avoid: ['fritura excesiva', 'azúcar refinada'],
      prefer: ['equilibrio', 'variedad']
    },
  };

  /**
   * Análisis principal de una receta contra el perfil del usuario
   */
  public analyzeRecipe(recipe: Recipe, userProfile: UserProfile): NutritionAnalysisResult {
    const warnings: NutritionWarning[] = [];

    // ✅ Validar que tengamos datos básicos
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return {
        overallRisk: 0,
        isSafe: true,
        warnings: [],
        summary: '✅ No hay suficiente información para analizar'
      };
    }

    if (!userProfile || !userProfile.healthInfo) {
      return {
        overallRisk: 0,
        isSafe: true,
        warnings: [],
        summary: '✅ Esta receta es segura (perfil incompleto)'
      };
    }

    // 1. Análisis de alergias (CRÍTICO - 100%)
    const allergyWarning = this.checkAllergies(recipe, userProfile.healthInfo.allergies || []);
    if (allergyWarning) warnings.push(allergyWarning);

    // 2. Análisis de restricciones dietéticas (ALTO - 80%)
    const restrictionWarning = this.checkDietaryRestrictions(recipe, userProfile.healthInfo.dietaryRestrictions || []);
    if (restrictionWarning) warnings.push(restrictionWarning);

    // 3. Análisis de condiciones de salud (ALTO - 70%)
    const healthWarning = this.checkHealthConditions(recipe, userProfile.healthInfo.healthConditions || []);
    if (healthWarning) warnings.push(healthWarning);

    // 4. Análisis de metas de salud (MEDIO - 50%)
    const goalWarning = this.checkHealthGoals(recipe, userProfile.healthInfo.healthGoals || []);
    if (goalWarning) warnings.push(goalWarning);

    // 5. Análisis de calorías vs actividad (BAJO - 30%)
    const calorieWarning = this.checkCalories(recipe, userProfile);
    if (calorieWarning) warnings.push(calorieWarning);

    // 6. Ingredientes no deseados (BAJO - 20%)
    const dislikedWarning = this.checkDislikedIngredients(
      recipe, 
      userProfile.preferences?.dislikedIngredients || []
    );
    if (dislikedWarning) warnings.push(dislikedWarning);

    // Calcular riesgo general
    const overallRisk = this.calculateOverallRisk(warnings);
    const isSafe = overallRisk < 26;
    const summary = this.generateSummary(overallRisk, warnings);

    return {
      overallRisk,
      isSafe,
      warnings,
      summary
    };
  }

  /**
   * Verifica alergias alimentarias
   */
  private checkAllergies(recipe: Recipe, allergies: string[]): NutritionWarning | null {
    if (!allergies || allergies.length === 0 || !recipe.ingredients) return null;

    const affectedIngredients: string[] = [];
    const reasons: string[] = [];

    for (const allergy of allergies) {
      const allergyLower = allergy.toLowerCase().trim();
      const keywords = this.allergenKeywords[allergyLower] || [allergyLower];

      for (const ingredient of recipe.ingredients) {
        if (!ingredient || !ingredient.name) continue; // ✅ Validación adicional
        
        const ingredientName = ingredient.name.toLowerCase();
        
        for (const keyword of keywords) {
          if (ingredientName.includes(keyword)) {
            affectedIngredients.push(ingredient.name);
            reasons.push(`Contiene ${ingredient.name} (alérgeno: ${allergy})`);
          }
        }
      }
    }

    if (affectedIngredients.length === 0) return null;

    return {
      level: 'danger',
      riskPercentage: 100,
      category: 'allergy',
      reasons,
      affectedIngredients: [...new Set(affectedIngredients)],
      recommendations: [
        '⛔ NO CONSUMIR - Contiene alérgenos declarados',
        'Busca alternativas sin estos ingredientes',
        'Consulta con un profesional de salud antes de consumir'
      ]
    };
  }

  /**
   * Verifica restricciones dietéticas
   */
  private checkDietaryRestrictions(recipe: Recipe, restrictions: string[]): NutritionWarning | null {
    if (!restrictions || restrictions.length === 0 || !recipe.ingredients) return null;

    const affectedIngredients: string[] = [];
    const reasons: string[] = [];

    for (const restriction of restrictions) {
      const restrictionLower = restriction.toLowerCase().trim();
      const keywords = this.restrictionKeywords[restrictionLower] || [restrictionLower];

      for (const ingredient of recipe.ingredients) {
        if (!ingredient || !ingredient.name) continue; // ✅ Validación adicional
        
        const ingredientName = ingredient.name.toLowerCase();
        
        for (const keyword of keywords) {
          if (ingredientName.includes(keyword)) {
            affectedIngredients.push(ingredient.name);
            reasons.push(`${ingredient.name} no cumple con: ${restriction}`);
          }
        }
      }
    }

    if (affectedIngredients.length === 0) return null;

    return {
      level: 'warning',
      riskPercentage: 80,
      category: 'restriction',
      reasons,
      affectedIngredients: [...new Set(affectedIngredients)],
      recommendations: [
        '⚠️ No compatible con tu dieta',
        'Considera sustituir los ingredientes problemáticos',
        'Busca recetas específicas para tu tipo de dieta'
      ]
    };
  }

  /**
   * Verifica condiciones de salud
   */
  private checkHealthConditions(recipe: Recipe, conditions: string[]): NutritionWarning | null {
    if (!conditions || conditions.length === 0 || !recipe.ingredients) return null;

    const affectedIngredients: string[] = [];
    const reasons: string[] = [];

    for (const condition of conditions) {
      const conditionLower = condition.toLowerCase().trim();
      const keywords = this.healthConditionKeywords[conditionLower] || [];

      for (const ingredient of recipe.ingredients) {
        if (!ingredient || !ingredient.name) continue; // ✅ Validación adicional
        
        const ingredientName = ingredient.name.toLowerCase();
        
        for (const keyword of keywords) {
          if (ingredientName.includes(keyword)) {
            affectedIngredients.push(ingredient.name);
            reasons.push(`${ingredient.name} puede afectar: ${condition}`);
          }
        }
      }
    }

    if (affectedIngredients.length === 0) return null;

    return {
      level: 'warning',
      riskPercentage: 70,
      category: 'health',
      reasons,
      affectedIngredients: [...new Set(affectedIngredients)],
      recommendations: [
        '⚠️ Puede afectar tu condición de salud',
        'Consulta con tu médico antes de consumir',
        'Considera modificar las cantidades o ingredientes',
        'Monitorea tu respuesta después de consumir'
      ]
    };
  }

  /**
   * Verifica compatibilidad con metas de salud
   */
  private checkHealthGoals(recipe: Recipe, goals: string[]): NutritionWarning | null {
    if (!goals || goals.length === 0 || !recipe.ingredients) return null;

    const affectedIngredients: string[] = [];
    const reasons: string[] = [];
    let maxRisk = 0;

    for (const goal of goals) {
      const goalLower = goal.toLowerCase().trim();
      const goalData = this.healthGoalKeywords[goalLower];
      
      if (!goalData) continue;

      for (const ingredient of recipe.ingredients) {
        if (!ingredient || !ingredient.name) continue; // ✅ Validación adicional
        
        const ingredientName = ingredient.name.toLowerCase();
        
        for (const keyword of goalData.avoid) {
          if (ingredientName.includes(keyword)) {
            affectedIngredients.push(ingredient.name);
            reasons.push(`${ingredient.name} no es ideal para: ${goal}`);
            maxRisk = Math.max(maxRisk, 50);
          }
        }
      }
    }

    if (affectedIngredients.length === 0) return null;

    return {
      level: 'caution',
      riskPercentage: 50,
      category: 'goal',
      reasons,
      affectedIngredients: [...new Set(affectedIngredients)],
      recommendations: [
        '💡 Esta receta puede no alinearse con tus metas',
        'Consume con moderación',
        'Ajusta las porciones según tus objetivos',
        'Complementa con ejercicio adicional si es necesario'
      ]
    };
  }

  /**
   * Verifica calorías vs nivel de actividad
   */
  private checkCalories(recipe: Recipe, userProfile: UserProfile): NutritionWarning | null {
    // ✅ Validaciones mejoradas
    if (!recipe.calories || !userProfile.personalInfo?.dailyCalorieGoal) return null;

    const caloriesPerServing = recipe.calories;
    const dailyGoal = userProfile.personalInfo.dailyCalorieGoal;
    const percentageOfDaily = (caloriesPerServing / dailyGoal) * 100;

    if (percentageOfDaily < 40) return null; // Si es menos del 40% está bien

    let level: 'safe' | 'caution' | 'warning' | 'danger' = 'caution';
    let riskPercentage = 30;

    if (percentageOfDaily > 60) {
      level = 'warning';
      riskPercentage = 50;
    }

    return {
      level,
      riskPercentage,
      category: 'calories',
      reasons: [
        `Esta receta contiene ${caloriesPerServing} calorías`,
        `Representa el ${percentageOfDaily.toFixed(1)}% de tu meta diaria`
      ],
      affectedIngredients: [],
      recommendations: [
        '⚖️ Considera las porciones cuidadosamente',
        'Balancea con comidas más ligeras durante el día',
        'Aumenta tu actividad física si la consumes'
      ]
    };
  }

  /**
   * Verifica ingredientes no deseados
   */
  private checkDislikedIngredients(recipe: Recipe, disliked: string[]): NutritionWarning | null {
    if (!disliked || disliked.length === 0 || !recipe.ingredients) return null;

    const affectedIngredients: string[] = [];

    for (const dislikedItem of disliked) {
      const dislikedLower = dislikedItem.toLowerCase().trim();

      for (const ingredient of recipe.ingredients) {
        if (!ingredient || !ingredient.name) continue; // ✅ Validación adicional
        
        const ingredientName = ingredient.name.toLowerCase();
        
        if (ingredientName.includes(dislikedLower)) {
          affectedIngredients.push(ingredient.name);
        }
      }
    }

    if (affectedIngredients.length === 0) return null;

    return {
      level: 'caution',
      riskPercentage: 20,
      category: 'nutrition',
      reasons: [`Contiene ingredientes que no te gustan: ${affectedIngredients.join(', ')}`],
      affectedIngredients,
      recommendations: [
        '😕 Esta receta contiene ingredientes que no prefieres',
        'Puedes sustituirlos por alternativas de tu agrado',
        'O simplemente omitirlos si no son esenciales'
      ]
    };
  }

  /**
   * Calcula el riesgo general basado en todas las advertencias
   */
  private calculateOverallRisk(warnings: NutritionWarning[]): number {
    if (warnings.length === 0) return 0;

    // El riesgo más alto determina el nivel general
    const maxRisk = Math.max(...warnings.map(w => w.riskPercentage));
    
    return maxRisk;
  }

  /**
   * Genera un resumen del análisis
   */
  private generateSummary(risk: number, warnings: NutritionWarning[]): string {
    if (risk === 0) {
      return '✅ Esta receta es segura y compatible con tu perfil';
    }

    if (risk <= 25) {
      return '✅ Esta receta es generalmente segura para ti';
    }

    if (risk <= 50) {
      return '⚠️ Precaución: Esta receta tiene algunas incompatibilidades';
    }

    if (risk <= 75) {
      return '⚠️ Cuidado: Esta receta no es recomendable para ti';
    }

    return '🚫 PELIGRO: Esta receta contiene elementos que debes evitar';
  }

  /**
   * Obtiene el color según el nivel de riesgo
   */
  public getRiskColor(risk: number): string {
    if (risk <= 25) return '#10B981'; // Verde
    if (risk <= 50) return '#F59E0B'; // Amarillo
    if (risk <= 75) return '#F97316'; // Naranja
    return '#EF4444'; // Rojo
  }

  /**
   * Obtiene el ícono según el nivel de riesgo
   */
  public getRiskIcon(risk: number): string {
    if (risk <= 25) return '✅';
    if (risk <= 50) return '⚠️';
    if (risk <= 75) return '⚠️';
    return '🚫';
  }
}

export const nutritionAnalysisService = new NutritionAnalysisService();