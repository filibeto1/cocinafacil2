const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Question = require('../models/Question');

// Obtener preguntas de una receta
router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    const questions = await Question.find({ recipe: recipeId })
      .populate('author', 'username')
      .populate('answers.author', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('Error obteniendo preguntas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener preguntas'
    });
  }
});
// GET /questions/all - Obtener TODAS las preguntas (para admin)
router.get('/all', auth, async (req, res) => {
  try {
    console.log('💬 Obteniendo todas las preguntas para admin');
    
    const questions = await Question.find()
      .populate('author', 'username email role')
      .populate('recipe', 'title')
      .populate('answers.author', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`✅ ${questions.length} preguntas encontradas`);
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('❌ Error obteniendo todas las preguntas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener preguntas'
    });
  }
});
router.get('/all', auth, async (req, res) => {
  try {
    console.log('💬 Obteniendo todas las preguntas para admin');
    console.log('Usuario solicitante:', req.user.username, '- Rol:', req.user.role);
    
    const questions = await Question.find()
      .populate('author', 'username email role')
      .populate('recipe', 'title')
      .populate('answers.author', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`✅ ${questions.length} preguntas encontradas`);
    
    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo todas las preguntas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener preguntas'
    });
  }
});
// Crear nueva pregunta
router.post('/', auth, async (req, res) => {
  try {
    const { recipeId, question } = req.body;

    if (!recipeId || !question) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID y pregunta son requeridos'
      });
    }

    const newQuestion = new Question({
      recipe: recipeId,
      author: req.user._id,
      authorName: req.user.username,
      question: question.trim()
    });

    await newQuestion.save();
    await newQuestion.populate('author', 'username');

    res.status(201).json({
      success: true,
      message: 'Pregunta creada exitosamente',
      question: newQuestion
    });
  } catch (error) {
    console.error('Error creando pregunta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pregunta'
    });
  }
});

// Agregar respuesta a una pregunta
router.post('/:questionId/answers', auth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({
        success: false,
        message: 'La respuesta es requerida'
      });
    }

    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada'
      });
    }

    question.answers.push({
      author: req.user._id,
      authorName: req.user.username,
      answer: answer.trim()
    });

    await question.save();
    await question.populate('answers.author', 'username');

    res.json({
      success: true,
      message: 'Respuesta agregada exitosamente',
      question
    });
  } catch (error) {
    console.error('Error agregando respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar respuesta'
    });
  }
});

// Marcar pregunta como resuelta
router.patch('/:questionId/resolve', auth, async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada'
      });
    }

    // Verificar que el usuario es el autor de la pregunta
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo el autor puede marcar como resuelta'
      });
    }

    question.isResolved = true;
    await question.save();

    res.json({
      success: true,
      message: 'Pregunta marcada como resuelta',
      question
    });
  } catch (error) {
    console.error('Error marcando pregunta como resuelta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar pregunta como resuelta'
    });
  }
});

// Eliminar pregunta (solo autor o admin)
router.delete('/:questionId', auth, async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada'
      });
    }

    // Verificar que el usuario es el autor de la pregunta
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta pregunta'
      });
    }

    await Question.findByIdAndDelete(questionId);

    res.json({
      success: true,
      message: 'Pregunta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando pregunta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar pregunta'
    });
  }
});

module.exports = router;