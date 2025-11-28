import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { recipeAPI } from '../services/recipeAPI';
import { Recipe } from '../types';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { storage } from '../services/storage';

export const RecipeManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { canManageContent, user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, recipes]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      console.log('📚 Cargando todas las recetas para gestión...');
      console.log('👤 Usuario actual rol:', user?.role);
      
      const allRecipes = await recipeAPI.getAllRecipes();
      console.log(`✅ ${allRecipes.length} recetas cargadas`);
      
      setRecipes(allRecipes);
    } catch (error) {
      console.error('❌ Error cargando recetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las recetas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterRecipes = () => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(query) ||
      recipe.description.toLowerCase().includes(query) ||
      recipe.category.toLowerCase().includes(query) ||
      (typeof recipe.author === 'object' ? 
        recipe.author.username.toLowerCase().includes(query) : 
        recipe.author.toLowerCase().includes(query))
    );
    
    setFilteredRecipes(filtered);
  };

  // FUNCIÓN DE DIAGNÓSTICO TEMPORAL
  const diagnosePermissions = async (recipeId: string) => {
    try {
      console.log('🔧 Ejecutando diagnóstico de permisos...');
      const token = await storage.getToken();
      
      const response = await fetch(`http://localhost:3001/api/recipes/debug/permissions/${recipeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📊 RESULTADO DIAGNÓSTICO:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        Alert.alert(
          '🔧 Diagnóstico de Permisos', 
          `Usuario: ${data.debug.user.username} (${data.debug.user.role})\n\n` +
          `¿Puede eliminar? ${data.debug.permissions.canDelete ? '✅ SÍ' : '❌ NO'}\n` +
          `• Como admin: ${data.debug.permissions.canDeleteAsAdmin ? '✅ SÍ' : '❌ NO'}\n` +
          `• Como moderador: ${data.debug.permissions.canDeleteAsModerator ? '✅ SÍ' : '❌ NO'}\n` +
          `• Como autor: ${data.debug.permissions.canDeleteAsAuthor ? '✅ SÍ' : '❌ NO'}\n\n` +
          `IDs comparados:\n` +
          `• Autor receta: ${data.debug.comparison.recipeAuthorId}\n` +
          `• Usuario actual: ${data.debug.comparison.currentUserId}\n` +
          `• ¿Coinciden? ${data.debug.comparison.exactMatch ? '✅ SÍ' : '❌ NO'}`
        );
      } else {
        Alert.alert('❌ Error en diagnóstico', data.message);
      }
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      Alert.alert('❌ Error', 'No se pudo ejecutar el diagnóstico');
    }
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    if (!canManageContent()) {
      Alert.alert('Acceso Denegado', 'No tienes permisos para eliminar recetas');
      return;
    }
    setSelectedRecipe(recipe);
    setDeleteModalVisible(true);
  };

  // SOLUCIÓN DEFINITIVA PARA ELIMINACIÓN
 const confirmDeleteRecipe = async () => {
  if (!selectedRecipe) return;

  try {
    setActionLoading(selectedRecipe._id!);
    
    console.log('🔐 VERIFICANDO PERMISOS PARA ELIMINAR...');
    console.log('👤 Usuario:', user?.username, 'Rol:', user?.role);
    console.log('📝 Receta a eliminar:', selectedRecipe.title);
    console.log('🆔 ID Receta:', selectedRecipe._id);

    console.log('🗑️ EJECUTANDO ELIMINACIÓN...');
    await recipeAPI.deleteRecipe(selectedRecipe._id!);
    
    console.log('✅ ELIMINACIÓN EXITOSA, ACTUALIZANDO LISTA...');
    
    // ✅ CORRECCIÓN: Usar el patrón funcional para actualizar el estado
    setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe._id !== selectedRecipe._id));
    setFilteredRecipes(prevFiltered => prevFiltered.filter(recipe => recipe._id !== selectedRecipe._id));
    
    setDeleteModalVisible(false);
    setSelectedRecipe(null);
    
    Alert.alert('✅ Éxito', 'Receta eliminada correctamente');
    
  } catch (error: any) {
    console.error('❌ ERROR EN ELIMINACIÓN:', error);
    
    let errorMessage = 'No se pudo eliminar la receta';
    if (error.message?.includes('permiso') || error.message?.includes('403')) {
      errorMessage = '❌ Error de permisos: No tienes autorización para eliminar esta receta.';
    } else if (error.message?.includes('encontrada') || error.message?.includes('404')) {
      errorMessage = 'La receta no fue encontrada en el servidor';
    } else if (error.message?.includes('401')) {
      errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
    
    Alert.alert('❌ Error', errorMessage);
  } finally {
    setActionLoading(null);
  }
};

  // Función corregida para navegar a edición
  const handleEditRecipe = (recipe: Recipe) => {
    console.log('✏️ Navegando a edición de receta:', recipe.title);
    
    // ✅ Navegación segura con verificación
    if (navigation && typeof (navigation as any).navigate === 'function') {
      (navigation as any).navigate('EditRecipe', { recipeId: recipe._id! });
    } else {
      console.error('❌ Navigation no disponible');
    }
  };

  const getAuthorName = (recipe: Recipe): string => {
    if (typeof recipe.author === 'object') {
      return recipe.author.username || 'Anónimo';
    }
    return recipe.authorName || 'Anónimo';
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.recipeMeta}>
          <Text style={styles.recipeAuthor}>por {getAuthorName(item)}</Text>
          <Text style={styles.recipeCategory}>{item.category}</Text>
        </View>
      </View>

      <Text style={styles.recipeDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.recipeStats}>
        <Text style={styles.recipeStat}>
          ⏱ {item.preparationTime} min • 🍽 {item.servings} porciones
        </Text>
        <Text style={styles.recipeStat}>
          ❤️ {item.likesCount} likes • 🎯 {item.difficulty}
        </Text>
        {item.createdAt && (
          <Text style={styles.recipeDate}>
            📅 {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditRecipe(item)}
          disabled={actionLoading === item._id}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.diagnoseButton]}
          onPress={() => diagnosePermissions(item._id!)}
          disabled={actionLoading === item._id}
        >
          <MaterialCommunityIcons name="bug" size={20} color="#8B5CF6" />
          <Text style={styles.actionButtonText}>Diagnosticar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteRecipe(item)}
          disabled={actionLoading === item._id}
        >
          <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {actionLoading === item._id && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </View>
  );

  if (!canManageContent()) {
    return (
      <View style={styles.accessDenied}>
        <MaterialCommunityIcons name="shield-off" size={64} color="#EF4444" />
        <Text style={styles.accessDeniedTitle}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedText}>
          No tienes permisos para gestionar recetas
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🍳 Gestión de Recetas</Text>
        <Text style={styles.subtitle}>
          {recipes.length} recetas en el sistema
        </Text>
        <Text style={styles.userInfo}>
          👤 {user?.username} • {user?.role?.toUpperCase()}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar recetas por título, descripción, categoría o autor..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        <MaterialCommunityIcons name="magnify" size={24} color="#6B7280" />
      </View>

      {/* Recipes List */}
     <FlatList
  data={filteredRecipes}
  renderItem={renderRecipeItem}
  keyExtractor={(item) => item._id || `recipe-${Math.random()}`}
  extraData={filteredRecipes} // ✅ Agregar esta línea
  contentContainerStyle={styles.listContent}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={loadRecipes} />
  }
  ListEmptyComponent={
    <View style={styles.emptyContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : (
        <>
          <MaterialCommunityIcons name="chef-hat" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron recetas' : 'No hay recetas en el sistema'}
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  }
/>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
            <Text style={styles.modalTitle}>¿Eliminar Receta?</Text>
            <Text style={styles.modalText}>
              ¿Estás seguro de que quieres eliminar "{selectedRecipe?.title}"? 
              Esta acción no se puede deshacer.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={!!actionLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={confirmDeleteRecipe}
                disabled={!!actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Eliminar</Text>
                )}
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  recipeHeader: {
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeAuthor: {
    fontSize: 14,
    color: '#6B7280',
  },
  recipeCategory: {
    fontSize: 12,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeStats: {
    marginBottom: 12,
  },
  recipeStat: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  recipeDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
  },
  diagnoseButton: {
    backgroundColor: '#F3E8FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  clearSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  clearSearchText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmDeleteButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});