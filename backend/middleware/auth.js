const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - Headers:', req.headers);
    
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.log('❌ No Authorization header provided');
      return res.status(401).json({ message: 'Acceso denegado. No token proporcionado.' });
    }

    // Manejar diferentes formatos de token
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }

    if (!token) {
      console.log('❌ No token found in Authorization header');
      return res.status(401).json({ message: 'Acceso denegado. Token no válido.' });
    }

    console.log('🔑 Token recibido:', token.substring(0, 20) + '...');

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('✅ Token decodificado:', decoded);

    // Buscar usuario
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({ message: 'Token no válido. Usuario no encontrado.' });
    }

    console.log('✅ Usuario autenticado:', user._id, user.username);
    
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    
    res.status(401).json({ message: 'Token no válido.' });
  }
};

module.exports = auth;