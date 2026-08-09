import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  CircleCheckBig,
  CircleAlert,
} from "lucide-react-native";
import { API_BASE } from "../../config/api";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Requires NativeWind to be set up in your Expo project:
// npm install nativewind tailwindcss
// npx tailwindcss init
// (see NativeWind docs for babel/metro config)

export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [msg, setmsg] = useState('')
  const [success, setsuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {
    // TODO: wire up your auth logic here
    console.log({ userName, password, rememberMe });
    if (!userName || !password) {
      setmsg('Please fill in all fields.')
      setsuccess(false)
      return
    }
    
    if (userName.includes(' ')) {
      setmsg('Username should not contain spaces.')
      setsuccess(false)
      return
    }

    setLoading(true)
    setmsg('')
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        name: userName,
        password: password
      })
      console.log('User Login details: ', response.data)
      if (response.data.success) {
        setmsg(response.data.message)
        setsuccess(true)

        await SecureStore.setItemAsync("token", response.data.token);

        router.push('/(tabs)/Index')
      }
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      setmsg(error.response?.data?.message || "Something went wrong. Please try again");
      setsuccess(false);
    } finally {
      setLoading(false)
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Logo */}
          <View className="items-center mt-10 mb-2">
            <Image
              // Replace with your own logo image
              source={require("../../../assets/Logo.png")}
              className="w-24 h-24 rounded-3xl"
              resizeMode="cover"
            />
            <Text className="text-3xl font-bold text-slate-900 mt-4">
              Zuno
            </Text>
            <Text className="text-slate-400 mt-1">
              Connect. Chat. Stay Private.
            </Text>
          </View>

          {/* Heading */}
          <View className="mt-8 mb-6">
            <Text className="text-3xl font-extrabold text-slate-900">
              Welcome Back
            </Text>
            <Text className="text-slate-400 mt-1">
              Login to continue your conversations
            </Text>
          </View>

          {/* Unique ID */}
          <View className="mb-4">
            <Text className="text-slate-900 font-semibold mb-2">
              Unique ID / Username
            </Text>
            <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
              <User size={20} color="#2563eb" />
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your Unique ID / Username"
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-3 text-slate-900 h-full"
              />
            </View>
            <Text className="text-slate-400 text-xs mt-2">
              Use your Unique ID / Username
            </Text>
          </View>

          {/* Password */}
          <View className="mb-2">
            <Text className="text-slate-900 font-semibold mb-2">
              Password
            </Text>
            <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
              <Lock size={20} color="#2563eb" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                className="flex-1 ml-3 text-slate-900 h-full"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                {showPassword ? (
                  <EyeOff size={20} color="#64748b" />
                ) : (
                  <Eye size={20} color="#64748b" />
                )}
              </Pressable>
            </View>
          </View>

          <View
            className={`${msg ? "flex-row" : "hidden"} items-center rounded-2xl px-4 py-3 mb-5 ${success
              ? "bg-green-100 border border-green-300"
              : "bg-red-100 border border-red-300"
              }`}
          >
            {success ? (
              <CircleCheckBig size={22} color="#16a34a" />
            ) : (
              <CircleAlert size={22} color="#dc2626" />
            )}

            <Text
              className={`ml-3 flex-1 text-sm font-medium ${success ? "text-green-700" : "text-red-700"
                }`}
            >
              {msg}
            </Text>
          </View>

          {/* Remember me / Forgot password */}
          <View className="flex-row items-center justify-between mt-3 mb-8">
            <Pressable
              className="flex-row items-center"
              onPress={() => setRememberMe((v) => !v)}
            >
              <View
                className={`w-5 h-5 rounded-md items-center justify-center mr-2 ${rememberMe ? "bg-blue-600" : "border border-slate-300"
                  }`}
              >
                {rememberMe && (
                  <Check size={14} color="white" strokeWidth={3} />
                )}
              </View>
              <Text className="text-slate-900">Remember me</Text>
            </Pressable>

            <Pressable>
              <Text className="text-blue-600 font-medium">
                Forgot Password?
              </Text>
            </Pressable>
          </View>

          {/* Login button */}
          <Pressable
            onPress={handleLogin}
            className="bg-blue-600 rounded-2xl h-14 flex-row items-center justify-center"
          >
            <Text className="text-white font-semibold text-base mr-2">
              Login
            </Text>
            <ArrowRight size={18} color="white" />
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="mx-3 text-slate-400 text-sm">OR</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Create account */}
          <View className="items-center">
            <Text className="text-slate-400">Don't have an account?</Text>

            <Pressable onPress={() => router.push("/(auth)/Register")}>
              <Text className="text-blue-600 font-semibold mt-1">
                Create Account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}