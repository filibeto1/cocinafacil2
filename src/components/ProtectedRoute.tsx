// src/components/ProtectedRoute.tsx - NUEVO ARCHIVO
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false,
  fallback 
}) => {
  const { user, isAdmin } = usePermissions();

  if (!user) {
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
  },
});