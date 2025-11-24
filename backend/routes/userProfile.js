const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ✅ IMPORTACIÓN CORRECTA - Verifica que la ruta sea exacta
const UserProfile = require('../models/UserProfile');

console.log('✅ UserProfile model loaded:', typeof UserProfile); // Debug

// Middleware de debug
router.use((req, res, next) => {
  console.log('\n=== 🔍 DEBUG PROFILE ROUTE ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🎯 Method:', req.method);
  console.log('🌐 URL:', req.originalUrl);
  console.log('📦 Body:', req.body);
  console.log('👤 User ID:', req.user ? req.user._id : 'NO USER');
  console.log('==============================\n');
  next();
});

// GET - Obtener perfil completo
router.get('/', auth, async (req, res) => {
  try {
    console.log('\n📋 === OBTENIENDO PERFIL ===');
    console.log('👤 Usuario ID:', req.user._id);
    console.log('👤 Usuario:', req.user.username);
    
    // ✅ VERIFICAR QUE UserProfile.findOne ES UNA FUNCIÓN
    console.log('🔍 UserProfile.findOne type:', typeof UserProfile.findOne);
    
    let userProfile = await UserProfile.findOne({ userId: req.user._id });
    console.log('🔍 Perfil encontrado en BD:', userProfile ? 'SI' : 'NO');
    
    if (!userProfile) {
      console.log('📝 Creando perfil por defecto...');
      
      userProfile = new UserProfile({
        userId: req.user._id,
        personalInfo: {
          age: 0,
          weight: 0,
          height: 0,
          gender: '',
          activityLevel: '',
          dailyCalorieGoal: 0,
          goal: 'maintain',
          avatar: '',
          lastUpdated: new Date()
        },
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
      });
      
      await userProfile.save();
      console.log('✅ Perfil creado y guardado en BD');
    } else {
      console.log('✅ Perfil existente encontrado');
    }

    res.json({
      success: true,
      profile: userProfile
    });
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO en GET /profile:');
    console.error('🔴 Tipo:', error.name);
    console.error('🔴 Mensaje:', error.message);
    console.error('🔴 Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// PATCH - Actualizar información personal
router.patch('/personal', auth, async (req, res) => {
  try {
    console.log('\n🎯 === ACTUALIZANDO INFO PERSONAL ===');
    console.log('👤 Usuario:', req.user._id);

    const data = req.body.personalInfo || req.body;
    
    // Validaciones
    if (data.weight !== undefined && isNaN(Number(data.weight))) {
      return res.status(400).json({
        success: false,
        message: 'El peso debe ser un número válido'
      });
    }

    if (data.height !== undefined && isNaN(Number(data.height))) {
      return res.status(400).json({
        success: false,
        message: 'La altura debe ser un número válido'
      });
    }

    if (data.age !== undefined && isNaN(Number(data.age))) {
      return res.status(400).json({
        success: false,
        message: 'La edad debe ser un número válido'
      });
    }

    // Construir objeto de actualización
    const updateFields = {};
    
    if (data.gender !== undefined) updateFields['personalInfo.gender'] = data.gender;
    if (data.activityLevel !== undefined) updateFields['personalInfo.activityLevel'] = data.activityLevel;
    if (data.weight !== undefined) updateFields['personalInfo.weight'] = Number(data.weight);
    if (data.height !== undefined) updateFields['personalInfo.height'] = Number(data.height);
    if (data.age !== undefined) updateFields['personalInfo.age'] = Number(data.age);
    if (data.dailyCalorieGoal !== undefined) updateFields['personalInfo.dailyCalorieGoal'] = Number(data.dailyCalorieGoal);
    if (data.goal !== undefined) updateFields['personalInfo.goal'] = data.goal;
    if (data.avatar !== undefined) updateFields['personalInfo.avatar'] = data.avatar;
    
    updateFields['personalInfo.lastUpdated'] = new Date();
    updateFields['lastUpdated'] = new Date();

    console.log('🔧 Campos a actualizar:', updateFields);

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateFields },
      { 
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    console.log('✅ Perfil actualizado exitosamente');

    res.json({
      success: true,
      message: 'Información personal actualizada exitosamente',
      profile: userProfile
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO en /personal:', error);
    console.error('🔴 Nombre del error:', error.name);
    console.error('🔴 Mensaje:', error.message);
    
    let statusCode = 500;
    let message = 'Error interno del servidor';

    if (error.name === 'ValidationError') {
      statusCode = 400;
      const errors = Object.values(error.errors).map(e => e.message);
      message = 'Error de validación: ' + errors.join(', ');
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Formato de datos inválido: ' + error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message
    });
  }
});

// PATCH - Actualizar información de salud
router.patch('/health', auth, async (req, res) => {
  try {
    console.log('\n🏥 === ACTUALIZANDO INFO DE SALUD ===');
    console.log('👤 Usuario:', req.user._id);

    const data = req.body.healthInfo || req.body;
    
    const updateFields = {};
    
    if (Array.isArray(data.allergies)) {
      updateFields['healthInfo.allergies'] = data.allergies.filter(item => 
        typeof item === 'string' && item.trim() !== ''
      );
    }
    
    if (Array.isArray(data.dietaryRestrictions)) {
      updateFields['healthInfo.dietaryRestrictions'] = data.dietaryRestrictions.filter(item => 
        typeof item === 'string' && item.trim() !== ''
      );
    }
    
    if (Array.isArray(data.healthConditions)) {
      updateFields['healthInfo.healthConditions'] = data.healthConditions.filter(item => 
        typeof item === 'string' && item.trim() !== ''
      );
    }
    
    if (Array.isArray(data.healthGoals)) {
      updateFields['healthInfo.healthGoals'] = data.healthGoals.filter(item => 
        typeof item === 'string' && item.trim() !== ''
      );
    }

    updateFields['lastUpdated'] = new Date();

    console.log('🔧 Campos a actualizar:', updateFields);

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateFields },
      { 
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    console.log('✅ Salud actualizada exitosamente');

    res.json({
      success: true,
      message: 'Información de salud actualizada exitosamente',
      profile: userProfile
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO en /health:', error);
    console.error('🔴 Nombre del error:', error.name);
    console.error('🔴 Mensaje:', error.message);
    
    let statusCode = 500;
    let message = 'Error interno del servidor';

    if (error.name === 'ValidationError') {
      statusCode = 400;
      const errors = Object.values(error.errors).map(e => e.message);
      message = 'Error de validación: ' + errors.join(', ');
    }
    
    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message
    });
  }
});

// PATCH - Actualizar preferencias
router.patch('/preferences', auth, async (req, res) => {
  try {
    console.log('\n🍽️ === ACTUALIZANDO PREFERENCIAS ===');
    console.log('👤 Usuario:', req.user._id);

    const data = req.body.preferences || req.body;
    
    const updateFields = {};
    
    if (Array.isArray(data.favoriteCuisines)) {
      updateFields['preferences.favoriteCuisines'] = data.favoriteCuisines.filter(item => 
        typeof item === 'string' && item.trim() !== ''
      );
    }
    
    if (Array.isArray(data.dislikedIngredients)) {
      updateFields['preferences.dislikedIngredients'] = data.dislikedIngredients.filter(item => 
        typeof item === 'string' && item.trim() !== ''
      );
    }
    
    if (data.cookingSkills) {
      updateFields['preferences.cookingSkills'] = data.cookingSkills;
    }

    updateFields['lastUpdated'] = new Date();

    console.log('🔧 Campos a actualizar:', updateFields);

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateFields },
      { 
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    console.log('✅ Preferencias actualizadas exitosamente');

    res.json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      profile: userProfile
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO en /preferences:', error);
    console.error('🔴 Nombre del error:', error.name);
    console.error('🔴 Mensaje:', error.message);
    
    let statusCode = 500;
    let message = 'Error interno del servidor';

    if (error.name === 'ValidationError') {
      statusCode = 400;
      const errors = Object.values(error.errors).map(e => e.message);
      message = 'Error de validación: ' + errors.join(', ');
    }
    
    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message
    });
  }
});

// GET - Calcular IMC
router.get('/bmi', auth, async (req, res) => {
  try {
    const userProfile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!userProfile || !userProfile.personalInfo.weight || !userProfile.personalInfo.height) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere peso y altura para calcular IMC'
      });
    }

    const bmi = userProfile.calculateBMI();
    
    let category = '';
    if (bmi < 18.5) category = 'Bajo peso';
    else if (bmi < 25) category = 'Peso normal';
    else if (bmi < 30) category = 'Sobrepeso';
    else category = 'Obesidad';

    res.json({
      success: true,
      bmi: bmi.toFixed(1),
      category,
      weight: userProfile.personalInfo.weight,
      height: userProfile.personalInfo.height
    });
  } catch (error) {
    console.error('❌ Error calculando IMC:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular IMC',
      error: error.message
    });
  }
});

