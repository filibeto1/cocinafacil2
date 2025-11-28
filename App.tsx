// App.tsx - VERSIÓN CORREGIDA CON NAMED IMPORT
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator'; // ✅ NAMED IMPORT CORRECTO
import { StatusBar } from 'react-native';

// Interfaces para tipos
interface LanguageContextProps {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
}

export const LanguageContext = React.createContext<LanguageContextProps>({
  currentLanguage: 'es',
  setCurrentLanguage: () => {},
});

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('es');

  const handleLanguagePress = () => {
    // Cambiar entre español e inglés
    const newLanguage = currentLanguage === 'es' ? 'en' : 'es';
    setCurrentLanguage(newLanguage);
    console.log('🌐 Idioma cambiado a:', newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage }}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar 
            barStyle="light-content" 
            backgroundColor="#FF6B6B" 
          />
          <AppNavigator 
            onLanguagePress={handleLanguagePress}
            currentLanguage={currentLanguage}
          />
        </NavigationContainer>
      </AuthProvider>
    </LanguageContext.Provider>
  );
}