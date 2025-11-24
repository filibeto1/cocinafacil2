// src/screens/RecipesScreen.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, 
  TouchableOpacity, Modal, ScrollView, Alert 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Recipe } from '../types';
import { recipeAPI } from '../services/recipeAPI';
import { RecipeCard } from '../components/RecipeCard';
import { RecipesScreenNavigationProp, RootStackParamList } from '../types/navigation';

type RecipesScreenRouteProp = RouteProp<RootStackParamList, 'Recipes'>;

export const RecipesScreen: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const navigation = useNavigation<RecipesScreenNavigationProp>();
  const route = useRoute<RecipesScreenRouteProp>();
  const category = route.params?.category;

  const categories = [
    'Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack', 'Bebida'
  ];

  const removeDuplicateRecipes = (recipes: Recipe[]): Recipe[] => {
    const seen = new Set();
    return recipes.filter(recipe => {
      const key = recipe._id || recipe.title;
      if (seen.has(key)) {
        console.log('Eliminando receta duplicada:', key);
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const loadRecipes = async (reset: boolean = false, categoryOverride?: string) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setSearchLoading(true);
      }

      const page = reset ? 1 : currentPage;
      const categoryToUse = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      
      let data;
      
      if (searchQuery && searchQuery.trim() !== '') {
        console.log(`Buscando: "${searchQuery}" - Página: ${page}`);
        data = await recipeAPI.searchRecipes(searchQuery, page, 10);
      } else {
        console.log(`Cargando recetas - Categoría: ${categoryToUse || 'Todas'} - Página: ${page}`);
        data = await recipeAPI.getCommunityRecipes(page, 10, categoryToUse);
      }
      
      const uniqueRecipes = removeDuplicateRecipes(data.recipes);
      
      if (reset) {
        setRecipes(uniqueRecipes);
      } else {
        setRecipes(prev => removeDuplicateRecipes([...prev, ...uniqueRecipes]));
      }
      
      setHasMore(data.pagination.hasNextPage);
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
      
      console.log(`${uniqueRecipes.length} recetas únicas cargadas`);
      
    } catch (error) {
      console.error('Error cargando recetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las recetas. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    setSelectedCategory(category || '');
    setCurrentPage(1);
    setRecipes([]);
    loadRecipes(true, category || '');
  }, [category]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecipes(true);
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.trim() === '') {
      setSearchQuery('');
      await loadRecipes(true);
      return;
    }

    await loadRecipes(true);
  };

  const handleCategorySelect = async (category: string) => {
    const newCategory = selectedCategory === category ? '' : category;
    setSelectedCategory(newCategory);
    setSearchQuery('');
    setCurrentPage(1);
    setShowFilters(false);
    
    // Esperar un poco para que el estado se actualice antes de cargar
    setTimeout(async () => {
      await loadRecipes(true);
    }, 100);
  };

  const clearFilters = async () => {
    setSelectedCategory('');
    setSearchQuery('');
    setCurrentPage(1);
    await loadRecipes(true, '');
  };

  const handleRecipePress = (recipe: Recipe) => {
    if (!recipe || !recipe._id) {
      console.error('Receta inválida para navegar:', recipe);
      Alert.alert('Error', 'No se puede ver esta receta');
      return;
    }
    
    navigation.navigate('RecipeDetail', { recipeId: recipe._id });
  };

  const loadMoreRecipes = () => {
    if (!loading && !searchLoading && hasMore) {
      loadRecipes(false);
    }
  };

  const renderRecipeItem = ({ item, index }: { item: Recipe; index: number }) => {
    if (!item || !item.title) {
      console.log('Receta inválida en render:', item);
      return null;
    }
    
    return (
      <RecipeCard 
        recipe={item} 
        onPress={() => handleRecipePress(item)} 
      />
    );
  };

  const renderFooter = () => {
    if (!hasMore && recipes.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>No hay más recetas</Text>
        </View>
      );
    }
    
    if (searchLoading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.footerText}>Cargando más recetas...</Text>
        </View>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando recetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar recetas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            editable={!searchLoading}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setShowFilters(true)}
            disabled={searchLoading}
          >
            <Text>📁</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.searchButton, searchLoading && styles.searchButtonDisabled]} 
            onPress={handleSearch}
            disabled={searchLoading}
          >
            <Text style={styles.searchButtonText}>{searchLoading ? '⏳' : '🔍'}</Text>
          </TouchableOpacity>
        </View>
        
        {searchLoading && (
          <View style={styles.searchLoading}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.searchLoadingText}>
              {searchQuery ? `Buscando "${searchQuery}"...` : 'Cargando recetas...'}
            </Text>
          </View>
        )}

        {(selectedCategory || searchQuery) && (
          <View style={styles.filtersInfo}>
            <Text style={styles.filtersText} numberOfLines={2}>
              {selectedCategory && `Categoría: ${selectedCategory} `}
              {searchQuery && `Búsqueda: "${searchQuery}"`}
            </Text>
            <TouchableOpacity onPress={clearFilters} disabled={searchLoading}>
              <Text style={[styles.clearText, searchLoading && styles.clearTextDisabled]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={recipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item, index) => {
          if (item._id && item._id.trim() !== '') {
            return `recipe-${item._id}-${index}`;
          }
          return `recipe-temp-${index}-${Math.random().toString(36).substr(2, 9)}`;
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={loadMoreRecipes}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchLoading 
                ? 'Buscando recetas...' 
                : searchQuery 
                  ? `No se encontraron recetas para "${searchQuery}"`
                  : 'No se encontraron recetas'
              }
            </Text>
            {!searchLoading && (
              <TouchableOpacity style={styles.retryButton} onPress={() => loadRecipes(true)}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por Categoría</Text>
            
            <ScrollView style={styles.categoriesList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category && styles.categoryItemSelected
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchButton: {
    padding: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    marginLeft: 4,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#6B7280',
    borderRadius: 8,
    marginLeft: 4,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  searchLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  filtersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  filtersText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  clearText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  clearTextDisabled: {
    color: '#9CA3AF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1F2937',
  },
  categoriesList: {
    maxHeight: 300,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryItemSelected: {
    backgroundColor: '#3B82F6',
  },
  categoryText: {
    fontSize: 16,
    color: '#374151',
  },
  categoryTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#6B7280',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white', 
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RecipesScreen;