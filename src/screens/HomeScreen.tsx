import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<{name: string; icon: string; color: string; image?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredRecipes, setFeaturedRecipes] = useState<number>(0);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      // Categorías predefinidas para la app de recetas comunitarias
      const defaultCategories = [
        { name: 'Desayuno', icon: '🥞', color: '#FBBF24' },
        { name: 'Almuerzo', icon: '🍲', color: '#EF4444' },
        { name: 'Cena', icon: '🍽️', color: '#3B82F6' },
        { name: 'Postre', icon: '🍰', color: '#8B5CF6' },
        { name: 'Snack', icon: '🍿', color: '#10B981' },
        { name: 'Bebida', icon: '🥤', color: '#84CC16' }
      ];
      
      setCategories(defaultCategories);
      
      // Para una app real, aquí cargarías las recetas de la comunidad
      // const communityRecipes = await recipeAPI.getCommunityRecipes();
      // setFeaturedRecipes(communityRecipes.length);
      
      // Por ahora, un número simulado
      setFeaturedRecipes(25);
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      // Categorías de respaldo
      setCategories([
        { name: 'Desayuno', icon: '🥞', color: '#FBBF24' },
        { name: 'Almuerzo', icon: '🍲', color: '#EF4444' },
        { name: 'Cena', icon: '🍽️', color: '#3B82F6' },
        { name: 'Postre', icon: '🍰', color: '#8B5CF6' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando CocinaFácil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con Logo CocinaFácil */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🍳</Text>
          <Text style={styles.appName}>CocinaFácil</Text>
        </View>
        <Text style={styles.welcome}>
          {isAuthenticated ? `¡Hola, ${user?.username}!` : '¡Bienvenido!'}
        </Text>
        <Text style={styles.subtitle}>
          Descubre y comparte recetas con la comunidad
        </Text>
        <Text style={styles.apiInfo}>
          🍳 +{featuredRecipes} recetas comunitarias • 👨‍🍳 Chefs activos • 📱 Fácil de usar
        </Text>
      </View>

      {/* Categorías */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorías</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.categoryCard, { backgroundColor: category.color }]}
              onPress={() => navigation.navigate('Recipes', { category: category.name })}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Recipes')}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>Buscar Recetas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CommunityRecipes')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Comunidad</Text>
          </TouchableOpacity>

          {isAuthenticated ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('CreateRecipe')}
              >
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionText}>Crear Receta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('MyRecipes')}
              >
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionText}>Mis Recetas</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.actionIcon}>🔐</Text>
                <Text style={styles.actionText}>Iniciar Sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionText}>Registrarse</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Información de la App */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre CocinaFácil</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            • Recetas creadas por la comunidad{'\n'}
            • Comparte tus creaciones culinarias{'\n'}
            • Descubre nuevas recetas cada día{'\n'}
            • Da like a tus recetas favoritas{'\n'}
            • Totalmente gratuito{'\n'}
            • Comunidad activa de chefs
          </Text>
        </View>
        
        {isAuthenticated && (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Consejo del Chef</Text>
            <Text style={styles.tipText}>
              Completa tu perfil de salud para recibir recomendaciones personalizadas según tus alergias y preferencias dietéticas.
            </Text>
          </View>
        )}
      </View>

      {/* Estadísticas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nuestra Comunidad</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>+{featuredRecipes}</Text>
            <Text style={styles.statLabel}>Recetas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categorías</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Chefs</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>CocinaFácil - Tu comunidad culinaria</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  apiInfo: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 6,
  },
  categoryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  tipCard: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});