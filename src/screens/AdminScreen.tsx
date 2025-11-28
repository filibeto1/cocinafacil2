// src/screens/AdminScreen.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { recipeAPI } from '../services/recipeAPI';
import { questionAPI } from '../services/questionAPI';
import { userAPI } from '../services/userAPI';

interface SystemStats {
  totalRecipes: number;
  totalQuestions: number;
  totalUsers: number;
  totalAdmins: number;
  totalModerators: number;
  activeUsers: number;
  recipesThisMonth: number;
  questionsThisMonth: number;
}

export const AdminScreen: React.FC = () => {
  const { user, canManageUsers, canManageContent } = useAuth();
  const navigation = useNavigation();
  
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Cargando estadísticas del sistema...');
      
      const [recipes, questions, users] = await Promise.allSettled([
        recipeAPI.getAllRecipes().catch(error => {
          console.error('❌ Error obteniendo recetas:', error);
          return { recipes: [] };
        }),
        questionAPI.getPublicQuestions().catch(error => {
          console.error('❌ Error obteniendo preguntas:', error);
          return [];
        }),
        Promise.resolve([]) // Simular usuarios vacíos por ahora
      ]);

      // ✅ CORREGIDO: Manejar correctamente la respuesta de recipes
      let recipesData: any[] = [];
      if (recipes.status === 'fulfilled') {
        // Verificar si la respuesta tiene la propiedad 'recipes' o es directamente un array
        if (Array.isArray(recipes.value)) {
          recipesData = recipes.value;
        } else if (recipes.value && recipes.value.recipes) {
          recipesData = recipes.value.recipes;
        } else {
          recipesData = [];
        }
      }

      const questionsData = questions.status === 'fulfilled' ? questions.value : [];
      const usersData = users.status === 'fulfilled' ? users.value : [];

      console.log(`📦 Datos obtenidos - Recetas: ${recipesData.length}, Preguntas: ${questionsData.length}, Usuarios: ${usersData.length}`);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const statsData: SystemStats = {
        totalRecipes: recipesData.length,
        totalQuestions: questionsData.length,
        totalUsers: usersData.length,
        totalAdmins: usersData.filter((u: any) => u.role === 'admin').length,
        totalModerators: usersData.filter((u: any) => u.role === 'moderator').length,
        activeUsers: usersData.filter((u: any) => {
          if (!u.lastLogin) return false;
          try {
            const lastLogin = new Date(u.lastLogin);
            const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceLogin <= 30;
          } catch {
            return false;
          }
        }).length,
        recipesThisMonth: recipesData.filter((r: any) => {
          if (!r.createdAt) return false;
          try {
            const createdDate = new Date(r.createdAt);
            return createdDate >= firstDayOfMonth;
          } catch {
            return false;
          }
        }).length,
        questionsThisMonth: questionsData.filter((q: any) => {
          if (!q.createdAt) return false;
          try {
            const createdDate = new Date(q.createdAt);
            return createdDate >= firstDayOfMonth;
          } catch {
            return false;
          }
        }).length
      };

      setStats(statsData);
      console.log('✅ Estadísticas cargadas exitosamente:', statsData);
      
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      
      setStats({
        totalRecipes: 0,
        totalQuestions: 0,
        totalUsers: 0,
        totalAdmins: 0,
        totalModerators: 0,
        activeUsers: 0,
        recipesThisMonth: 0,
        questionsThisMonth: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

const handleManageRecipes = () => {
  // ✅ CORREGIDO: Navegar a la nueva pantalla de gestión
  navigation.navigate('RecipeManagement' as never);
};

const handleModerateQuestions = () => {
  // ✅ CORREGIDO: Navegar a ContentModeration (que ya existe)
  navigation.navigate('ContentModeration' as never);
};

const handleManageUsers = () => {
  if (!canManageUsers()) {
    Alert.alert('Acceso Denegado', 'No tienes permisos para gestionar usuarios');
    return;
  }
  // ✅ CORREGIDO: Navegar a UserManagement (que ya existe)
  navigation.navigate('UserManagement' as never);
};

  const handleChangeRoles = () => {
    if (!canManageUsers()) {
      Alert.alert('Acceso Denegado', 'No tienes permisos para cambiar roles');
      return;
    }
    Alert.alert(
      'Cambiar Roles',
      'Funcionalidad en desarrollo. Próximamente podrás asignar roles de administrador o moderador.',
      [{ text: 'Entendido' }]
    );
  };

  const handleSystemStats = () => {
    Alert.alert(
      'Estadísticas del Sistema',
      'Funcionalidad en desarrollo. Próximamente verás reportes detallados de actividad.',
      [{ text: 'Entendido' }]
    );
  };

  const handleViewReports = () => {
    Alert.alert(
      'Reportes del Sistema',
      'Próximamente: Reportes de actividad, usuarios problemáticos, contenido reportado, etc.'
    );
  };

  if (loading && !stats) {
    return (
      <ProtectedRoute adminOnly>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👑 Panel de Administración</Text>
          <Text style={styles.subtitle}>
            Bienvenido, {user?.username}
          </Text>
          <View style={styles.roleBadgeContainer}>
            <Text style={styles.roleBadge}>
              {user?.role === 'admin' ? '👑 Administrador' : 
               user?.role === 'moderator' ? '🛡️ Moderador' : '👤 Usuario'}
            </Text>
          </View>
        </View>

        {/* Estadísticas Principales */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Resumen del Sistema</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <Text style={styles.statNumber}>{stats?.totalRecipes || 0}</Text>
              <Text style={styles.statLabel}>Recetas Totales</Text>
              <Text style={styles.statSubtext}>
                +{stats?.recipesThisMonth || 0} este mes
              </Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardSuccess]}>
              <Text style={styles.statNumber}>{stats?.totalQuestions || 0}</Text>
              <Text style={styles.statLabel}>Preguntas</Text>
              <Text style={styles.statSubtext}>
                +{stats?.questionsThisMonth || 0} este mes
              </Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardWarning]}>
              <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Usuarios</Text>
              <Text style={styles.statSubtext}>
                {stats?.activeUsers || 0} activos
              </Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardInfo]}>
              <Text style={styles.statNumber}>
                {(stats?.totalAdmins || 0) + (stats?.totalModerators || 0)}
              </Text>
              <Text style={styles.statLabel}>Moderadores</Text>
              <Text style={styles.statSubtext}>
                {stats?.totalAdmins || 0} admins
              </Text>
            </View>
          </View>
        </View>

        {/* Gestión de Contenido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Gestión de Contenido</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleManageRecipes}
          >
            <Text style={styles.menuIcon}>🍳</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Gestionar Recetas</Text>
              <Text style={styles.menuDescription}>
                Ver, editar y eliminar recetas del sistema
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleModerateQuestions}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Moderar Preguntas</Text>
              <Text style={styles.menuDescription}>
                Revisar y gestionar preguntas del sistema
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {canManageContent() && (
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleViewReports}
            >
              <Text style={styles.menuIcon}>⚠️</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Contenido Reportado</Text>
                <Text style={styles.menuDescription}>
                  Ver reportes de usuarios sobre contenido
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Gestión de Usuarios (Solo Admin) */}
        {canManageUsers() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Gestión de Usuarios</Text>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleManageUsers}
            >
              <Text style={styles.menuIcon}>📋</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Lista de Usuarios</Text>
                <Text style={styles.menuDescription}>
                  Ver y gestionar todos los usuarios
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleChangeRoles}
            >
              <Text style={styles.menuIcon}>🔄</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Cambiar Roles</Text>
                <Text style={styles.menuDescription}>
                  Asignar roles de administrador o moderador
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reportes y Estadísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Reportes</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleSystemStats}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Estadísticas Detalladas</Text>
              <Text style={styles.menuDescription}>
                Métricas y análisis completos del sistema
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Permisos del Usuario */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Tus Permisos</Text>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>
                {canManageUsers() ? '✅' : '❌'}
              </Text>
              <Text style={styles.permissionText}>Gestionar usuarios</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>
                {canManageContent() ? '✅' : '❌'}
              </Text>
              <Text style={styles.permissionText}>Gestionar contenido</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>
                {user?.role === 'admin' ? '✅' : '❌'}
              </Text>
              <Text style={styles.permissionText}>Acceso total al sistema</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>
                {canManageContent() ? '✅' : '❌'}
              </Text>
              <Text style={styles.permissionText}>Ver reportes y estadísticas</Text>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={onRefresh}
            >
              <Text style={styles.quickActionIcon}>🔄</Text>
              <Text style={styles.quickActionText}>Actualizar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleManageRecipes}
            >
              <Text style={styles.quickActionIcon}>🍳</Text>
              <Text style={styles.quickActionText}>Recetas</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleManageUsers}
            >
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={styles.quickActionText}>Usuarios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleSystemStats}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Reportes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
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
    marginBottom: 12,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '46%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  permissionsList: {
    gap: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#374151',
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
});