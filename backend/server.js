// backend/server.js - VERSIÓN COMPLETA CORREGIDA
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// Conectar a MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ============================================================================
// IMPORTAR RUTAS
// ============================================================================
const authRoutes = require('./routes/auth');
const userProfileRoutes = require('./routes/userProfile');
const recipeRoutes = require('./routes/recipes');
const questionRoutes = require('./routes/questions');
const adminRoutes = require('./routes/admin'); // ✅ NUEVO

// ============================================================================
// REGISTRAR RUTAS
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/admin', adminRoutes); // ✅ NUEVO

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🍳 API de Recetas - Servidor funcionando',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      recipes: '/api/recipes',
      questions: '/api/questions',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
// Agregar esta línea después de las otras rutas:
app.use('/api/admin', require('./routes/admin'));
// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log('🚀 Servidor Backend Iniciado');
  console.log('=================================');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`📱 Red: http://192.168.0.105:${PORT}`);
  console.log(`🏥 Health: http://192.168.0.105:${PORT}/api/health`);
  console.log('=================================');
  console.log('📋 Rutas disponibles:');
  console.log('');
  console.log('  🔐 AUTH:');
  console.log('    - POST   /api/auth/login');
  console.log('    - POST   /api/auth/register');
  console.log('    - GET    /api/auth/me');
  console.log('    - POST   /api/auth/logout');
  console.log('');
  console.log('  👤 PERFIL:');
  console.log('    - GET    /api/profile');
  console.log('    - PATCH  /api/profile/personal');
  console.log('    - PATCH  /api/profile/health');
  console.log('    - PATCH  /api/profile/preferences');
  console.log('    - GET    /api/profile/bmi');
  console.log('    - GET    /api/profile/stats');
  console.log('');
  console.log('  🍳 RECETAS:');
  console.log('    - GET    /api/recipes/community');
  console.log('    - GET    /api/recipes/all (admin)');
  console.log('    - GET    /api/recipes/my-recipes');
  console.log('    - GET    /api/recipes/:id');
  console.log('    - POST   /api/recipes');
  console.log('    - POST   /api/recipes/:id/like');
  console.log('    - DELETE /api/recipes/:id');
  console.log('');
  console.log('  💬 PREGUNTAS:');
  console.log('    - GET    /api/questions/all (admin)');
  console.log('    - GET    /api/questions/recipe/:recipeId');
  console.log('    - POST   /api/questions');
  console.log('    - POST   /api/questions/:id/answer');
  console.log('    - DELETE /api/questions/:id');
  console.log('');
  console.log('  👑 ADMIN:');
  console.log('    - GET    /api/admin/users');
  console.log('    - GET    /api/admin/users/:userId');
  console.log('    - PATCH  /api/admin/users/:userId/role');
  console.log('    - PATCH  /api/admin/users/:userId/toggle-status');
  console.log('    - DELETE /api/admin/users/:userId');
  console.log('    - GET    /api/admin/stats');
  console.log('');
  console.log('=================================');
});

module.exports = app;