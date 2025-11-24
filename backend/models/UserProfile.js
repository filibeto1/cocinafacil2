const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    age: {
      type: Number,
      default: 0
    },
    weight: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    gender: {
      type: String,
      default: ''
    },
    activityLevel: {
      type: String,
      default: ''
    },
    dailyCalorieGoal: {
      type: Number,
      default: 0
    },
    goal: {
      type: String,
      default: 'maintain'
    },
    avatar: {
      type: String,
      default: ''
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  healthInfo: {
    allergies: [String],
    dietaryRestrictions: [String],
    healthConditions: [String],
    healthGoals: [String]
  },
  preferences: {
    favoriteCuisines: [String],
    dislikedIngredients: [String],
    cookingSkills: {
      type: String,
      default: 'beginner'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Método para calcular IMC
userProfileSchema.methods.calculateBMI = function() {
  if (!this.personalInfo.weight || !this.personalInfo.height || this.personalInfo.height === 0) {
    return 0;
  }
  const heightInMeters = this.personalInfo.height / 100;
  return this.personalInfo.weight / (heightInMeters * heightInMeters);
};

// Asegurar que el modelo se exporte correctamente
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
module.exports = UserProfile;