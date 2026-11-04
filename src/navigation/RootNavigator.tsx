import React, { useEffect, useRef } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";

import { MainTabParamList, RootStackParamList } from "../types/navigation";
import { useAuth } from "../services/AuthContext";
import { cancelAllReminders, rescheduleAll } from "../services/notificationService";
import { reportError } from "../utils/errorHandler";
import { colors } from "../utils/theme";

import LoadingView from "../components/LoadingView";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import MedicineListScreen from "../screens/MedicineListScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AddMedicineScreen from "../screens/AddMedicineScreen";
import MedicineDetailsScreen from "../screens/MedicineDetailsScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const tabIcons: Record<
  keyof MainTabParamList,
  [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]
> = {
  Home: ["home", "home-outline"],
  Medicines: ["medkit", "medkit-outline"],
  History: ["time", "time-outline"],
  Profile: ["person", "person-outline"],
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={tabIcons[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Medicines" component={MedicineListScreen} options={{ title: "Medicine" }} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const handledRef = useRef<string | null>(null);
  const lastResponse = Notifications.useLastNotificationResponse();

  // Rebuild reminders when a user signs in; clear them when signed out.
  useEffect(() => {
    if (loading) return;
    if (user) {
      rescheduleAll(user.uid).catch((e) => reportError("reschedule reminders", e));
    } else {
      cancelAllReminders().catch((e) => reportError("cancel reminders", e));
    }
  }, [user?.uid, loading]);

  // Tapping a reminder opens that medicine (also works from a closed app).
  useEffect(() => {
    if (!user || !lastResponse) return;
    const request = lastResponse.notification.request;
    const key = `${request.identifier}-${lastResponse.notification.date}`;
    if (handledRef.current === key) return;

    const medicineId = Number(request.content.data?.medicineId);
    if (!medicineId) return; // e.g. the test reminder has no medicine
    handledRef.current = key;

    const go = () => navigationRef.navigate("MedicineDetails", { medicineId });
    if (navigationRef.isReady()) go();
    else setTimeout(() => navigationRef.isReady() && go(), 800);
  }, [lastResponse, user]);

  if (loading) {
    return <LoadingView message="Checking your session..." />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="AddMedicine" component={AddMedicineScreen} options={{ title: "Add Medicine" }} />
            <Stack.Screen name="MedicineDetails" component={MedicineDetailsScreen} options={{ title: "Medicine Details" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Notification Settings" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}