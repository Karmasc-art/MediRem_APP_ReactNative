import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBxcSo8c-4yU9t0yQBNcgOC8CB-I1_Ntog",
  authDomain: "medirem-62e31.firebaseapp.com",
  projectId: "medirem-62e31",
  storageBucket: "medirem-62e31.firebasestorage.app",
  messagingSenderId: "994180052503",
  appId: "1:994180052503:web:489c4dd233f043c7688e52",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth can only run once; on fast refresh it throws, so fall back to getAuth.
function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();