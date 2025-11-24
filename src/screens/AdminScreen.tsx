// src/screens/AdminScreen.tsx - NUEVO ARCHIVO
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { usePermissions } from '../hooks/usePermissions';

export const AdminScreen: React.FC = () => {
  const { canManageUsers, canManageContent, user } = usePermissions();

  const handleManageRecipes = () => {
    Alert.alert('Gestión de Recetas', 'Funcionalidad en desarrollo');
  };

  const handleModerateQuestions = () => {
    Alert.alert('Moderar Preguntas', 'Funcionalidad en desarrollo');
  };

  const handleManageUsers = () => {
    Alert.alert('Gestión de Usuarios', 'Funcionalidad en desarrollo');
  };

  const handleChangeRoles = () => {
    Alert.alert('Cambiar Roles', 'Funcionalidad en desarrollo');
  };

  return (
    <ProtectedRoute adminOnly>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>👑 Panel de Administración</Text>
          <Text style={styles.subtitle}>
            Bienvenido, {user?.username}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión de Contenido</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleManageRecipes}>
            <Text style={styles.menuIcon}>📝</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Gestionar Recetas</Text>
              <Text style={styles.menuDescription}>Ver, editar y eliminar recetas</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleModerateQuestions}>
            <Text style={styles.menuIcon}>💬</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Moderar Preguntas</Text>
              <Text style={styles.menuDescription}>Revisar preguntas y respuestas</Text>
            </View>
          </TouchableOpacity>
        </View>

        {canManageUsers() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestión de Usuarios</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleManageUsers}>
              <Text style={styles.menuIcon}>👥</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Lista de Usuarios</Text>
                <Text style={styles.menuDescription}>Ver y gestionar usuarios</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleChangeRoles}>
              <Text style={styles.menuIcon}>🔄</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Cambiar Roles</Text>
                <Text style={styles.menuDescription}>Asignar roles de administrador</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>150</Text>
              <Text style={styles.statLabel}>Recetas Totales</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>89</Text>
              <Text style={styles.statLabel}>Preguntas Activas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Usuarios Registrados</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Administradores</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
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
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    paddingLeft: 8,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuIcon: {
    fontSize: 24,
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
    fontSize: 14,
    color: '#6B7280',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});