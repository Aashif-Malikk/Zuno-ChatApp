import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Search,
  ChevronRight,
  Copy,
  Check,
  User,
  Lock,
  Bell,
  HelpCircle,
  Info,
  LogOut,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { API_BASE } from "../../config/api";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store'


// Requires:
//   npx expo install expo-clipboard
//   npm install lucide-react-native react-native-svg

// const USER = {
//   name: "Aashif Malik",
//   username: "@aashif",
//   uniqueId: "A7K9P2X",
//   avatar: "https://i.pravatar.cc/150?img=12",
//   isOnline: true,
// };

const ACCOUNT_ITEMS = [
  { key: "edit", label: "Edit Profile", icon: User, color: "#2563eb" },
  { key: "security", label: "Security", icon: Lock, color: "#7c3aed" },
  { key: "notifications", label: "Notifications", icon: Bell, color: "#f59e0b" },
];

const MORE_ITEMS = [
  { key: "help", label: "Help & Support", icon: HelpCircle, color: "#2563eb" },
  { key: "about", label: "About Zuno", icon: Info, color: "#f59e0b", trailing: "v1.0.0" },
  { key: "logout", label: "Log Out", icon: LogOut, color: "#ef4444", danger: true },
];

function SectionLabel({ children }) {
  return (
    <Text className="text-base text-slate-400 font-medium mb-3">
      {children}
    </Text>
  );
}

function ListRow({ item, isLast, onPress }) {
  const Icon = item.icon;
  return (
    <Pressable
      onPress={() => onPress?.(item.key)}
      className={`flex-row items-center py-4 ${!isLast ? "border-b border-slate-100" : ""
        }`}
    >
      <Icon size={22} color={item.color} />
      <Text
        className={`flex-1 ml-4 text-base font-medium ${item.danger ? "text-red-500" : "text-slate-900"
          }`}
      >
        {item.label}
      </Text>
      {item.trailing ? (
        <Text className="text-sm text-slate-400 mr-2">{item.trailing}</Text>
      ) : (
        <ChevronRight size={20} color="#94a3b8" />
      )}
    </Pressable>
  );
}

const getProfileDeatils = async () => {
  try {
    const token = await SecureStore.getItemAsync("token");
    const myProfile = await axios.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    return myProfile.data.user;
  } catch (error) {
    console.error("Error fetching profile details:", error);
    throw error;
  }
};

export default function ProfileScreen({ navigation }) {
  const [copied, setCopied] = useState(false);
  const [USER, setUser] = useState([])
  console.log(User)
  const router = useRouter()

  useEffect(() => {
    const myProfile = async () => {
      const details = await getProfileDeatils();
      setUser(details)
    }
    myProfile()
  }, [])

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(USER.uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleAccountPress = (key) => {
    // TODO: navigate to the relevant screen, e.g. navigation.navigate(key)
    console.log("Account item pressed:", key);
    // if (key == 'notifications') {
    //   router.push('/(comp)/Notification')
    // }
  };

  const handleMorePress = async (key) => {
    if (key === "logout") {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          console.log("No token found");
          return;
        }

        const response = await axios.post(
          `${API_BASE}/logout`, {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Logout response:", response.data);
        if (response.data.success) {
          // Remove token from SecureStore
          await SecureStore.deleteItemAsync("token");

          // Redirect to login
          router.replace("/(auth)/Login");
        } else {
          console.log("Logout failed:", response.data);
        }
      } catch (error) {
        console.error("Logout error:");
      }
    };
    console.log("More item pressed:", key);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-6">
          <Text className="text-3xl font-extrabold text-slate-900">Profile</Text>
          {/* <Pressable className="w-11 h-11 rounded-xl border border-slate-200 items-center justify-center">
            <Search size={20} color="#0f172a" />
          </Pressable> */}
        </View>

        <SectionLabel>Profile</SectionLabel>

        {/* Profile card */}
        <Pressable className="border border-slate-100 rounded-2xl p-4 mb-8 bg-white shadow-sm">
          <View className="flex-row items-center">
            <View className="relative">
              <Image
                source={{ uri: USER.avatar }}
                className="w-20 h-20 rounded-full"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-xl font-bold text-slate-900">
                {USER.name}
              </Text>
              <Text className="text-base text-slate-400 mt-0.5">
                {USER.email}
              </Text>
            </View>

            {/* <ChevronRight size={20} color="#94a3b8" /> */}
          </View>

          <View className="flex-row items-center justify-between mt-5">
            <View>
              <Text className="text-sm text-slate-400 mb-1">Unique ID</Text>
              <Text className="text-base font-semibold text-blue-600">
                {USER.uniqueId}
              </Text>
            </View>

            <Pressable
              onPress={handleCopyId}
              className="flex-row items-center border border-blue-600 rounded-xl px-4 py-2.5"
            >
              {copied ? (
                <Check size={16} color="#2563eb" />
              ) : (
                <Copy size={16} color="#2563eb" />
              )}
              <Text className="text-blue-600 font-semibold ml-2 text-base">
                {copied ? "Copied!" : "Copy ID"}
              </Text>
            </Pressable>
          </View>
        </Pressable>

        {/* Account section */}
        <SectionLabel>Account</SectionLabel>
        <View className="border border-slate-100 rounded-2xl px-4 mb-8 bg-white shadow-sm">
          {ACCOUNT_ITEMS.map((item, i) => (
            <ListRow
              key={item.key}
              item={item}
              isLast={i === ACCOUNT_ITEMS.length - 1}
              onPress={handleAccountPress}
            />
          ))}
        </View>

        {/* More section */}
        <SectionLabel>More</SectionLabel>
        <View className="border border-slate-100 rounded-2xl px-4 mb-4 bg-white shadow-sm">
          {MORE_ITEMS.map((item, i) => (
            <ListRow
              key={item.key}
              item={item}
              isLast={i === MORE_ITEMS.length - 1}
              onPress={handleMorePress}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}