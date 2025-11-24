import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { recipeAPI, Recipe, PaginatedResponse } from '../services/recipeAPI';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const CommunityRecipesScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async (page: number = 1, isRefreshing: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      console.log(`📥 Cargando recetas - Página ${page}`);
      const response: PaginatedResponse = await recipeAPI.getCommunityRecipes(page, 10);
      
      if (page === 1) {
        setRecipes(response.recipes);
      } else {
        setRecipes(prev => [...prev, ...response.recipes]);
      }
      
      setCurrentPage(page);
      setHasMore(response.pagination.hasNextPage);
      
      console.log(`✅ Página ${page} cargada. Más páginas: ${response.pagination.hasNextPage}`);
      console.log(`📊 Total de recetas cargadas: ${recipes.length + response.recipes.length}`);

    } catch (error) {
      console.error('❌ Error cargando recetas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      
      if (page === 1) {
        Alert.alert('Error', 'No se pudieron cargar las recetas');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    console.log('🔄 Refrescando recetas...');
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadRecipes(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !error) {
      console.log('📥 Cargando más recetas...');
      loadRecipes(currentPage + 1);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    console.log('👆 Receta seleccionada:', recipe.title);
    navigation.navigate('RecipeDetail', { recipeId: recipe._id! });
  };

  const handleLike = async (recipeId: string) => {
    try {
      console.log('❤️ Dando like a receta:', recipeId);
      await recipeAPI.toggleLike(recipeId);
      // Recargar primera página para actualizar likes
      loadRecipes(1, true);
    } catch (error) {
      console.error('Error dando like:', error);
      Alert.alert('Error', 'No se pudo procesar el like');
    }
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
    >
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.recipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>🍳</Text>
          </View>
        )}
      </View>

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

        <View style={styles.footer}>
          <Text style={styles.authorText}>Por: {item.authorName}</Text>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={(e) => {
              e.stopPropagation(); // Evita que se active el onPress de la tarjeta
              handleLike(item._id!);
            }}
          >
            <Text style={styles.likeText}>❤️ {item.likesCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.footerLoaderText}>Cargando más recetas...</Text>
        </View>
      );
    }
    
    if (!hasMore && recipes.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.noMoreText}>🎉 ¡Has visto todas las recetas!</Text>
        </View>
      );
    }
    
    return null;
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>🍽️</Text>
        <Text style={styles.emptyStateTitle}>No hay recetas todavía</Text>
        <Text style={styles.emptyStateSubtitle}>
          Sé el primero en compartir una receta con la comunidad
        </Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateRecipe')}
        >
          <Text style={styles.createButtonText}>Crear Primera Receta</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderErrorState = () => {
    if (!error) return null;
    
    return (
      <View style={styles.errorState}>
        <Text style={styles.errorStateText}>❌</Text>
        <Text style={styles.errorStateTitle}>Error al cargar recetas</Text>
        <Text style={styles.errorStateSubtitle}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => loadRecipes(1, true)}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando recetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍳 Recetas de la Comunidad</Text>
        <Text style={styles.headerSubtitle}>
          Descubre recetas creadas por otros chefs
        </Text>
      </View>

      {error && recipes.length === 0 ? (
        renderErrorState()
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item._id!}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={true}
        />
      )}
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
    padding: 20,
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
    flexGrow: 1,
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
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  noImageText: {
    fontSize: 48,
  },
  recipeInfo: {
    padding: 16,
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
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  likeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  noMoreText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorStateText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});