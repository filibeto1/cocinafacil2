const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const mongoose = require('mongoose');

// ============================================================================
// RUTAS PARA ADMIN - DEBEN IR PRIMERO
// ============================================================================
// GET /recipes/all - Obtener TODAS las recetas (para admin y moderadores)
router.get('/all', auth, async (req, res) => {
  try {
    console.log('📚 Admin/moderador solicitando todas las recetas');
    console.log('Usuario solicitante:', req.user.username, '- Rol:', req.user.role);
    
    // Verificar permisos de administrador o moderador
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      console.log('❌ Acceso denegado: usuario no es admin ni moderador');
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador o moderador.'
      });
    }
    
    // Obtener todas las recetas con información del autor
    const recipes = await Recipe.find()
      .populate('author', 'username email role')
      .sort({ createdAt: -1 });
    
    console.log(`✅ ${recipes.length} recetas encontradas para admin/moderador`);
    
    res.json({
      success: true,
      data: recipes,
      count: recipes.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo todas las recetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas: ' + error.message
    });
  }
});

// ============================================================================
// RUTAS PÚBLICAS/COMUNIDAD
// ============================================================================

// GET /recipes/community - Obtener recetas públicas (comunidad)
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

// Crear nueva receta
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

// Obtener una receta específica
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

