// src/components/ProtectedRoute.tsx - VERSIÓN CORREGIDA
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  moderatorOnly?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false,
  moderatorOnly = false,
  fallback 
}) => {
  const { user, isAdmin, isModerator, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          🔐 Debes iniciar sesión para acceder a esta función
        </Text>
      </View>
    );
  }

  if (adminOnly && !isAdmin) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          ⚠️ No tienes permisos de administrador para acceder a esta función
        </Text>
        <Text style={styles.fallbackSubtext}>
          Rol actual: {user.role}
        </Text>
      </View>
    );
  }

  if (moderatorOnly && !isModerator) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          ⚠️ No tienes permisos de moderador para acceder a esta función
        </Text>
        <Text style={styles.fallbackSubtext}>
          Rol actual: {user.role}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  fallbackText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 8,
  },
  fallbackSubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});