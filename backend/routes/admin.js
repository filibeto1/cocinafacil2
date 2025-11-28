// backend/routes/admin.js - NUEVO ARCHIVO
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware para verificar si es admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.log('❌ Acceso denegado: usuario no es admin');
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
};

// Middleware para verificar si es admin o moderador
const isModerator = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    console.log('❌ Acceso denegado: usuario no es admin ni moderador');
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Se requieren permisos de moderador.' 
    });
  }
  next();
};
// Agregar estas rutas al archivo existente:

// ============================================================================
// RUTAS DE MODERACIÓN DE CONTENIDO
// ============================================================================

// GET /admin/recipes/pending - Obtener recetas pendientes de aprobación
router.get('/recipes/pending', auth, isModerator, async (req, res) => {
  try {
    const Recipe = require('../models/Recipe');
    
    const pendingRecipes = await Recipe.find({ isApproved: false })
      .populate('author', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: pendingRecipes
    });
  } catch (error) {
    console.error('❌ Error obteniendo recetas pendientes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener recetas pendientes' 
    });
  }
});

// PATCH /admin/recipes/:recipeId/approve - Aprobar/desaprobar receta
router.patch('/recipes/:recipeId/approve', auth, isModerator, async (req, res) => {
  try {
    const Recipe = require('../models/Recipe');
    const { recipeId } = req.params;
    const { approved } = req.body;
    
    const recipe = await Recipe.findByIdAndUpdate(
      recipeId,
      { isApproved: approved },
      { new: true }
    ).populate('author', 'username email');
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false, 
        message: 'Receta no encontrada' 
      });
    }
    
    res.json({
      success: true,
      message: `Receta ${approved ? 'aprobada' : 'desaprobada'} correctamente`,
      data: recipe
    });
  } catch (error) {
    console.error('❌ Error actualizando receta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar receta' 
    });
  }
});

// GET /admin/questions/pending - Obtener preguntas pendientes de moderación
router.get('/questions/pending', auth, isModerator, async (req, res) => {
  try {
    const Question = require('../models/Question');
    
    const pendingQuestions = await Question.find({ 
      $or: [
        { needsModeration: true },
        { isApproved: false }
      ]
    })
    .populate('user', 'username email')
    .populate('recipeId', 'title')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: pendingQuestions
    });
  } catch (error) {
    console.error('❌ Error obteniendo preguntas pendientes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener preguntas pendientes' 
    });
  }
});

// PATCH /admin/questions/:questionId/moderate - Moderar pregunta
router.patch('/questions/:questionId/moderate', auth, isModerator, async (req, res) => {
  try {
    const Question = require('../models/Question');
    const { questionId } = req.params;
    const { approved, reason } = req.body;
    
    const question = await Question.findByIdAndUpdate(
      questionId,
      { 
        isApproved: approved,
        moderationReason: reason,
        moderatedAt: new Date(),
        moderatedBy: req.user._id
      },
      { new: true }
    ).populate('user', 'username email');
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pregunta no encontrada' 
      });
    }
    
    res.json({
      success: true,
      message: `Pregunta ${approved ? 'aprobada' : 'rechazada'} correctamente`,
      data: question
    });
  } catch (error) {
    console.error('❌ Error moderando pregunta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al moderar pregunta' 
    });
  }
});

// GET /admin/reports - Obtener contenido reportado
router.get('/reports', auth, isModerator, async (req, res) => {
  try {
    // Esto asume que tienes un modelo Report
    // Por ahora retornamos datos de ejemplo
    const reports = [
      {
        id: '1',
        type: 'recipe',
        targetId: 'recipe123',
        targetTitle: 'Receta ofensiva',
        reason: 'Contenido inapropiado',
        reportedBy: 'user456',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('❌ Error obteniendo reportes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener reportes' 
    });
  }
});
// ============================================================================
// RUTAS DE USUARIOS
// ============================================================================

// GET /admin/users - Obtener todos los usuarios (solo admin)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    console.log('📋 Admin solicitando lista de usuarios');
    
    const users = await User.find()
      .select('-password') // No enviar passwords
      .sort({ createdAt: -1 });
    
    console.log(`✅ ${users.length} usuarios encontrados`);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios' 
    });
  }
});

// GET /admin/users/:userId - Obtener usuario específico (solo admin)
router.get('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuario' 
    });
  }
});

// PATCH /admin/users/:userId/role - Cambiar rol de usuario (solo admin)
router.patch('/users/:userId/role', auth, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;
    
    console.log(`🔄 Cambiando rol del usuario ${userId} a ${newRole}`);
    
    // Validar rol
    if (!['user', 'moderator', 'admin'].includes(newRole)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rol inválido. Debe ser: user, moderator o admin' 
      });
    }
    
    // No permitir que un admin se quite sus propios permisos
    if (req.user._id.toString() === userId && newRole !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes cambiar tu propio rol de administrador' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    console.log(`✅ Rol actualizado: ${user.username} -> ${newRole}`);
    
    res.json({
      success: true,
      message: 'Rol actualizado correctamente',
      data: user
    });
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar rol' 
    });
  }
});

// PATCH /admin/users/:userId/toggle-status - Activar/Desactivar usuario (solo admin)
router.patch('/users/:userId/toggle-status', auth, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // No permitir que un admin se desactive a sí mismo
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes desactivar tu propia cuenta' 
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    console.log(`✅ Estado de usuario cambiado: ${user.username} -> ${user.isActive ? 'Activo' : 'Inactivo'}`);
    
    res.json({
      success: true,
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} correctamente`,
      data: {
        id: user._id,
        username: user.username,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('❌ Error cambiando estado de usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar estado de usuario' 
    });
  }
});

// DELETE /admin/users/:userId - Eliminar usuario (solo admin)
router.delete('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // No permitir que un admin se elimine a sí mismo
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes eliminar tu propia cuenta' 
      });
    }
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    console.log(`✅ Usuario eliminado: ${user.username}`);
    
    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar usuario' 
    });
  }
});

// ============================================================================
// ESTADÍSTICAS DEL SISTEMA
// ============================================================================

// GET /admin/stats - Obtener estadísticas del sistema (admin y moderadores)
router.get('/stats', auth, isModerator, async (req, res) => {
  try {
    const Recipe = require('../models/Recipe');
    const Question = require('../models/Question');
    
    const [totalUsers, totalRecipes, totalQuestions, recentUsers] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments(),
      Question.countDocuments(),
      User.countDocuments({ 
        createdAt: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        } 
      })
    ]);
    
    const stats = {
      totalUsers,
      totalRecipes,
      totalQuestions,
      recentUsers,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas' 
    });
  }
});

module.exports = router;