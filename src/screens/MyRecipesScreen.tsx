// src/screens/MyRecipesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { recipeAPI, Recipe } from '../services/recipeAPI';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const MyRecipesScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadMyRecipes();
    }
  }, [isFocused]);

  const loadMyRecipes = async () => {
    try {
      setLoading(true);
      const recipes = await recipeAPI.getMyRecipes();
      setMyRecipes(recipes);
    } catch (error) {
      console.error('Error cargando mis recetas:', error);
      Alert.alert('Error', 'No se pudieron cargar tus recetas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMyRecipes();
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe._id! });
  };

  const handleDeleteRecipe = (recipeId: string, recipeTitle: string) => {
    Alert.alert(
      'Eliminar Receta',
      `¿Estás seguro de que quieres eliminar "${recipeTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await recipeAPI.deleteRecipe(recipeId);
              // Recargar la lista
              loadMyRecipes();
              Alert.alert('Éxito', 'Receta eliminada correctamente');
            } catch (error) {
              console.error('Error eliminando receta:', error);
              Alert.alert('Error', 'No se pudo eliminar la receta');
            }
          }
        }
      ]
    );
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
    >
      <View style={styles.recipeContent}>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>{item.preparationTime} min</Text>
            <Text style={styles.metadataText}>•</Text>
            <Text style={styles.metadataText}>{item.difficulty}</Text>
            <Text style={styles.metadataText}>•</Text>
            <Text style={styles.metadataText}>{item.category}</Text>
          </View>

          <View style={styles.stats}>
            <Text style={styles.likesText}>❤️ {item.likesCount} likes</Text>
            <Text style={styles.dateText}>
              Creada: {new Date(item.createdAt!).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteRecipe(item._id!, item.title)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando tus recetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍🍳 Mis Recetas</Text>
        <Text style={styles.headerSubtitle}>
          Gestiona las recetas que has creado
        </Text>
      </View>

      <FlatList
        data={myRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item._id!}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>📝</Text>
            <Text style={styles.emptyStateTitle}>No has creado recetas todavía</Text>
            <Text style={styles.emptyStateSubtitle}>
              Comparte tus creaciones culinarias con la comunidad
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateRecipe')}
            >
              <Text style={styles.createButtonText}>Crear Mi Primera Receta</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recipeContent: {
    flexDirection: 'row',
    padding: 16,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  likesText: {
    fontSize: 12,
    color: '#EF4444',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});