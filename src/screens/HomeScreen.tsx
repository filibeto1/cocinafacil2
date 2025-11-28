// src/screens/HomeScreen.tsx - VERSIÓN CORREGIDA
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍳 Bienvenido</Text>
        <Text style={styles.subtitle}>Hola, {user?.username}</Text>
        <Text style={styles.roleText}>Rol: {user?.role || 'usuario'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menú Principal</Text>
        
        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => navigation.navigate('Community' as never)}
        >
          <Text style={styles.menuIcon}>👥</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Comunidad</Text>
            <Text style={styles.menuDescription}>Explora recetas de otros usuarios</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => navigation.navigate('CreateRecipe' as never)}
        >
          <Text style={styles.menuIcon}>➕</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Crear Receta</Text>
            <Text style={styles.menuDescription}>Comparte tu receta favorita</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Mi Perfil</Text>
            <Text style={styles.menuDescription}>Ver y editar tu perfil</Text>
          </View>
        </TouchableOpacity>

        {/* ✅ CAMBIO: AdminPanel -> AdminDashboard */}
        {(user?.role === 'admin' || user?.role === 'moderator') && (
          <TouchableOpacity 
            style={[styles.menuCard, styles.adminCard]}
            onPress={() => {
              console.log('🔄 Navegando a AdminDashboard, rol actual:', user?.role);
              navigation.navigate('AdminDashboard' as never);
            }}
          >
            <Text style={styles.menuIcon}>👑</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Panel de Admin</Text>
              <Text style={styles.menuDescription}>Gestionar sistema</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  menuCard: {
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
  adminCard: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});