// ELIMINAR RECETA - VERSIÓN CORREGIDA DEFINITIVA
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ SOLICITUD DE ELIMINACIÓN - INICIO');
    console.log('👤 Usuario:', req.user.username, '- Rol:', req.user.role);
    console.log('🆔 User ID:', req.user._id, '- Tipo:', typeof req.user._id);
    console.log('📝 Receta ID solicitada:', req.params.id);
    
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      console.log('❌ Receta no encontrada en BD');
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    console.log('✅ Receta encontrada:', recipe.title);
    console.log('👤 Autor de la receta en BD:', recipe.author, '- Tipo:', typeof recipe.author);

    // ✅ COMPARACIÓN SEGURA - CONVERSIÓN EXPLÍCITA
    const recipeAuthorId = recipe.author.toString();
    const currentUserId = req.user._id.toString();
    
    console.log('🔍 IDs convertidos a string:');
    console.log('   - Recipe Author:', recipeAuthorId);
    console.log('   - Current User:', currentUserId);
    
    const isAdmin = req.user.role === 'admin';
    const isModerator = req.user.role === 'moderator';
    const isAuthor = recipeAuthorId === currentUserId;
    
    console.log('🔐 VERIFICACIÓN DE PERMISOS:');
    console.log('   - isAdmin:', isAdmin);
    console.log('   - isModerator:', isModerator);
    console.log('   - isAuthor:', isAuthor);
    console.log('   - IDs iguales:', recipeAuthorId === currentUserId);
    console.log('   - Puede eliminar:', isAdmin || isModerator || isAuthor);
    
    // ✅ VERIFICACIÓN DEFINITIVA DE PERMISOS
    if (!isAuthor && !isAdmin && !isModerator) {
      console.log('❌ USUARIO NO TIENE PERMISOS PARA ELIMINAR');
      console.log('   - No es autor de la receta');
      console.log('   - No es administrador');
      console.log('   - No es moderador');
      
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta receta. Solo el autor, administradores o moderadores pueden eliminar recetas.'
      });
    }

    console.log('✅ PERMISOS CONFIRMADOS - Procediendo a eliminar...');

    // Eliminar la receta
    await Recipe.findByIdAndDelete(req.params.id);

    console.log(`✅ RECETA ELIMINADA: "${recipe.title}" por ${req.user.role}: ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Receta eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ ERROR ELIMINANDO RECETA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar receta: ' + error.message
    });
  }
});

// ACTUALIZAR RECETA - VERSIÓN CORREGIDA
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('📝 SOLICITUD DE ACTUALIZACIÓN - INICIO');
    console.log('👤 Usuario:', req.user.username, '- Rol:', req.user.role);
    console.log('📝 Receta ID:', req.params.id);
    
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      console.log('❌ Receta no encontrada');
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // ✅ COMPARACIÓN SEGURA PARA EDICIÓN
    const recipeAuthorId = recipe.author.toString();
    const currentUserId = req.user._id.toString();
    
    const isAdmin = req.user.role === 'admin';
    const isModerator = req.user.role === 'moderator';
    const isAuthor = recipeAuthorId === currentUserId;
    
    console.log('🔐 Verificación de permisos para edición:', {
      isAdmin, 
      isModerator, 
      isAuthor,
      recipeAuthorId,
      currentUserId
    });
    
    if (!isAuthor && !isAdmin && !isModerator) {
      console.log('❌ Sin permisos para editar');
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta receta'
      });
    }

    // Actualizar campos permitidos
    const allowedUpdates = [
      'title', 
      'description', 
      'ingredients', 
      'instructions', 
      'preparationTime', 
      'servings', 
      'difficulty', 
      'category', 
      'image'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        recipe[field] = req.body[field];
      }
    });

    recipe.updatedAt = Date.now();
    await recipe.save();

    console.log(`✅ Receta "${recipe.title}" actualizada por ${req.user.role}: ${req.user.username}`);

    res.json({
      success: true,
      message: 'Receta actualizada exitosamente',
      recipe
    });
  } catch (error) {
    console.error('❌ Error actualizando receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar receta: ' + error.message
    });
  }
});

// RUTA DE DIAGNÓSTICO - PARA DEBUGGING
router.get('/debug/permissions/:id', auth, async (req, res) => {
  try {
    console.log('🔧 DIAGNÓSTICO DE PERMISOS - INICIO');
    console.log('👤 Usuario:', req.user.username, 'Rol:', req.user.role);
    console.log('🆔 User ID:', req.user._id, 'Tipo:', typeof req.user._id);
    
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.json({
        success: false,
        message: 'Receta no encontrada',
        debug: {
          user: {
            id: req.user._id.toString(),
            username: req.user.username,
            role: req.user.role
          },
          recipeId: req.params.id,
          recipe: null
        }
      });
    }

    console.log('📝 Receta encontrada:', recipe.title);
    console.log('👤 Autor de receta:', recipe.author, 'Tipo:', typeof recipe.author);
    
    // ✅ COMPARACIÓN SEGURA
    const recipeAuthorId = recipe.author.toString();
    const currentUserId = req.user._id.toString();
    
    const isAdmin = req.user.role === 'admin';
    const isModerator = req.user.role === 'moderator';
    const isAuthor = recipeAuthorId === currentUserId;
    
    console.log('🔐 Resultado verificación:', {
      isAdmin, 
      isModerator, 
      isAuthor,
      recipeAuthorId,
      currentUserId,
      idsMatch: recipeAuthorId === currentUserId
    });

    res.json({
      success: true,
      message: 'Diagnóstico completado',
      debug: {
        user: {
          id: currentUserId,
          username: req.user.username,
          role: req.user.role
        },
        recipe: {
          id: recipe._id.toString(),
          title: recipe.title,
          author: recipeAuthorId,
          authorType: typeof recipe.author
        },
        permissions: {
          isAdmin,
          isModerator, 
          isAuthor,
          canDelete: isAdmin || isModerator || isAuthor,
          canDeleteAsAdmin: isAdmin,
          canDeleteAsModerator: isModerator,
          canDeleteAsAuthor: isAuthor
        },
        comparison: {
          recipeAuthorId,
          currentUserId,
          exactMatch: recipeAuthorId === currentUserId,
          stringRepresentations: {
            recipeAuthor: recipeAuthorId,
            currentUser: currentUserId
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Error en diagnóstico',
      error: error.message
    });
  }
});

module.exports = router;