// GET - Estadísticas del perfil
router.get('/stats', auth, async (req, res) => {
  try {
    const userProfile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!userProfile) {
      return res.json({
        success: true,
        stats: {
          hasPersonalInfo: false,
          hasHealthInfo: false,
          profileCompletion: 0,
          bmi: null
        }
      });
    }

    let bmi = null;
    if (userProfile.personalInfo.weight && userProfile.personalInfo.height) {
      bmi = userProfile.calculateBMI();
    }

    const stats = {
      hasPersonalInfo: !!(userProfile.personalInfo.age || userProfile.personalInfo.weight || userProfile.personalInfo.height),
      hasHealthInfo: !!(userProfile.healthInfo.allergies.length > 0 || userProfile.healthInfo.healthGoals.length > 0),
      profileCompletion: calculateProfileCompletion(userProfile),
      bmi,
      lastUpdated: userProfile.updatedAt
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

function calculateProfileCompletion(profile) {
  let completion = 0;
  const totalFields = 8;
  
  if (profile.personalInfo.age) completion++;
  if (profile.personalInfo.weight) completion++;
  if (profile.personalInfo.height) completion++;
  if (profile.personalInfo.gender) completion++;
  if (profile.personalInfo.activityLevel) completion++;
  if (profile.healthInfo.allergies.length > 0) completion++;
  if (profile.healthInfo.healthConditions.length > 0) completion++;
  if (profile.healthInfo.healthGoals.length > 0) completion++;

  return Math.round((completion / totalFields) * 100);
}

module.exports = router;