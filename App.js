import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/AuthContext';
import { AppProvider, useApp, useColors } from './src/AppContext';
import { isOnboarded } from './src/storage';
import { IconHome, IconBarChart, IconGrid } from './src/components/icons/index';

import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateHabitScreen from './src/screens/CreateHabitScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ManageScreen from './src/screens/ManageScreen';
import HowItWorksScreen from './src/screens/HowItWorksScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = [IconHome, IconBarChart, IconGrid];

function FloatingTabBar({ state, navigation }) {
  const colors = useColors();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 92 }}
    >
      <View style={{
        position: 'absolute',
        bottom: 16,
        left: 24,
        right: 24,
        height: 60,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1.5,
        borderColor: colors.border,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
      }}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = TAB_ICONS[index];
          return (
            <TouchableOpacity
              key={route.key}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.6}
            >
              <Icon color={focused ? colors.text : colors.textSecondary} size={22} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Progress" component={InsightsScreen} />
      <Tab.Screen name="Manage" component={ManageScreen} />
    </Tab.Navigator>
  );
}

function Splash() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.text }} />
    </View>
  );
}

function RootNavigator() {
  const { session, authLoading, needsPasswordReset } = useAuth();
  const { state } = useApp();
  const [onboarded, setOnboarded] = useState(null);

  useEffect(() => {
    if (!session) return;
    isOnboarded().then(setOnboarded);
  }, [session]);

  if (authLoading || (session && state.loading)) return <Splash />;

  if (needsPasswordReset) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  if (onboarded === null) return <SafeAreaProvider><Splash /></SafeAreaProvider>;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!onboarded ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : null}
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="CreateHabit"
            component={CreateHabitScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="HowItWorks"
            component={HowItWorksScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

function AuthConsumer() {
  const { session } = useAuth();
  return (
    <AppProvider userId={session?.user?.id}>
      <RootNavigator />
    </AppProvider>
  );
}
