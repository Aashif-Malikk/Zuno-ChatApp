import { Slot, Stack } from "expo-router";
import '../../global.css'
import { useState, useCallback, useEffect } from "react";
// import * as SplashScreen from "expo-splash-screen";
// import Splash from "./Splash";

// SplashScreen.preventAutoHideAsync();
export default function RootLayout() {

  // const [appReady, setAppReady] = useState(false);
  // const [showCustomSplash, setShowCustomSplash] = useState(true);

  // useEffect(() => {
  //   async function prepare() {
  //     // load fonts, fetch auth state, etc.
  //     setAppReady(true);
  //     await SplashScreen.hideAsync(); // hide native splash
  //   }
  //   prepare();
  // }, []);

  // if (!appReady) return null;

  // if (showCustomSplash) {
  //   return (
  //     <Splash onFinish={() => setShowCustomSplash(false)} />
  //   );
  // }

  return <Stack screenOptions={{ headerShown: false }} />; // your normal app
}
