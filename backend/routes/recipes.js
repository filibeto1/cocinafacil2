const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const mongoose = require('mongoose');

// Obtener todas las recetas de la comunidad
router.get('/community', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const skip = (page - 1) * limit;

    console.log(`🔍 Buscando recetas - Página: ${page}, Límite: ${limit}, Categoría: ${category || 'Todas'}`);
    
    let query = {};
    if (category && category.trim() !== '') {
      query.category = category;
    }
    
    const recipes = await Recipe.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalRecipes = await Recipe.countDocuments(query);
    const totalPages = Math.ceil(totalRecipes / limit);

    const validatedRecipes = recipes.map(recipe => {
      const recipeObj = recipe.toObject();
      return {
        ...recipeObj,
        title: recipeObj.title || 'Receta sin título',
        description: recipeObj.description || 'Descripción no disponible',
        ingredients: recipeObj.ingredients || [],
        instructions: recipeObj.instructions || [],
        category: recipeObj.category || 'General',
        difficulty: recipeObj.difficulty || 'Medio',
        preparationTime: recipeObj.preparationTime || 30,
        servings: recipeObj.servings || 1,
        likesCount: recipeObj.likesCount || 0,
        authorName: recipeObj.authorName || (recipeObj.author && recipeObj.author.username) || 'Anónimo'
      };
    });
    
    console.log(`✅ Enviando ${validatedRecipes.length} recetas de ${totalRecipes} totales`);
    
    res.json({
      success: true,
      recipes: validatedRecipes,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecipes: totalRecipes,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo recetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas'
    });
  }
});

// Obtener recetas del usuario actual
router.get('/my-recipes', auth, async (req, res) => {
  try {
    const recipes = await Recipe.find({ author: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Error obteniendo recetas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus recetas'
    });
  }
});

// GET /api/recipes/search - VERSIÓN CORREGIDA Y FUNCIONAL
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Búsqueda recibida:', { q, page, limit });

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }

    const searchRegex = new RegExp(q, 'i');
    
    // QUERY SIMPLIFICADA Y FUNCIONAL
    const searchQuery = {
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    };

    console.log('📋 Query de búsqueda simplificada:', searchQuery);

    // Ejecutar búsqueda
    const recipes = await Recipe.find(searchQuery)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalRecipes = await Recipe.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalRecipes / limit);

    console.log(`✅ Búsqueda exitosa: ${recipes.length} resultados para "${q}"`);

    // Validar y limpiar datos
    const validatedRecipes = recipes.map(recipe => ({
      _id: recipe._id,
      title: recipe.title || 'Receta sin título',
      description: recipe.description || 'Descripción no disponible',
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      category: recipe.category || 'General',
      difficulty: recipe.difficulty || 'Medio',
      preparationTime: recipe.preparationTime || 30,
      servings: recipe.servings || 1,
      likesCount: recipe.likesCount || 0,
      authorName: recipe.authorName || (recipe.author && recipe.author.username) || 'Anónimo',
      image: recipe.image || '',
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt
    }));

    res.json({
      success: true,
      recipes: validatedRecipes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecipes,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    console.error('📌 Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor en búsqueda',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } 
});

// GET /api/recipes/diagnostic/search-test
router.get('/diagnostic/search-test', async (req, res) => {
  try {
    const { q = 'Tacos' } = req.query;
    
    console.log('🔧 DIAGNÓSTICO - Probando búsqueda con:', q);
    
    // 1. Verificar conexión a DB
    const dbStatus = mongoose.connection.readyState;
    console.log('📊 Estado de MongoDB:', dbStatus === 1 ? 'Conectado' : 'Desconectado');
    
    // 2. Contar recetas totales
    const totalRecipes = await Recipe.countDocuments();
    console.log('📈 Total de recetas en DB:', totalRecipes);
    
    // 3. Mostrar algunas recetas de ejemplo
    const sampleRecipes = await Recipe.find().limit(2).select('title category');
    console.log('📝 Recetas de ejemplo:', sampleRecipes);
    
    // 4. Intentar búsqueda simple
    const searchRegex = new RegExp(q, 'i');
    const searchResults = await Recipe.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    }).limit(3).select('title category ingredients.name');
    
    console.log('🔍 Resultados de búsqueda:', searchResults.length);
    
    res.json({
      success: true,
      diagnostic: {
        dbConnected: dbStatus === 1,
        totalRecipes,
        sampleRecipes,
        searchQuery: q,
        searchResults: searchResults.length,
        results: searchResults
      }
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// En routes/recipes.js - VERIFICAR LA RUTA POST
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 Recibiendo solicitud para crear receta:', req.body);
    console.log('👤 Usuario autenticado:', req.user.username);
    
    const {
      title,
      description,
      ingredients,
      instructions,
      preparationTime,
      servings,
      difficulty,
      category,
      image
    } = req.body;

    // ✅ VALIDACIÓN ADICIONAL
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Título y descripción son requeridos'
      });
    }

    const recipe = new Recipe({
      title,
      description,
      ingredients: ingredients || [],
      instructions: instructions || [],
      preparationTime: preparationTime || 30,
      servings: servings || 4,
      difficulty: difficulty || 'Medio',
      category: category || 'General',
      image: image || '',
      author: req.user._id,
      authorName: req.user.username
    });

    await recipe.save();

    console.log('✅ Receta guardada en BD:', recipe.title);

    res.status(201).json({
      success: true,
      message: 'Receta creada exitosamente',
      recipe
    }); 
  } catch (error) {
    console.error('❌ Error creando receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear receta: ' + error.message
    });
  }
});

// Obtener una receta específica - ✅ ESTA RUTA DEBE IR DESPUÉS DE LAS RUTAS ESPECÍFICAS
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Buscando receta en BD con ID:', req.params.id);
    
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'username');
    
    if (!recipe) {
      console.log('❌ Receta NO encontrada en BD');
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    console.log('✅ Receta encontrada en BD:', recipe.title);
    console.log('📊 Datos de la receta:', {
      titulo: recipe.title,
      ingredientes: recipe.ingredients.length,
      instrucciones: recipe.instructions.length,
      autor: recipe.authorName
    });

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('❌ Error obteniendo receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener receta'
    });
  }
});

// Like/Unlike a receta
router.post('/:id/like', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    const hasLiked = recipe.likes.includes(req.user._id);
    
    if (hasLiked) {
      recipe.likes = recipe.likes.filter(like => 
        like.toString() !== req.user._id.toString()
      );
      recipe.likesCount = Math.max(0, recipe.likesCount - 1);
    } else {
      recipe.likes.push(req.user._id);
      recipe.likesCount += 1;
    }

    await recipe.save();

    res.json({
      success: true,
      likesCount: recipe.likesCount,
      hasLiked: !hasLiked
    });
  } catch (error) {
    console.error('Error en like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar like'
    });
  }
});

// Eliminar receta
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta receta'
      });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Receta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar receta'
    });
  }
});

module.exports = router;