// backend/models/User.js - VERSIÓN COMPLETA
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema para el perfil personal
const personalInfoSchema = new mongoose.Schema({
  age: {
    type: Number,
    min: [1, 'La edad debe ser mayor a 0'],
    max: [120, 'La edad no puede ser mayor a 120']
  },
  weight: {
    type: Number,
    min: [1, 'El peso debe ser mayor a 0'],
    max: [300, 'El peso no puede ser mayor a 300 kg']
  },
  height: {
    type: Number,
    min: [50, 'La altura debe ser mayor a 50 cm'],
    max: [250, 'La altura no puede ser mayor a 250 cm']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say'
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },
  dailyCalorieGoal: {
    type: Number,
    min: [500, 'Las calorías deben ser mayor a 500'],
    max: [5000, 'Las calorías no pueden ser mayor a 5000'],
    default: 2000
  },
  avatar: {
    type: String,
    default: ''
  }
}, { _id: false });

// Schema para información de salud
const healthInfoSchema = new mongoose.Schema({
  allergies: [{
    type: String,
    trim: true
  }],
  dietaryRestrictions: [{
    type: String,
    trim: true
  }],
  healthConditions: [{
    type: String,
    trim: true
  }],
  healthGoals: [{
    type: String,
    trim: true
  }]
}, { _id: false });

// Schema para preferencias
const preferencesSchema = new mongoose.Schema({
  favoriteCuisines: [{
    type: String,
    trim: true
  }],
  dislikedIngredients: [{
    type: String,
    trim: true
  }],
  cookingSkills: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  preferredCookingTime: {
    type: String,
    enum: ['quick', 'moderate', 'any'],
    default: 'moderate'
  },
  spiceTolerance: {
    type: String,
    enum: ['none', 'mild', 'medium', 'high'],
    default: 'medium'
  }
}, { _id: false });

// Schema principal del perfil
const userProfileSchema = new mongoose.Schema({
  personalInfo: {
    type: personalInfoSchema,
    default: () => ({})
  },
  healthInfo: {
    type: healthInfoSchema,
    default: () => ({
      allergies: [],
      dietaryRestrictions: [],
      healthConditions: [],
      healthGoals: []
    })
  },
  preferences: {
    type: preferencesSchema,
    default: () => ({
      favoriteCuisines: [],
      dislikedIngredients: [],
      cookingSkills: 'beginner'
    })
  },
  bmi: {
    type: Number,
    min: 10,
    max: 50
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Schema principal del usuario
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'El usuario debe tener al menos 3 caracteres'],
    maxlength: [30, 'El usuario no puede tener más de 30 caracteres'],
    match: [/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guiones bajos']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    type: userProfileSchema,
    default: () => ({})
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejor performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'profile.personalInfo.gender': 1 });
userSchema.index({ createdAt: -1 });

// Virtual para calcular BMI
userSchema.virtual('bmiCalculated').get(function() {
  if (this.profile?.personalInfo?.height && this.profile?.personalInfo?.weight) {
    const heightInMeters = this.profile.personalInfo.height / 100;
    return (this.profile.personalInfo.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return null;
});

// Hash password antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado (o es nuevo)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para actualizar lastUpdated del perfil
userSchema.pre('save', function(next) {
  if (this.isModified('profile')) {
    this.profile.lastUpdated = new Date();
    
    // Calcular BMI automáticamente si hay peso y altura
    if (this.profile.personalInfo?.weight && this.profile.personalInfo?.height) {
      const heightInMeters = this.profile.personalInfo.height / 100;
      this.profile.bmi = parseFloat(
        (this.profile.personalInfo.weight / (heightInMeters * heightInMeters)).toFixed(1)
      );
    }
  }
  next();
});

// Método para comparar passwords CON DEBUGGING
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('🔐 COMPARANDO PASSWORDS:');
    console.log('   - Password candidato:', candidatePassword);
    console.log('   - Hash en BD:', this.password ? 'PRESENTE' : 'FALTANTE');
    console.log('   - User ID:', this._id);
    
    if (!this.password) {
      console.log('❌ No hay password hash en el usuario');
      return false;
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('   - Resultado comparación bcrypt:', isMatch);
    
    return isMatch;
  } catch (error) {
    console.error('❌ Error en comparePassword:', error);
    return false;
  }
};

// Método para incrementar contador de login
userSchema.methods.recordLogin = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Método para obtener datos públicos del usuario (sin password)
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method para buscar por email (case insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method para verificar si usuario existe
userSchema.statics.exists = function(emailOrUsername) {
  return this.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase().trim() },
      { username: emailOrUsername.trim() }
    ]
  });
};

// Quitar password del JSON por defecto
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);