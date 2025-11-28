// backend/routes/auth.js - VERSIÓN CON DEBUGGING MEJORADO
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

// Login
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
      console.log('❌ Usuario no encontrado:', email);
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('👤 Usuario encontrado:', {
      id: user._id,
      username: user.username,
      role: user.role,
      hasPassword: !!user.password
    });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Password inválido para:', email);
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = generateToken(user._id);

    // ✅ RESPUESTA COMPLETA CON ROL
    const responseData = {
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // ← ASEGURAR QUE ROLE SE ENVÍE
        profile: user.profile
      }
    };

    console.log('✅ Login exitoso:', {
      userId: user._id,
      username: user.username,
      role: user.role,
      tokenLength: token.length
    });

    console.log('📤 Enviando respuesta con rol:', responseData.user.role);

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al iniciar sesión'
    });
  }
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

    // VERIFICAR SI ES EL PRIMER USUARIO
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : role;

    console.log('👥 Usuarios existentes:', userCount);
    console.log('👑 Rol asignado:', assignedRole);

    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole
    });

    await user.save();
    const token = generateToken(user._id);

    console.log(`✅ Usuario registrado exitosamente:`, {
      id: user._id,
      username: user.username,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
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
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al registrar usuario'
    });
  }
});

// Obtener usuario actual
router.get('/me', auth, async (req, res) => {
  try {
    console.log('📋 Obteniendo datos del usuario:', req.user._id);
    console.log('   - Rol actual:', req.user.role);
    
    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
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

// ✅ NUEVA RUTA: Actualizar rol de usuario (solo admin)
router.patch('/users/:userId/role', auth, async (req, res) => {
  try {
    // Verificar que quien hace la petición es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { userId } = req.params;
    const { newRole } = req.body;

    if (!['user', 'moderator', 'admin'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    console.log('🚪 Logout de usuario:', req.user._id);
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

module.exports = router;