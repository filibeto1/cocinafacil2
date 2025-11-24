// backend/routes/profile.js - VERSIÓN SIMPLIFICADA
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Obtener perfil completo del usuario
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 Obteniendo perfil completo para:', req.user._id);
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Asegurarse de que el perfil tenga la estructura correcta
    if (!user.profile) {
      user.profile = {
        personalInfo: {},
        healthInfo: {
          allergies: [],
          dietaryRestrictions: [],
          healthConditions: [],
          healthGoals: []
        },
        preferences: {
          favoriteCuisines: [],
          dislikedIngredients: [],
          cookingSkills: 'beginner'
        }
      };
      await user.save();
    }

    console.log('✅ Perfil cargado exitosamente');
    
    res.json({
      success: true,
      profile: user.profile
    });
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
});

// Actualizar perfil completo
router.put('/', auth, async (req, res) => {
  try {
    const { profile } = req.body;

    console.log('🔄 Actualizando perfil completo:', req.user._id);
    console.log('📦 Datos recibidos:', JSON.stringify(profile, null, 2));

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar perfil manteniendo la estructura
    user.profile = {
      personalInfo: profile.personalInfo || user.profile?.personalInfo || {},
      healthInfo: {
        allergies: profile.healthInfo?.allergies || user.profile?.healthInfo?.allergies || [],
        dietaryRestrictions: profile.healthInfo?.dietaryRestrictions || user.profile?.healthInfo?.dietaryRestrictions || [],
        healthConditions: profile.healthInfo?.healthConditions || user.profile?.healthInfo?.healthConditions || [],
        healthGoals: profile.healthInfo?.healthGoals || user.profile?.healthInfo?.healthGoals || []
      },
      preferences: profile.preferences || user.profile?.preferences || {
        favoriteCuisines: [],
        dislikedIngredients: [],
        cookingSkills: 'beginner'
      }
    };

    await user.save();

    console.log('✅ Perfil actualizado exitosamente');
    console.log('💾 Perfil guardado:', JSON.stringify(user.profile, null, 2));

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      profile: user.profile
    });
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
});

// Actualizar información personal
router.patch('/personal', auth, async (req, res) => {
  try {
    const personalInfo = req.body;

    console.log('🎯 Actualizando info personal:', req.user._id);
    console.log('📊 Datos personales:', personalInfo);

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Inicializar perfil si no existe
    if (!user.profile) {
      user.profile = {
        personalInfo: {},
        healthInfo: {
          allergies: [],
          dietaryRestrictions: [],
          healthConditions: [],
          healthGoals: []
        },
        preferences: {
          favoriteCuisines: [],
          dislikedIngredients: [],
          cookingSkills: 'beginner'
        }
      };
    }

    // Actualizar información personal
    user.profile.personalInfo = {
      ...user.profile.personalInfo,
      ...personalInfo
    };

    await user.save();

    console.log('✅ Información personal actualizada');

    res.json({
      success: true,
      message: 'Información personal actualizada',
      profile: user.profile
    });
  } catch (error) {
    console.error('❌ Error actualizando info personal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar información personal'
    });
  }
});
// Actualizar preferencias
router.patch('/preferences', auth, async (req, res) => {
  try {
    const { preferences } = req.body;

    console.log('🍽️ Actualizando preferencias para:', req.user._id);
    console.log('📊 Preferencias recibidas:', JSON.stringify(preferences, null, 2));

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Inicializar perfil si no existe
    if (!user.profile) {
      user.profile = {
        personalInfo: {},
        healthInfo: {
          allergies: [],
          dietaryRestrictions: [],
          healthConditions: [],
          healthGoals: []
        },
        preferences: {
          favoriteCuisines: [],
          dislikedIngredients: [],
          cookingSkills: 'beginner'
        }
      };
    }

    // Actualizar preferencias
    user.profile.preferences = {
      favoriteCuisines: preferences.favoriteCuisines || [],
      dislikedIngredients: preferences.dislikedIngredients || [],
      cookingSkills: preferences.cookingSkills || 'beginner'
    };

    await user.save();

    console.log('✅ Preferencias actualizadas exitosamente');
    console.log('💾 Preferencias guardadas:', user.profile.preferences);

    res.json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      profile: user.profile
    });
  } catch (error) {
    console.error('❌ Error actualizando preferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar preferencias',
      error: error.message
    });
  }
});
router.patch('/health', auth, async (req, res) => {
  try {
    // El frontend envía { healthInfo: {...} }
    const healthInfo = req.body.healthInfo || req.body;

    console.log('🏥 Actualizando info salud:', req.user._id);
    console.log('📊 Datos salud recibidos:', JSON.stringify(healthInfo, null, 2));

    let userProfile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!userProfile) {
      console.log('📝 Creando nuevo perfil...');
      userProfile = new UserProfile({
        userId: req.user._id,
        personalInfo: {},
        healthInfo: healthInfo,
        preferences: {
          favoriteCuisines: [],
          dislikedIngredients: []
        }
      });
    } else {
      console.log('📝 Perfil existente encontrado, actualizando...');
      console.log('📋 Datos ANTES de actualizar:', userProfile.healthInfo);
      
      // Fusionar los datos nuevos con los existentes
      const currentHealthInfo = userProfile.healthInfo.toObject();
      userProfile.healthInfo = {
        allergies: healthInfo.allergies !== undefined ? healthInfo.allergies : currentHealthInfo.allergies,
        dietaryRestrictions: healthInfo.dietaryRestrictions !== undefined ? healthInfo.dietaryRestrictions : currentHealthInfo.dietaryRestrictions,
        healthConditions: healthInfo.healthConditions !== undefined ? healthInfo.healthConditions : currentHealthInfo.healthConditions,
        healthGoals: healthInfo.healthGoals !== undefined ? healthInfo.healthGoals : currentHealthInfo.healthGoals
      };
      
      console.log('📋 Datos DESPUÉS de actualizar:', userProfile.healthInfo);
    }

    // Marcar como modificado para que Mongoose lo guarde
    userProfile.markModified('healthInfo');
    
    const savedProfile = await userProfile.save();
    console.log('✅ Perfil guardado exitosamente en DB');
    console.log('💾 Datos guardados en DB:', savedProfile.healthInfo);

    res.json({
      success: true,
      message: 'Información de salud actualizada',
      profile: savedProfile
    });
  } catch (error) {
    console.error('❌ Error actualizando info salud:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar información de salud',
      error: error.message
    });
  }
});

module.exports = router;