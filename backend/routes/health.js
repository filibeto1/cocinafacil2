const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// @desc    Verificar salud del servidor y base de datos
// @route   GET /api/health
// @access  Public
router.get('/', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      success: true,
      message: 'Servidor funcionando correctamente',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
});

module.exports = router;