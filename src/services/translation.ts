// src/services/translation.ts - VERSIÓN COMPLETA CORREGIDA
import axios from 'axios';

// Múltiples APIs de traducción como respaldo
const TRANSLATION_APIS = [
  {
    name: 'MyMemory',
    url: 'https://api.mymemory.translated.net/get',
    getParams: (text: string, targetLang: string) => ({
      q: text,
      langpair: `en|${targetLang}`,
    })
  },
  {
    name: 'LibreTranslate',
    url: 'https://libretranslate.com/translate',
    getParams: (text: string, targetLang: string) => ({
      q: text,
      source: 'en',
      target: targetLang,
      format: 'text'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }
];

export interface TranslationResult {
  translatedText: string;
  originalText: string;
}

export class TranslationService {
  private static instance: TranslationService;
  private targetLanguage: string = 'es';
  private translationCache: Map<string, string> = new Map();
  private currentApiIndex: number = 0;

  // DICCIONARIO LOCAL MEJORADO Y EXPANDIDO - ENFOQUE EN INSTRUCCIONES DE COCINA
  private localDictionary: Map<string, string> = new Map([
    // INSTRUCCIONES DE COCINA ESPECÍFICAS - Basado en tus logs
    ['shape & cook masa as desired', 'dar forma y cocinar la masa como desees'],
    ['shape and cook masa as desired', 'dar forma y cocinar la masa como desees'],
    ['shape masa', 'dar forma a la masa'],
    ['cook masa', 'cocinar la masa'],
    ['as desired', 'como desees'],
    ['shape', 'dar forma'],
    ['cook', 'cocinar'],
    ['masa', 'masa'], // Ya en español
    
    // INGREDIENTES DE TU RECETA ESPECÍFICA
    ['empanadillas', 'empanadillas'],
    ['jamón serrano', 'jamón serrano'],
    ['jamon serrano', 'jamón serrano'],
    ['jamón', 'jamón'],
    ['serrano', 'serrano'],
    ['tomatoes', 'tomates'],
    ['flour', 'harina'],
    ['harina', 'harina'],
    ['extra-virgin olive oil', 'aceite de oliva extra virgen'],
    ['olive oil', 'aceite de oliva'],
    ['olive aceite', 'aceite de oliva'],
    ['virgin olive oil', 'aceite de oliva virgen'],
    ['virgin olive aceite', 'aceite de oliva virgen'],
    ['lard', 'manteca de cerdo'],
    ['manteca', 'manteca'],
    ['water', 'agua'],
    ['agua', 'agua'],
    ['cold water', 'agua fría'],
    ['frío agua', 'agua fría'],
    ['garlic', 'ajo'],
    ['ajo', 'ajo'],
    ['garlic cloves', 'dientes de ajo'],
    ['scallions', 'cebollines'],
    ['capers', 'alcaparras'],
    ['ripe tomatoes', 'tomates maduros'],
    ['chopped tomatoes', 'tomates picados'],
    
    // VERBOS DE COCINA COMPLETOS
    ['mix', 'mezclar'],
    ['mezclar', 'mezclar'],
    ['stir', 'revolver'],
    ['combine', 'combinar'],
    ['add', 'agregar'],
    ['agregar', 'agregar'],
    ['place', 'colocar'],
    ['put', 'poner'],
    ['form', 'formar'],
    ['let rest', 'dejar reposar'],
    ['rest', 'reposar'],
    ['cover', 'cubrir'],
    ['cubrir', 'cubrir'],
    ['roll out', 'estirar'],
    ['estirar', 'estirar'],
    ['cut', 'cortar'],
    ['cortar', 'cortar'],
    ['measure', 'medir'],
    ['chop', 'picar'],
    ['picar', 'picar'],
    ['slice', 'cortar en rodajas'],
    ['dice', 'cortar en cubos'],
    ['melt', 'derretir'],
    ['heat', 'calentar'],
    ['fry', 'freír'],
    ['bake', 'hornear'],
    ['cook', 'cocinar'],
    ['cocinar', 'cocinar'],
    ['serve', 'servir'],
    ['garnish', 'decorar'],
    ['season', 'sazonar'],
    
    // FRASES DE INSTRUCCIONES COMUNES
    ['in a mixing bowl', 'en un tazón para mezclar'],
    ['in a large bowl', 'en un tazón grande'],
    ['in a medium bowl', 'en un tazón mediano'],
    ['in a small bowl', 'en un tazón pequeño'],
    ['on a floured surface', 'sobre una superficie enharinada'],
    ['on floured work surface', 'sobre una superficie de trabajo enharinada'],
    ['floured cutting board', 'tabla de cortar enharinada'],
    ['floured board', 'tabla enharinada'],
    ['work surface', 'superficie de trabajo'],
    ['cutting board', 'tabla de cortar'],
    
    ['form into a ball', 'formar una bola'],
    ['form a ball', 'formar una bola'],
    ['make a ball', 'hacer una bola'],
    ['let it rest', 'dejar reposar'],
    ['let rest for', 'dejar reposar durante'],
    ['cover with plastic', 'cubrir con plástico'],
    ['covered in plastic', 'cubierto con plástico'],
    ['covered with plastic', 'cubierto con plástico'],
    
    ['roll out the dough', 'estirar la masa'],
    ['roll out dough', 'estirar la masa'],
    ['roll the dough', 'estirar la masa'],
    ['to 1/16-inch thick', 'hasta 1/16 de pulgada de grosor'],
    ['1/16-inch thick', '1/16 de pulgada de grosor'],
    ['until thin', 'hasta que esté fino'],
    
    ['cut into squares', 'cortar en cuadrados'],
    ['cut into pieces', 'cortar en pedazos'],
    ['cut in half', 'cortar por la mitad'],
    ['cut into strips', 'cortar en tiras'],
    ['cut into slices', 'cortar en rebanadas'],
    
    ['to form a paste', 'para formar una pasta'],
    ['until combined', 'hasta que esté combinado'],
    ['until smooth', 'hasta que esté suave'],
    ['until golden', 'hasta que esté dorado'],
    ['until cooked', 'hasta que esté cocido'],
    ['until done', 'hasta que esté listo'],
    
    // UNIDADES DE MEDIDA
    ['c', 'taza'], ['cups', 'tazas'], ['cup', 'taza'],
    ['tb', 'cucharada'], ['tbsp', 'cucharada'], ['tablespoon', 'cucharada'],
    ['tablespoons', 'cucharadas'],
    ['tsp', 'cucharadita'], ['teaspoon', 'cucharadita'],
    ['teaspoons', 'cucharaditas'],
    ['sl', 'rebanada'], ['slice', 'rebanada'], ['slices', 'rebanadas'],
    ['lg', 'grande'], ['large', 'grande'],
    ['md', 'mediano'], ['medium', 'mediano'],
    ['sm', 'pequeño'], ['small', 'pequeño'],
    ['oz', 'onza'], ['ounce', 'onza'], ['ounces', 'onzas'],
    ['lb', 'libra'], ['pound', 'libra'], ['pounds', 'libras'],
    ['g', 'gramo'], ['gram', 'gramo'], ['grams', 'gramos'],
    ['kg', 'kilogramo'], ['kilogram', 'kilogramo'], ['kilograms', 'kilogramos'],
    ['ml', 'mililitro'], ['milliliter', 'mililitro'], ['milliliters', 'mililitros'],
    ['l', 'litro'], ['liter', 'litro'], ['liters', 'litros'],
    ['inch', 'pulgada'], ['inches', 'pulgadas'],
    
    // TÉRMINOS GENERALES DE RECETAS
    ['delicious recipe', 'receta deliciosa'],
    ['for 4 servings', 'para 4 porciones'],
    ['for 4 people', 'para 4 personas'],
    ['preparation time', 'tiempo de preparación'],
    ['cooking time', 'tiempo de cocción'],
    ['total time', 'tiempo total'],
    ['difficulty', 'dificultad'],
    ['category', 'categoría'],
    ['created by', 'creado por'],
    ['translate complete recipe', 'traducir receta completa'],
    ['ingredients', 'ingredientes'],
    ['instructions', 'instrucciones'],
    ['steps', 'pasos'],
    ['step', 'paso'],
    ['directions', 'instrucciones'],
    
    // DIFICULTADES
    ['easy', 'fácil'],
    ['medium', 'media'],
    ['hard', 'difícil'],
    ['difficult', 'difícil'],
    ['beginner', 'principiante'],
    ['intermediate', 'intermedio'],
    ['advanced', 'avanzado'],
    
    // CATEGORÍAS
    ['general', 'general'],
    ['appetizer', 'entrante'],
    ['main course', 'plato principal'],
    ['dessert', 'postre'],
    ['breakfast', 'desayuno'],
    ['lunch', 'almuerzo'],
    ['dinner', 'cena'],
    ['snack', 'aperitivo'],
    ['beverage', 'bebida']
  ]);

  private constructor() {}

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  // ✅ MÉTODO SEGURO PARA startsWith
  private safeStartsWith(text: string | undefined | null, searchString: string): boolean {
    // Verificar que el texto existe y es string
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    // Verificar que searchString existe
    if (!searchString || typeof searchString !== 'string') {
      return false;
    }
    
    return text.startsWith(searchString);
  }

  // ✅ MÉTODO SEGURO PARA includes
  private safeIncludes(text: string | undefined | null, searchString: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    if (!searchString || typeof searchString !== 'string') {
      return false;
    }
    
    return text.includes(searchString);
  }

  // ✅ MÉTODO MEJORADO PARA VERIFICAR TEXTO
  private isValidText(text: any): text is string {
    return typeof text === 'string' && text.trim().length > 0;
  }

  setLanguage(language: string) {
    this.targetLanguage = language;
    this.translationCache.clear();
    console.log(`🌍 Idioma establecido a: ${language}`);
  }

  getCurrentLanguage(): string {
    return this.targetLanguage;
  }

  // TRADUCCIÓN LOCAL MEJORADA - COMPLETAMENTE SEGURA
  public translateLocally(text: string | undefined | null): string {
    // ✅ Verificación segura del texto
    if (!this.isValidText(text)) {
      console.log('⚠️ Texto inválido para traducción local:', text);
      return text || '';
    }

    if (this.targetLanguage === 'en') {
      return text;
    }

    const originalText = text.toLowerCase();
    let translated = text;

    try {
      // PRIMERO: Buscar frases completas de manera segura
      const sortedPhrases = Array.from(this.localDictionary.keys())
        .sort((a, b) => b.length - a.length);
      
      for (const phrase of sortedPhrases) {
        if (this.isValidText(phrase) && phrase.length > 2) {
          const regex = new RegExp(this.escapeRegExp(phrase), 'gi');
          if (regex.test(translated)) {
            translated = translated.replace(regex, (match) => {
              const translation = this.localDictionary.get(phrase.toLowerCase()) || phrase;
              return this.preserveCase(match, translation);
            });
          }
        }
      }

      // SEGUNDO: Si no hubo cambios, intentar con palabras individuales
      if (translated === text) {
        const words = translated.split(/\s+/);
        const translatedWords = words.map(word => {
          const cleanWord = word.toLowerCase().replace(/[^a-zA-Záéíóúñ]/g, '');
          if (this.localDictionary.has(cleanWord) && cleanWord.length > 1) {
            const translation = this.localDictionary.get(cleanWord)!;
            return this.preserveCase(word, translation);
          }
          return word;
        });
        translated = translatedWords.join(' ');
      }

      // TERCERO: Corregir errores comunes de orden
      translated = this.fixWordOrder(translated);

      // SOLO LOG si hubo cambios reales
      if (translated.toLowerCase() !== originalText.toLowerCase()) {
        console.log(`🔄 Traducción local: "${text.substring(0, 50)}..." -> "${translated.substring(0, 50)}..."`);
      }
      
      return translated !== text ? translated : text;
    } catch (error) {
      console.error('❌ Error en translateLocally:', error);
      return text; // Devolver texto original en caso de error
    }
  }

  // Helper para escapar regex
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Helper para preservar capitalización
  private preserveCase(original: string, translation: string): string {
    if (original === original.toUpperCase()) {
      return translation.toUpperCase();
    } else if (original[0] === original[0]?.toUpperCase()) {
      return translation.charAt(0).toUpperCase() + translation.slice(1);
    }
    return translation;
  }

  // Corregir orden de palabras
  private fixWordOrder(text: string): string {
    const corrections: [string, string][] = [
      ['frío agua', 'agua fría'],
      ['caliente agua', 'agua caliente'],
      ['virgen extra', 'extra virgen'],
      ['grande tomate', 'tomate grande'],
      ['maduro tomate', 'tomate maduro'],
      ['picado tomate', 'tomate picado']
    ];

    let corrected = text;
    for (const [wrong, correct] of corrections) {
      const regex = new RegExp(wrong, 'gi');
      corrected = corrected.replace(regex, correct);
    }
    return corrected;
  }

  // Traducción con API con respaldo MEJORADA
  private async translateWithAPI(text: string): Promise<string> {
    if (this.targetLanguage === 'en' || !text.trim()) {
      return text;
    }

    // Primero intentar traducción local COMPLETA
    const localTranslation = this.translateLocally(text);
    if (localTranslation !== text) {
      return localTranslation;
    }

    // Si el texto es muy corto o ya parece traducido, no usar API
    if (text.length <= 3 || this.isMeasurement(text) || this.isNumber(text) || this.looksLikeSpanish(text)) {
      return text;
    }

    const api = TRANSLATION_APIS[this.currentApiIndex];
    
    try {
      console.log(`🌐 Intentando API: ${api.name} -> "${text.substring(0, 40)}..."`);
      
      const config: any = {
        timeout: 10000
      };

      if (api.headers) {
        config.headers = api.headers;
      }

      let response;
      if (api.name === 'LibreTranslate') {
        response = await axios.post(api.url, api.getParams(text, this.targetLanguage), config);
      } else {
        response = await axios.get(api.url, {
          params: api.getParams(text, this.targetLanguage),
          ...config
        });
      }

      let translatedText = text;

      if (api.name === 'MyMemory' && response.data?.responseData?.translatedText) {
        translatedText = response.data.responseData.translatedText;
      } else if (api.name === 'LibreTranslate' && response.data?.translatedText) {
        translatedText = response.data.translatedText;
      }

      // Aplicar correcciones locales a la traducción de API
      translatedText = this.translateLocally(translatedText);
      translatedText = this.cleanTranslation(translatedText, text);
      
      if (translatedText !== text) {
        console.log(`✅ ${api.name} tradujo: "${text.substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..."`);
      }
      
      return translatedText;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ ${api.name} falló:`, errorMessage);
      
      // Cambiar a la siguiente API
      this.currentApiIndex = (this.currentApiIndex + 1) % TRANSLATION_APIS.length;
      
      return this.translateLocally(text); // Devolver traducción local si falla
    }
  }

  // ✅ MÉTODO PRINCIPAL DE TRADUCCIÓN - VERSIÓN SEGURA
  async translateText(text: string | undefined | null): Promise<string> {
    // ✅ Verificación segura del texto de entrada
    if (!this.isValidText(text)) {
      console.log('⚠️ Texto inválido para traducción:', text);
      return text || '';
    }

    if (this.targetLanguage === 'en') {
      return text;
    }

    // Verificar caché primero
    const cacheKey = `${text}-${this.targetLanguage}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    // Para textos que ya están en español o son medidas/números
    if (this.looksLikeSpanish(text) || this.isMeasurement(text) || this.isNumber(text)) {
      const localTranslation = this.translateLocally(text);
      this.translationCache.set(cacheKey, localTranslation);
      return localTranslation;
    }

    // Intentar traducción local PRIMERO
    const localTranslation = this.translateLocally(text);
    if (localTranslation !== text) {
      this.translationCache.set(cacheKey, localTranslation);
      return localTranslation;
    }

    // Solo usar API para textos largos que no se pudieron traducir localmente
    if (text.length > 10 && !this.looksLikeSpanish(text)) {
      try {
        const apiTranslation = await this.translateWithAPI(text);
        this.translationCache.set(cacheKey, apiTranslation);
        return apiTranslation;
      } catch (error: unknown) {
        console.error('❌ Error en traducción por API, usando local:', error);
      }
    }

    // Fallback a traducción local
    this.translationCache.set(cacheKey, localTranslation);
    return localTranslation;
  }

  // ✅ MÉTODOS AUXILIARES SEGUROS
  private isMeasurement(text: string | undefined | null): boolean {
    if (!this.isValidText(text)) return false;
    
    const measurements = ['tsp', 'tbsp', 'cup', 'c', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'mg', 'qt', 'pt', 'tb', 'sl', 'lg', 'md', 'sm', 'inch'];
    return measurements.some(measure => 
      this.safeIncludes(text.toLowerCase(), measure.toLowerCase())
    );
  }

  private isNumber(text: string | undefined | null): boolean {
    if (!this.isValidText(text)) return false;
    return /^[\d\/\.\s-]+$/.test(text.trim());
  }

  private looksLikeSpanish(text: string | undefined | null): boolean {
    if (!this.isValidText(text)) return false;
    
    const spanishWords = ['y', 'con', 'para', 'por', 'de', 'la', 'el', 'los', 'las', 'del', 'al', 'se', 'que', 'en', 'un', 'una', 'unos', 'unas'];
    const words = text.toLowerCase().split(/\s+/);
    return words.some(word => spanishWords.includes(word)) || 
           /[áéíóúñ]/.test(text);
  }

  private cleanTranslation(translated: string, original: string): string {
    if (!translated || translated.toLowerCase() === original.toLowerCase()) {
      return this.translateLocally(original);
    }
    
    let cleaned = translated
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã/g, 'í')
      .replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
    
    return this.translateLocally(cleaned);
  }

  // ✅ TRADUCCIÓN DE RECETA COMPLETA - VERSIÓN SEGURA
  async translateRecipe(recipe: any): Promise<any> {
    if (this.targetLanguage === 'en' || !recipe) {
      console.log('🌍 No se traduce - idioma inglés o receta vacía');
      return recipe;
    }

    try {
      console.log('🍳 INICIANDO TRADUCCIÓN COMPLETA DE RECETA...');
      
      // ✅ Verificar que la receta existe
      if (!recipe) {
        console.error('❌ Receta es undefined o null');
        return recipe;
      }

      const translatedRecipe = { ...recipe };
      
      // ✅ Traducir título de manera segura
      if (this.isValidText(recipe.title)) {
        const originalTitle = recipe.title;
        translatedRecipe.title = await this.translateText(recipe.title);
        if (originalTitle !== translatedRecipe.title) {
          console.log(`📝 Título: "${originalTitle}" -> "${translatedRecipe.title}"`);
        }
      } else {
        console.log('⚠️ Título de receta inválido:', recipe.title);
      }
      
      // ✅ Traducir descripción de manera segura
      if (this.isValidText(recipe.description)) {
        translatedRecipe.description = await this.translateText(recipe.description);
      }
      
      // ✅ Traducir ingredientes CON VERIFICACIONES SEGURAS
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        console.log('🥕 Traduciendo ingredientes...');
        translatedRecipe.ingredients = await Promise.all(
          recipe.ingredients.map(async (ingredient: any, index: number) => {
            // ✅ Verificar que el ingrediente existe
            if (!ingredient) {
              console.log(`⚠️ Ingrediente ${index + 1} es undefined`);
              return ingredient;
            }

            const translatedIng = { ...ingredient };
            
            // ✅ Traducir nombre de manera segura
            if (this.isValidText(ingredient.name)) {
              const originalName = ingredient.name;
              translatedIng.name = await this.translateText(ingredient.name);
              if (originalName !== translatedIng.name) {
                console.log(`   🥄 Ingrediente ${index + 1}: "${originalName}" -> "${translatedIng.name}"`);
              }
            }
            
            // ✅ Traducir cantidad de manera segura
            if (this.isValidText(ingredient.quantity)) {
              translatedIng.quantity = await this.translateText(ingredient.quantity);
            }
            
            // ✅ Traducir unidad de manera segura
            if (this.isValidText(ingredient.unit)) {
              translatedIng.unit = await this.translateText(ingredient.unit);
            }
            
            return translatedIng;
          })
        );
      } else {
        console.log('⚠️ No hay ingredientes o no es array:', recipe.ingredients);
      }
      
      // ✅ Traducir instrucciones CON VERIFICACIONES SEGURAS
      if (recipe.instructions && Array.isArray(recipe.instructions)) {
        console.log('📋 Traduciendo instrucciones...');
        translatedRecipe.instructions = await Promise.all(
          recipe.instructions.map(async (instruction: any, index: number) => {
            // ✅ Verificar que la instrucción existe
            if (!instruction) {
              console.log(`⚠️ Instrucción ${index + 1} es undefined`);
              return instruction;
            }

            const translatedInst = { ...instruction };
            
            // ✅ Traducir descripción de manera segura
            if (this.isValidText(instruction.description)) {
              const originalDesc = instruction.description;
              translatedInst.description = await this.translateText(instruction.description);
              
              // SOLO LOG si hubo cambios reales
              if (originalDesc !== translatedInst.description) {
                console.log(`   🔹 Paso ${index + 1}: "${originalDesc.substring(0, 40)}..." -> "${translatedInst.description.substring(0, 40)}..."`);
              }
            } else {
              console.log(`⚠️ Descripción de instrucción ${index + 1} inválida:`, instruction.description);
            }
            
            return translatedInst;
          })
        );
      } else {
        console.log('⚠️ No hay instrucciones o no es array:', recipe.instructions);
      }
      
      // ✅ Traducir categoría y dificultad de manera segura
      if (this.isValidText(recipe.category)) {
        translatedRecipe.category = await this.translateText(recipe.category);
      }
      
      if (this.isValidText(recipe.difficulty)) {
        translatedRecipe.difficulty = await this.translateText(recipe.difficulty);
      }
      
      console.log('✅ TRADUCCIÓN DE RECETA COMPLETADA CON ÉXITO');
      return translatedRecipe;
    } catch (error: unknown) {
      console.error('❌ Error crítico en traducción completa:', error);
      return recipe; // ✅ Devolver receta original en caso de error
    }
  }

  // Traducir ingredientes individualmente
  async translateIngredients(ingredients: any[]): Promise<any[]> {
    if (this.targetLanguage === 'en' || !ingredients) {
      return ingredients || [];
    }

    console.log('🥕 Traduciendo lista de ingredientes...');
    
    // ✅ Verificar que ingredients es un array válido
    if (!Array.isArray(ingredients)) {
      console.error('❌ Ingredients no es un array:', ingredients);
      return ingredients;
    }

    const translatedIngredients = await Promise.all(
      ingredients.map(async (ingredient) => {
        // ✅ Verificar que cada ingrediente existe
        if (!ingredient) {
          return ingredient;
        }

        const translated = { ...ingredient };
        if (this.isValidText(ingredient.name)) translated.name = await this.translateText(ingredient.name);
        if (this.isValidText(ingredient.quantity)) translated.quantity = await this.translateText(ingredient.quantity);
        if (this.isValidText(ingredient.unit)) translated.unit = await this.translateText(ingredient.unit);
        return translated;
      })
    );
    
    console.log('✅ Ingredientes traducidos');
    return translatedIngredients;
  }

  // Traducir instrucciones individualmente
  async translateInstructions(instructions: any[]): Promise<any[]> {
    if (this.targetLanguage === 'en' || !instructions) {
      return instructions || [];
    }

    console.log('📝 Traduciendo instrucciones...');
    
    // ✅ Verificar que instructions es un array válido
    if (!Array.isArray(instructions)) {
      console.error('❌ Instructions no es un array:', instructions);
      return instructions;
    }

    const translatedInstructions = await Promise.all(
      instructions.map(async (instruction) => {
        // ✅ Verificar que cada instrucción existe
        if (!instruction) {
          return instruction;
        }

        const translated = { ...instruction };
        if (this.isValidText(instruction.description)) {
          translated.description = await this.translateText(instruction.description);
        }
        return translated;
      })
    );
    
    console.log('✅ Instrucciones traducidas');
    return translatedInstructions;
  }

  // Agregar palabras al diccionario local
  addToDictionary(english: string, spanish: string): void {
    if (this.isValidText(english) && this.isValidText(spanish)) {
      this.localDictionary.set(english.toLowerCase(), spanish);
      console.log(`📖 Agregado al diccionario: "${english}" -> "${spanish}"`);
    } else {
      console.error('❌ No se pudo agregar al diccionario - texto inválido');
    }
  }

  // Obtener estadísticas del diccionario
  getDictionaryStats(): { size: number; language: string } {
    return {
      size: this.localDictionary.size,
      language: this.targetLanguage
    };
  }

  // Forzar limpieza de caché
  clearCache(): void {
    this.translationCache.clear();
    console.log('🧹 Caché de traducción limpiado');
  }

  // ✅ MÉTODO PARA DEBUGGING MEJORADO
  debugTranslation(text: string | undefined | null): void {
    console.log(`🔍 Debug traducción: "${text}"`);
    console.log(`   - Texto válido?: ${this.isValidText(text)}`);
    console.log(`   - Es español?: ${this.looksLikeSpanish(text)}`);
    console.log(`   - Es medida?: ${this.isMeasurement(text)}`);
    console.log(`   - Es número?: ${this.isNumber(text)}`);
    
    if (this.isValidText(text)) {
      console.log(`   - Traducción local: "${this.translateLocally(text)}"`);
    } else {
      console.log(`   - Texto inválido, no se puede traducir`);
    }
  }
}

export const translationService = TranslationService.getInstance();