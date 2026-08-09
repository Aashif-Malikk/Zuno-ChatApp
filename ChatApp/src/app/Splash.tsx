// import React, { useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   Image,
//   ImageBackground,
//   Animated,
//   ActivityIndicator,
//   Dimensions,
// } from "react-native";
// import * as SplashScreen from "expo-splash-screen";

// // Requires: npx expo install expo-splash-screen
// //
// // This is a CUSTOM animated splash screen (shown after the native one).
// // Usage in app/_layout.tsx (Expo Router):
// //
// //   import { useState, useCallback, useEffect } from "react";
// //   import * as SplashScreen from "expo-splash-screen";
// //   import CustomSplashScreen from "../components/SplashScreen";
// //
// //   SplashScreen.preventAutoHideAsync();
// //
// //   export default function RootLayout() {
// //     const [appReady, setAppReady] = useState(false);
// //     const [showCustomSplash, setShowCustomSplash] = useState(true);
// //
// //     useEffect(() => {
// //       async function prepare() {
// //         // load fonts, fetch auth state, etc.
// //         setAppReady(true);
// //         await SplashScreen.hideAsync(); // hide native splash
// //       }
// //       prepare();
// //     }, []);
// //
// //     if (!appReady) return null;
// //
// //     if (showCustomSplash) {
// //       return (
// //         <CustomSplashScreen onFinish={() => setShowCustomSplash(false)} />
// //       );
// //     }
// //
// //     return <Slot />; // your normal app
// //   }

// const { height } = Dimensions.get("window");

// export default function Splash({ onFinish = () => { }, duration = 2200 }) {
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.85)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         friction: 5,
//         tension: 40,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     const timer = setTimeout(() => {
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 400,
//         useNativeDriver: true,
//       }).start(() => {
//         onFinish && onFinish();
//       });
//     }, duration);

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <ImageBackground
//       // Replace with your own background image
//       source={require("../assets/Splash_background_texture.png")}
//       resizeMode="cover"
//       style={{ flex: 1, width: "100%", height }}
//     >
//       {/* Dark overlay so logo/text stay readable over any background image */}
//       <View className="absolute inset-0 bg-blue-950/50" />

//       <Animated.View
//         className="flex-1 items-center justify-center px-8"
//         style={{
//           opacity: fadeAnim,
//           transform: [{ scale: scaleAnim }],
//         }}
//       >
//         <Image
//           // Replace with your own logo image
//           source={require("../assets/Logo.png")}
//           className="w-28 h-28 rounded-3xl"
//           resizeMode="cover"
//         />

//         <Text className="text-4xl font-extrabold text-white mt-6">
//           Zuno
//         </Text>
//         <Text className="text-base text-white/80 mt-2 text-center">
//           Connect. Chat. Stay Private.
//         </Text>

//         <ActivityIndicator
//           size="small"
//           color="#ffffff"
//           className="mt-10"
//         />
//       </Animated.View>
//     </ImageBackground>
//   );
// }

import { View, Text } from 'react-native'
import React from 'react'

const Splash = () => {
  return (
    <View>
      <Text>Splash</Text>
    </View>
  )
}

export default Splash