const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Receta sin título'
  },
  description: {
    type: String,
    required: true,
    default: 'Descripción no disponible'
  },
  ingredients: [{
    name: {
      type: String,
      default: 'Ingrediente sin nombre'
    },
    quantity: {
      type: String,
      default: ''
    },
    unit: {
      type: String,
      default: ''
    }
  }],
  instructions: [{
    step: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true,
      default: 'Instrucción no disponible'
    }
  }],
  preparationTime: {
    type: Number,
    required: true,
    default: 30
  },
  servings: {
    type: Number,
    required: true,
    default: 1
  },
  difficulty: {
    type: String,
    enum: ['Fácil', 'Medio', 'Difícil'],
    required: true,
    default: 'Medio'
  },
  category: {
    type: String,
    enum: ['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack', 'Bebida', 'General'], // ✅ AGREGADO 'General'
    required: true,
    default: 'General'
  },
  image: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true,
    default: 'Anónimo'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices para mejor performance
recipeSchema.index({ title: 'text', description: 'text' });
recipeSchema.index({ category: 1 });
recipeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Recipe', recipeSchema);