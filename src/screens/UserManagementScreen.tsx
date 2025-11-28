import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { adminAPI } from '../services/adminAPI';
import { UserManagement, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const UserManagementScreen: React.FC = () => {
  const { canManageUsers } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await adminAPI.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleChangeRole = (user: UserManagement) => {
    if (!canManageUsers()) {
      Alert.alert('Acceso Denegado', 'No tienes permisos para cambiar roles');
      return;
    }
    setSelectedUser(user);
    setRoleModalVisible(true);
  };

  const confirmChangeRole = async (newRole: UserRole) => {
    if (!selectedUser) return;

    try {
      setActionLoading(selectedUser.id);
      await adminAPI.updateUserRole(selectedUser.id, newRole);
      
      // Actualizar lista local
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, role: newRole } : user
      ));
      
      setRoleModalVisible(false);
      setSelectedUser(null);
      Alert.alert('Éxito', `Rol cambiado a ${newRole}`);
    } catch (error) {
      console.error('Error cambiando rol:', error);
      Alert.alert('Error', 'No se pudo cambiar el rol');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user: UserManagement) => {
    if (!canManageUsers()) {
      Alert.alert('Acceso Denegado', 'No tienes permisos para gestionar usuarios');
      return;
    }

    Alert.alert(
      'Cambiar Estado',
      `¿Estás seguro de que quieres ${user.isActive ? 'desactivar' : 'activar'} a ${user.username}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(user.id);
              const result = await adminAPI.toggleUserStatus(user.id);
              
              // Actualizar lista local
              setUsers(users.map(u => 
                u.id === user.id ? { ...u, isActive: result.isActive } : u
              ));
            } catch (error) {
              console.error('Error cambiando estado:', error);
              Alert.alert('Error', 'No se pudo cambiar el estado');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (user: UserManagement) => {
    if (!canManageUsers()) {
      Alert.alert('Acceso Denegado', 'No tienes permisos para eliminar usuarios');
      return;
    }

    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar permanentemente a ${user.username}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(user.id);
              await adminAPI.deleteUser(user.id);
              
              // Remover de la lista local
              setUsers(users.filter(u => u.id !== user.id));
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            } catch (error) {
              console.error('Error eliminando usuario:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#EF4444';
      case 'moderator': return '#F59E0B';
      case 'user': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return 'crown';
      case 'moderator': return 'shield-account';
      case 'user': return 'account';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadUsers} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>👥 Gestión de Usuarios</Text>
        <Text style={styles.subtitle}>
          {users.length} usuarios registrados en el sistema
        </Text>
      </View>

      {/* Lista de Usuarios */}
      <View style={styles.usersList}>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            {/* Avatar e Info */}
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons 
                  name={getRoleIcon(user.role)} 
                  size={24} 
                  color={getRoleColor(user.role)} 
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.email}>{user.email}</Text>
                <View style={styles.metaInfo}>
                 <Text style={[styles.role, { color: getRoleColor(user.role) }]}>
                    {user.role}
                  </Text>
                  <Text style={styles.recipeCount}>
                    • {user.recipeCount} recetas
                  </Text>
                 <Text style={[styles.status, { color: user.isActive ? '#10B981' : '#EF4444' }]}>
                    • {user.isActive ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
                <Text style={styles.joinedDate}>
                  Unido el {new Date(user.joinedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Acciones */}
            <View style={styles.actions}>
              {/* Cambiar Rol */}
              <TouchableOpacity
                style={[styles.actionButton, styles.roleButton]}
                onPress={() => handleChangeRole(user)}
                disabled={actionLoading === user.id}
              >
                <MaterialCommunityIcons name="account-convert" size={20} color="#3B82F6" />
                <Text style={styles.actionText}>Rol</Text>
              </TouchableOpacity>

              {/* Activar/Desactivar */}
              <TouchableOpacity
                style={[styles.actionButton, user.isActive ? styles.deactivateButton : styles.activateButton]}
                onPress={() => handleToggleStatus(user)}
                disabled={actionLoading === user.id}
              >
                <MaterialCommunityIcons 
                  name={user.isActive ? 'account-off' : 'account-check'} 
                  size={20} 
                  color={user.isActive ? '#EF4444' : '#10B981'} 
                />
                <Text style={styles.actionText}>
                  {user.isActive ? 'Desactivar' : 'Activar'}
                </Text>
              </TouchableOpacity>

              {/* Eliminar */}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteUser(user)}
                disabled={actionLoading === user.id}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                <Text style={styles.actionText}>Eliminar</Text>
              </TouchableOpacity>
            </View>

            {/* Loading Overlay */}
            {actionLoading === user.id && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Modal para Cambiar Rol */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Cambiar Rol de {selectedUser?.username}
            </Text>
            
            <Text style={styles.modalSubtitle}>
              Rol actual: <Text style={{ color: getRoleColor(selectedUser?.role || 'user') }}>
                {selectedUser?.role}
              </Text>
            </Text>

            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[styles.roleOption, styles.adminOption]}
                onPress={() => confirmChangeRole(UserRole.ADMIN)}
              >
                <MaterialCommunityIcons name="crown" size={24} color="#EF4444" />
                <Text style={styles.roleOptionText}>Administrador</Text>
                <Text style={styles.roleOptionDescription}>
                  Acceso completo al sistema
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, styles.moderatorOption]}
                onPress={() => confirmChangeRole(UserRole.MODERATOR)}
              >
                <MaterialCommunityIcons name="shield-account" size={24} color="#F59E0B" />
                <Text style={styles.roleOptionText}>Moderador</Text>
                <Text style={styles.roleOptionDescription}>
                  Gestionar contenido y reportes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, styles.userOption]}
                onPress={() => confirmChangeRole(UserRole.USER)}
              >
                <MaterialCommunityIcons name="account" size={24} color="#3B82F6" />
                <Text style={styles.roleOptionText}>Usuario</Text>
                <Text style={styles.roleOptionDescription}>
                  Permisos básicos de la aplicación
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  },
  usersList: {
    padding: 16,
  },
  userCard: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  role: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recipeCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  joinedDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  roleButton: {
    backgroundColor: '#EFF6FF',
  },
  activateButton: {
    backgroundColor: '#ECFDF5',
  },
  deactivateButton: {
    backgroundColor: '#FEF2F2',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  roleOptions: {
    marginBottom: 24,
  },
  roleOption: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  adminOption: {
    borderColor: '#FEE2E2',
  },
  moderatorOption: {
    borderColor: '#FEF3C7',
  },
  userOption: {
    borderColor: '#DBEAFE',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  roleOptionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});