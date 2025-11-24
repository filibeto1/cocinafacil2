import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PermissionsProvider } from './src/hooks/usePermissions';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <NavigationContainer> {/* ✅ SOLO AQUÍ */}
          <AppNavigator 
            onLanguagePress={() => console.log('Language pressed')}
            currentLanguage="es"
          />
        </NavigationContainer>
      </PermissionsProvider>
    </AuthProvider>
  );
}