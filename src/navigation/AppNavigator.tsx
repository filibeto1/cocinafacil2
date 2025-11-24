import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

// Importar pantallas
import { HomeScreen } from '../screens/HomeScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { CreateRecipeScreen } from '../screens/CreateRecipeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CommunityRecipesScreen } from '../screens/CommunityRecipesScreen';
import { MyRecipesScreen } from '../screens/MyRecipesScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { RootStackParamList } from '../types';

// Crear navegadores
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Props para el AppNavigator
interface AppNavigatorProps {
  onLanguagePress: () => void;
  currentLanguage: string;
}

// Componente de icono personalizado con emojis
const TabIcon: React.FC<{ name: string; color: string; focused: boolean }> = ({ 
  name, 
  color, 
  focused 
}) => {
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return '🏠';
      case 'Recipes':
        return '📖';
      case 'CreateRecipe':
        return '➕';
      case 'Profile':
        return '👤';
      case 'Admin':
        return '👑';
      default:
        return '●';
    }
  };

  const getLabel = () => {
    switch (name) {
      case 'Home':
        return 'Inicio';
      case 'Recipes':
        return 'Recetas';
      case 'CreateRecipe':
        return 'Crear';
      case 'Profile':
        return 'Perfil';
      case 'Admin':
        return 'Admin';
      default:
        return name;
    }
  };

  return (
    <View style={styles.tabContainer}>
      <Text style={[styles.tabIcon, { color }]}>{getIcon()}</Text>
      <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelFocused]}>
        {getLabel()}
      </Text>
      {focused && <View style={[styles.tabIndicator, { backgroundColor: color }]} />}
    </View>
  );
};

// Navegador de tabs principal (SOLO para usuarios autenticados)
const MainTabNavigator = () => {
  const { isAdmin } = usePermissions();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, focused }) => (
          <TabIcon 
            name={route.name} 
            color={color} 
            focused={focused} 
          />
        ),
        tabBarLabel: () => null,
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{
          title: 'Recetas',
        }}
      />
      <Tab.Screen
        name="CreateRecipe"
        component={CreateRecipeScreen}
        options={{
          title: 'Crear Receta',
        }}
      />
      {/* Tab de Admin solo para administradores */}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            title: 'Administración',
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

// Componente del botón de idioma
const LanguageButton: React.FC<{ onPress: () => void; currentLanguage: string }> = ({ 
  onPress, 
  currentLanguage 
}) => {
  const getLanguageLabel = (lang: string) => {
    const languages: { [key: string]: string } = {
      'es': 'ES',
      'en': 'EN',
      'fr': 'FR',
      'it': 'IT',
      'pt': 'PT'
    };
    return languages[lang] || 'ES';
  };

  const getLanguageFlag = (lang: string) => {
    const flags: { [key: string]: string } = {
      'es': '🇪🇸',
      'en': '🇺🇸',
      'fr': '🇫🇷',
      'it': '🇮🇹',
      'pt': '🇵🇹'
    };
    return flags[lang] || '🇪🇸';
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={styles.languageButton}
    >
      <Text style={styles.languageFlag}>{getLanguageFlag(currentLanguage)}</Text>
      <Text style={styles.languageText}>{getLanguageLabel(currentLanguage)}</Text>
    </TouchableOpacity>
  );
};

// Navegador para usuarios NO autenticados
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'Iniciar Sesión',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          title: 'Registrarse',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

// Navegador para usuarios autenticados
const AppStackNavigator = ({ onLanguagePress, currentLanguage }: { 
  onLanguagePress: () => void; 
  currentLanguage: string;
}) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen}
        options={{
          title: 'Detalle de Receta',
          headerRight: () => (
            <LanguageButton 
              onPress={onLanguagePress} 
              currentLanguage={currentLanguage} 
            />
          ),
        }}
      />

      {/* Pantallas adicionales para recetas de comunidad */}
      <Stack.Screen 
        name="CommunityRecipes" 
        component={CommunityRecipesScreen}
        options={{
          title: 'Recetas de la Comunidad',
          headerRight: () => (
            <LanguageButton 
              onPress={onLanguagePress} 
              currentLanguage={currentLanguage} 
            />
          ),
        }}
      />

      <Stack.Screen 
        name="MyRecipes" 
        component={MyRecipesScreen}
        options={{
          title: 'Mis Recetas',
          headerRight: () => (
            <LanguageButton 
              onPress={onLanguagePress} 
              currentLanguage={currentLanguage} 
            />
          ),
        }}
      />

      <Stack.Screen 
        name="CreateRecipe" 
        component={CreateRecipeScreen}
        options={{
          title: 'Crear Receta',
          headerRight: () => (
            <LanguageButton 
              onPress={onLanguagePress} 
              currentLanguage={currentLanguage} 
            />
          ),
        }}
      />

      {/* Pantalla de administración */}
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{
          title: 'Panel de Administración',
          headerRight: () => (
            <LanguageButton 
              onPress={onLanguagePress} 
              currentLanguage={currentLanguage} 
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

// Navegador principal de la aplicación
export const AppNavigator: React.FC<AppNavigatorProps> = ({ 
  onLanguagePress, 
  currentLanguage 
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <AppStackNavigator 
          onLanguagePress={onLanguagePress} 
          currentLanguage={currentLanguage} 
        />
      ) : (
        <AuthStackNavigator />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelFocused: {
    fontWeight: 'bold',
  },
  tabIndicator: {
    width: 6,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
});

export type { AppNavigatorProps };