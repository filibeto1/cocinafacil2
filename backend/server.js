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

// Rutas
app.use('/api/auth', require('./routes/auth')); 

// ✅ CORREGIDO: Solo una ruta de perfil
app.use('/api/profile', require('./routes/userProfile')); // Usa userProfile.js

// Otras rutas
const recipeRoutes = require('./routes/recipes');
app.use('/api/recipes', recipeRoutes);

const questionRoutes = require('./routes/questions');
app.use('/api/questions', questionRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
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
  console.log('  - POST   /api/auth/login');
  console.log('  - POST   /api/auth/register');
  console.log('  - GET    /api/profile');
  console.log('  - PATCH  /api/profile/personal');
  console.log('  - PATCH  /api/profile/health');
  console.log('  - PATCH  /api/profile/preferences');
  console.log('  - GET    /api/profile/bmi');
  console.log('  - GET    /api/profile/stats');
  console.log('  - GET    /api/recipes');
  console.log('  - GET    /api/questions');
  console.log('=================================');
});