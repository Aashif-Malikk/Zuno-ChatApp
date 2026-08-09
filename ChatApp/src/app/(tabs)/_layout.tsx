import React from "react";
import { Tabs } from "expo-router";
import { MessageCircle, Users, Search, User, Settings } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Requires: npm install lucide-react-native react-native-svg
// Uses Expo Router's file-based tab navigation.

const ACTIVE_COLOR = "#2563eb";
const INACTIVE_COLOR = "#64748b";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          backgroundColor: "#fff",
        },
      }}
    >
      <Tabs.Screen
        name="Index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-9 h-9 items-center justify-center rounded-xl ${focused ? "bg-blue-50" : ""
                }`}
            >
              <MessageCircle
                size={22}
                color={color}
                fill={focused ? color : "transparent"}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}