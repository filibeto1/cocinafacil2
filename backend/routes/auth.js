// backend/routes/auth.js - MODIFICAR
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Generar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Health check
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Auth service funcionando',
    timestamp: new Date().toISOString()
  });
});

// Registro
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    console.log('📝 Registro nuevo usuario:', { username, email, role });

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'El email ya está registrado' 
          : 'El nombre de usuario ya existe'
      });
    }

    // VERIFICAR SI ES EL PRIMER USUARIO (será admin automáticamente)
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : role;

    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole
    });

    await user.save();
    const token = generateToken(user._id);

    console.log(`✅ Usuario registrado exitosamente: ${user._id}, Rol: ${assignedRole}`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // ← INCLUIR EL ROL EN LA RESPUESTA
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al registrar usuario'
    });
  }
});

// Login (ACTUALIZAR para incluir el rol)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intento de login:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa email y contraseña'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = generateToken(user._id);

    console.log(`✅ Login exitoso: ${user._id}, Rol: ${user.role}`);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // ← INCLUIR EL ROL EN LA RESPUESTA
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al iniciar sesión'
    });
  }
});

// Obtener usuario actual (ACTUALIZAR para incluir el rol)
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role, // ← INCLUIR EL ROL EN LA RESPUESTA
        profile: req.user.profile
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// Ruta especial para crear administradores (solo para desarrollo)
router.post('/register-admin', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('👑 Creando cuenta de administrador:', { username, email });

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'El email ya está registrado' 
          : 'El nombre de usuario ya existe'
      });
    }

    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'admin'
    });

    await user.save();
    const token = generateToken(user._id);

    console.log(`✅ Administrador creado exitosamente: ${user._id}`);

    res.status(201).json({
      success: true,
      message: 'Cuenta de administrador creada exitosamente',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear administrador'
    });
  }
});

module.exports = router;