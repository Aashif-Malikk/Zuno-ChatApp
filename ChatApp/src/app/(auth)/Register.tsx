import React, { useState } from "react";
import axios from 'axios'
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
import {
  ChevronLeft,
  User,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Check,
  CircleCheckBig,
  CircleAlert,
  Mail,
  Phone,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { API_BASE } from "../../config/api";
import * as SecureStore from "expo-secure-store";

// Requires:
//   npm install lucide-react-native react-native-svg
//   npx expo install react-native-svg
// NativeWind must already be set up in your Expo project.

export default function Register() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [msg, setmsg] = useState('')
  const [success, setsuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleCreateAccount = async () => {
    // TODO: wire up your signup logic here
    console.log({ email, username, password, confirmPassword, agreed });
    if (password !== confirmPassword) {
      setmsg("Passwords do not match");
      setsuccess(false)
      return;
    }
    if (!agreed) {
      setmsg("Please agree to the Terms of Service and Privacy Policy");
      setsuccess(false)
      return;
    }

    if (!username || !email || !password || !phone) {
      setmsg('Please fill in all required fields.')
      setsuccess(false)
      return
    }

    if (username.includes(' ')) {
      setmsg('Username cannot contain spaces.')
      setsuccess(false)
      return
    }

    setLoading(true)
    console.log(loading)
    setmsg('')
    try {
      const response = await axios.post(`${API_BASE}/auth/signup`, {
        name: username,
        password: password,
        email: email,
        phone: phone
      })
      console.log('User Register details: ', response.data)
      if (response.data.success) {
        setmsg(response.data.message)
        setsuccess(true)

        await SecureStore.setItemAsync("token", response.data.token);
        router.push('/(tabs)/Index')
      }
    } catch (error) {
      setmsg('Something went wrong. Please try again')
      setsuccess(false)
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
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mt-2"
          >
            <ChevronLeft size={22} color="#0f172a" />
          </Pressable>

          {/* Logo */}
          <View className="items-center mt-4 mb-2">
            <Image
              // Replace with your own logo image
              source={require("../../../assets/Logo.png")}
              className="w-24 h-24 rounded-3xl"
              resizeMode="cover"
            />
            <Text className="text-3xl font-extrabold text-slate-900 mt-4">
              Create Account
            </Text>
            <Text className="text-slate-400 mt-1">
              Join Zuno and start connecting
            </Text>
          </View>

          {/* Username */}
          <View className="mt-8 mb-4">
            <Text className="text-slate-900 font-semibold mb-2">
              Username
            </Text>
            <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
              <AtSign size={20} color="#2563eb" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                className="flex-1 ml-3 text-slate-900 h-full"
              />
            </View>
            <Text className="text-slate-400 text-xs mt-2">
              Your unique username on Zuno
            </Text>
          </View>

          {/* Display Email */}
          <View className="mb-4">
            <Text className="text-slate-900 font-semibold mb-2">
              Your Email
            </Text>
            <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
              <Mail size={20} color="#2563eb" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-3 text-slate-900 h-full"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
            </View>
            <Text className="text-slate-400 text-xs mt-2">
              To secure your account
            </Text>
          </View>

          {/* Display Phone */}
          <View className="mb-4">
            <Text className="text-slate-900 font-semibold mb-2">
              Phone Number
            </Text>
            <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
              <Phone size={20} color="#2563eb" />
              <TextInput
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                placeholder="Enter your number"
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-3 text-slate-900 h-full"
              />
            </View>
            <Text className="text-slate-400 text-xs mt-2">
              To secure your account
            </Text>
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-slate-900 font-semibold mb-2">
              Password
            </Text>
            <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
              <Lock size={20} color="#2563eb" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
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
            <Text className="text-slate-400 text-xs mt-2">
              Use 8+ characters with letters and numbers
            </Text>
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-slate-900 font-semibold mb-2">
              Confirm Password
            </Text>
            <View className={`flex-row items-center border ${msg == 'Passwords do not match' ? 'border-red-600' : 'border-slate-200'}  rounded-2xl px-4 h-14`}>
              <Lock size={20} color="#2563eb" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showConfirmPassword}
                className="flex-1 ml-3 text-slate-900 h-full"
              />
              <Pressable onPress={() => setShowConfirmPassword((v) => !v)}>
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#64748b" />
                ) : (
                  <Eye size={20} color="#64748b" />
                )}
              </Pressable>
            </View>
            <Text className="text-slate-400 text-xs mt-2">
              Re-enter your password
            </Text>
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

          {/* Terms checkbox */}
          <Pressable
            onPress={() => setAgreed((v) => !v)}
            className="flex-row items-start mb-6"
          >
            <View
              className={`w-5 h-5 rounded-md items-center justify-center mr-3 mt-0.5 ${agreed ? "bg-blue-600" : "border border-slate-300"
                }`}
            >
              {agreed && <Check size={14} color="white" />}
            </View>
            <Text className="text-slate-700 flex-1 flex-wrap">
              I agree to the{" "}
              <Text className="text-blue-600 font-medium">
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text className="text-blue-600 font-medium">
                Privacy Policy
              </Text>
            </Text>
          </Pressable>

          {/* Create Account button */}
          <Pressable
            onPress={handleCreateAccount}
            className="bg-blue-600 rounded-2xl h-14 items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">
              Create Account
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="mx-3 text-slate-400 text-sm">
              Already have an account?
            </Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Login link */}
          <Pressable
            onPress={() => router.push("/(auth)/Login")}
            className="items-center"
          >
            <Text className="text-blue-600 font-semibold">
              Login to your account
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}