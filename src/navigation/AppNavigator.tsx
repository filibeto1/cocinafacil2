// src/navigation/AppNavigator.tsx - VERSIÓN CORREGIDA SIN DUPLICADOS
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Contexts
import { useAuth } from '../context/AuthContext';

// ✅ SCREENS - NAMED IMPORTS
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { CreateRecipeScreen } from '../screens/CreateRecipeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MyRecipesScreen } from '../screens/MyRecipesScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { CommunityRecipesScreen } from '../screens/CommunityRecipesScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { UserManagementScreen } from '../screens/UserManagementScreen';
import { ContentModerationScreen } from '../screens/ContentModerationScreen';
import { RecipeManagementScreen } from '../screens/RecipeManagementScreen';
import { EditRecipeScreen } from '../screens/EditRecipeScreen'; // ✅ IMPORT CORREGIDO

// ⚠️ PANTALLAS QUE NO EXISTEN - Placeholders actualizados
const FavoritesScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Pantalla de Favoritos (Próximamente)</Text>
  </View>
);

const SearchScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Pantalla de Búsqueda (Próximamente)</Text>
  </View>
);

// ❌ ELIMINAR el duplicado de EditRecipeScreen que estaba aquí

const PostDetailScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Detalle de Post (Próximamente)</Text>
  </View>
);

const CreatePostScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Crear Post (Próximamente)</Text>
  </View>
);

const EditPostScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Editar Post (Próximamente)</Text>
  </View>
);

const EditProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Editar Perfil (Próximamente)</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Configuración (Próximamente)</Text>
  </View>
);

const ReportsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Reportes (Próximamente)</Text>
  </View>
);

// Types
export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  RecipeDetail: { recipeId: string };
  CreateRecipe: undefined;
  EditRecipe: { recipeId: string }; // ✅ SOLO UNA VEZ
  Search: undefined;
  EditProfile: undefined;
  MyRecipes: undefined;
  Settings: undefined;
  PostDetail: { postId: string };
  CreatePost: undefined;
  EditPost: { postId: string };
  AdminDashboard: undefined;
  UserManagement: undefined;
  ContentModeration: undefined;
  Reports: undefined;
  Recipes: undefined;
  RecipeManagement: undefined;
  // ❌ ELIMINAR el EditRecipe duplicado que estaba aquí
};

export type MainTabParamList = {
  Home: undefined;
  Favorites: undefined;
  Community: undefined;
  Profile: undefined;
  Recipes: undefined;
};

// Stacks y Tabs
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createStackNavigator();

// Props interface
interface AppNavigatorProps {
  onLanguagePress: () => void;
  currentLanguage: string;
}

// ============================================================================
// AUTH STACK - CORREGIDO CON id: undefined
// ============================================================================
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// ============================================================================
// MAIN TABS - CORREGIDO CON id: undefined
// ============================================================================
const MainTabs = () => {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          backgroundColor: '#fff',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Favorites':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Recipes':
              iconName = focused ? 'book-open' : 'book-open-outline';
              break;
            case 'Community':
              iconName = focused ? 'forum' : 'forum-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              top: Platform.OS === 'ios' ? 0 : 0,
            }}>
              <MaterialCommunityIcons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favoritos',
        }}
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipesScreen}
        options={{
          tabBarLabel: 'Recetas',
        }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityRecipesScreen}
        options={{
          tabBarLabel: 'Comunidad',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

// ============================================================================
// HEADER COMPONENTS
// ============================================================================
interface HeaderProps {
  title: string;
  showBack?: boolean;
  navigation: any;
  showLanguage?: boolean;
  onLanguagePress?: () => void;
  currentLanguage?: string;
  showAdmin?: boolean;
}

const CustomHeader: React.FC<HeaderProps> = ({ 
  title, 
  showBack = false, 
  navigation,
  showLanguage = false,
  onLanguagePress,
  currentLanguage = 'es',
  showAdmin = false
}) => {
  const { isAdmin } = useAuth();

  return (
    <View style={{
      height: Platform.OS === 'ios' ? 100 : 60,
      backgroundColor: '#FF6B6B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 44 : 0,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    }}>
      {/* Botón de retroceso */}
      <View style={{ width: 40 }}>
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 8,
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Título */}
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
      }}>
        {title}
      </Text>

      {/* Botones de acciones (idioma y admin) */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        width: 40,
        justifyContent: 'flex-end'
      }}>
        {showLanguage && onLanguagePress && (
          <TouchableOpacity
            onPress={onLanguagePress}
            style={{
              padding: 8,
              marginRight: showAdmin && isAdmin ? 8 : 0,
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#fff',
            }}>
              {currentLanguage.toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}

        {showAdmin && isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminDashboard')}
            style={{
              padding: 8,
            }}
          >
            <MaterialCommunityIcons name="shield-crown" size={24} color="#FFD700" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// MAIN NAVIGATOR - COMPLETO Y CORREGIDO CON id: undefined
// ============================================================================
export const AppNavigator: React.FC<AppNavigatorProps> = ({ 
  onLanguagePress, 
  currentLanguage 
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#fff'
      }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{
          headerShown: false,
        }}
      />

      {/* Recipe Screens */}
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Detalle de Receta"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      <Stack.Screen 
        name="CreateRecipe" 
        component={CreateRecipeScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Crear Receta"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      {/* ✅ PANTALLA DE EDICIÓN - SOLO UNA VEZ */}
      <Stack.Screen 
        name="EditRecipe" 
        component={EditRecipeScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Editar Receta"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      {/* ✅ PANTALLA DE GESTIÓN DE RECETAS */}
      <Stack.Screen 
        name="RecipeManagement" 
        component={RecipeManagementScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Gestión de Recetas"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      {/* ✅ AGREGADO: Pantalla Recipes para evitar errores de navegación */}
      <Stack.Screen 
        name="Recipes" 
        component={RecipesScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Todas las Recetas"
              showBack={true}
              navigation={navigation}
              showLanguage={true}
              onLanguagePress={onLanguagePress}
              currentLanguage={currentLanguage}
            />
          ),
        })}
      />

      {/* Search Screen */}
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Buscar Recetas"
              showBack={true}
              navigation={navigation}
              showLanguage={true}
              onLanguagePress={onLanguagePress}
              currentLanguage={currentLanguage}
            />
          ),
        })}
      />

      {/* Profile Screens */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Editar Perfil"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      <Stack.Screen 
        name="MyRecipes" 
        component={MyRecipesScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Mis Recetas"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Configuración"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      {/* Community/Post Screens */}
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetailScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Detalle de Publicación"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Crear Publicación"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      <Stack.Screen 
        name="EditPost" 
        component={EditPostScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Editar Publicación"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      {/* Admin Screens */}
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Panel de Administración"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      <Stack.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Gestión de Usuarios"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      <Stack.Screen 
        name="ContentModeration" 
        component={ContentModerationScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Moderación de Contenido"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />

      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader 
              title="Reportes"
              showBack={true}
              navigation={navigation}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
};