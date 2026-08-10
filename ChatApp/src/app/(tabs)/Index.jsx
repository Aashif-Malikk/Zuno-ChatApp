import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  FlatList,
  Animated,
} from "react-native";
import { Skeleton } from "boneyard-js/native";
import { useRouter } from "expo-router";
import {
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  Pin,
  BellOff,
  Users,
  Briefcase,
  PlusSquare,
  UserPlus,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from 'expo-secure-store'
import axios from "axios";
import { API_BASE } from "../../config/api";

// Requires: npm install lucide-react-native react-native-svg

// ---- Mock data -------------------------------------------------------
const CHATS = [
  {
    id: "1",
    name: "Rahul Sharma",
    message: "Hey! Are we still meeting today?",
    time: "2m ago",
    avatar: "https://i.pravatar.cc/150?img=12",
    isOnline: true,
    unreadCount: 2,
  },
  {
    id: "2",
    name: "Aman Verma",
    message: "Typing...",
    isTyping: true,
    time: "5m ago",
    avatar: "https://i.pravatar.cc/150?img=13",
    isOnline: true,
    unreadCount: 0,
  },
  {
    id: "3",
    name: "Priya Singh",
    message: "Photo",
    isPhoto: true,
    time: "1h ago",
    avatar: "https://i.pravatar.cc/150?img=32",
    isOnline: false,
    unreadCount: 1,
  },
  {
    id: "4",
    name: "College Buddies",
    message: "Aman: Notes uploaded ✅",
    time: "3h ago",
    isGroup: true,
    groupIcon: "users",
    isPinned: true,
    isMuted: true,
    unreadCount: 0,
  },
  {
    id: "5",
    name: "Sneha Patel",
    message: "Thanks a lot! 😊",
    time: "Yesterday",
    avatar: "https://i.pravatar.cc/150?img=45",
    isOnline: false,
    unreadCount: 0,
  },
  {
    id: "6",
    name: "Sneha Patel",
    message: "Thanks a lot! 😊",
    time: "Yesterday",
    avatar: "https://i.pravatar.cc/150?img=45",
    isOnline: false,
    unreadCount: 0,
  },
  {
    id: "7",
    name: "Work Group",
    message: "You: Presentation tomorrow at 11 AM",
    time: "Yesterday",
    isGroup: true,
    groupIcon: "briefcase",
    isMuted: true,
    unreadCount: 0,
  },
  {
    id: "8",
    name: "Work Group",
    message: "You: Presentation tomorrow at 11 AM",
    time: "Yesterday",
    isGroup: true,
    groupIcon: "briefcase",
    isMuted: true,
    unreadCount: 0,
  },
  {
    id: "9",
    name: "Vikram",
    message: "Okay, got it.",
    time: "2d ago",
    avatar: "https://i.pravatar.cc/150?img=51",
    isOnline: false,
    unreadCount: 0,
  },
  {
    id: "10",
    name: "Vikram",
    message: "Okay, got it.",
    time: "2d ago",
    avatar: "https://i.pravatar.cc/150?img=51",
    isOnline: false,
    unreadCount: 0,
  },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "pinned", label: "Pinned" },
  { key: "muted", label: "Muted" },
];

// ---- Group avatar (icon-based) ---------------------------------------
function GroupAvatar({ icon = null }) {
  const isBriefcase = icon === "briefcase";
  return (
    <View
      className={`w-14 h-14 rounded-full items-center justify-center ${isBriefcase ? "bg-emerald-100" : "bg-indigo-100"
        }`}
    >
      {isBriefcase ? (
        <Briefcase size={24} color="#059669" />
      ) : (
        <Users size={24} color="#4f46e5" />
      )}
    </View>
  );
}

// ---- Single chat row ---------------------------------------------------
function ChatRow({ chat, isLast }) {
  return (
    <Pressable
      className={`flex-row items-center py-4 ${!isLast ? "border-b border-slate-100" : ""
        }`}
    >
      {/* Avatar */}
      <View className="relative mr-4">
        {chat.isGroup ? (
          <GroupAvatar icon={chat.groupIcon} />
        ) : (
          <Image
            source={{ uri: chat.avatar }}
            className="w-14 h-14 rounded-full"
          />
        )}
        {chat.isOnline && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </View>

      {/* Name + message */}
      <View className="flex-1 mr-3">
        <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
          {chat.name}
        </Text>

        {chat.isPhoto ? (
          <View className="flex-row items-center mt-1">
            <ImageIcon size={16} color="#94a3b8" />
            <Text className="text-sm text-slate-400 ml-1">Photo</Text>
          </View>
        ) : (
          <Text
            className={`text-sm mt-1 ${chat.isTyping ? "text-blue-600 font-medium" : "text-slate-400"
              }`}
            numberOfLines={1}
          >
            {chat.message || "no message"}
          </Text>
        )}
      </View>

      {/* Right column: time, badges, icons */}
      <View className="items-end">
        <Text className="text-sm text-slate-400 mb-2">{chat.time || "2m ago"}</Text>

        {chat.unreadCount > 0 && (
          <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {chat.unreadCount || 0}
            </Text>
          </View>
        )}

        {/* {(chat.isPinned || chat.isMuted) && (
          <View className="flex-row items-center gap-3 mt-1">
            {chat.isPinned && <Pin size={18} color="#2563eb" />}
            {chat.isMuted && <BellOff size={18} color="#94a3b8" />}
          </View>
        )} */}
      </View>
    </Pressable>
  );
}

// ---- Filter dropdown -----------------------------------------------------
function FilterMenu({ activeFilter, onSelect, onClose }) {
  return (
    <View className="absolute right-0 top-14 z-20 bg-white rounded-2xl border border-slate-200 shadow-lg py-2 w-40">
      {FILTERS.map((f) => (
        <Pressable
          key={f.key}
          onPress={() => {
            onSelect(f.key);
            onClose();
          }}
          className={`px-4 py-3 ${activeFilter === f.key ? "bg-blue-50" : ""
            }`}
        >
          <Text
            className={`text-base ${activeFilter === f.key
              ? "text-blue-600 font-semibold"
              : "text-slate-700"
              }`}
          >
            {f.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---- Skeleton row ------------------------------------------------------
const ROW_HEIGHT = 76;

function SkeletonPulse({ style, className }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      className={`bg-slate-200 rounded-lg ${className}`}
      style={[style, { opacity }]}
    />
  );
}

function SkeletonRow() {
  return (
    <View
      style={{ height: ROW_HEIGHT }}
      className="flex-row items-center px-6 border-b border-slate-100"
    >
      <SkeletonPulse className="w-14 h-14 rounded-full" />
      <View className="ml-4 flex-1">
        <SkeletonPulse className="h-4 w-32 mb-2" />
        <SkeletonPulse className="h-3 w-24" />
      </View>
      <SkeletonPulse className="w-9 h-9 rounded-xl" />
    </View>
  );
}

function SkeletonList() {
  return (
    <View>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const friendsAndRequests = async () => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      console.log("No token found");
      return;
    }

    const response = await axios.get(`${API_BASE}/my-friends`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
    });
    return { friends: response.data.friends, friendRequestsReceived: response.data.friendRequestsReceived };

  } catch (error) {
    console.error("Error fetching friends and requests:", error);
  }
}

// ---- Screen ---------------------------------------------------------------
export default function ChatsScreen() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setfriends] = useState([]);
  const [friendRequest, setfriendRequest] = useState([]);

  // console.log(friends)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // fetching Friend Requests ----------------------

  useEffect(() => {
    const fetchFriends = async () => {
      const { friends, friendRequestsReceived } = await friendsAndRequests();
      setfriendRequest(friendRequestsReceived)
      setfriends(friends)
    }
    fetchFriends();
  }, []);

  const filteredChats = useMemo(() => {
    let result = friends;

    if (query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    switch (activeFilter) {
      case "unread":
        result = result.filter((c) => c.unreadCount > 0);
        break;
      case "pinned":
        result = result.filter((c) => c.isPinned);
        break;
      case "muted":
        result = result.filter((c) => c.isMuted);
        break;
      default:
        break;
    }

    return result;
  }, [query, activeFilter]);

  const router = useRouter()

  const showFriendRequests = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        console.log("No token found");
        return;
      }
      const response = await axios.post(`${API_BASE}/friend-requests`, {
        requestIds: friendRequest
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
      });

      // const res = response.data.usersThatSendRequest
      router.push({
        pathname: "/Requests/FriendRequests",
        params: {
          requests: JSON.stringify(response.data.usersThatSendRequest),
        },
      });

      // console.log("Friend Requests data:", response.data);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      throw error
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-5">
          <Text className="text-3xl font-extrabold text-slate-900">Zuno</Text>

          <View className="flex-row items-center gap-3">
            <View className="relative">
              <Pressable
                onPress={showFriendRequests}
                className="w-11 h-11 rounded-xl border border-slate-200 items-center justify-center">
                <UserPlus size={23} color="#0f172a" />
              </Pressable>

              {/* Notification Badge */}
              {
                friendRequest.length > 0 && (
                  <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 items-center justify-center border-2 border-white">
                    <Text className="text-[10px] font-bold text-white">
                      {friendRequest.length}
                    </Text>
                  </View>
                )
              }
            </View>

            <View>
              <Pressable
                onPress={() => setShowFilterMenu((v) => !v)}
                className="w-11 h-11 rounded-xl border border-slate-200 items-center justify-center"
              >
                <SlidersHorizontal size={20} color="#0f172a" />
              </Pressable>

              {showFilterMenu && (
                <FilterMenu
                  activeFilter={activeFilter}
                  onSelect={setActiveFilter}
                  onClose={() => setShowFilterMenu(false)}
                />
              )}
            </View>
          </View>
        </View>

        {/* Search bar */}
        <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14 mb-6">
          <Search size={20} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or username"
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-3 text-base text-slate-900 h-full"
          />
        </View>

        {/* Section header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-slate-900">
            Recent Chats
          </Text>
          <Pressable>
            <Text className="text-base text-blue-600 font-semibold">
              View All
            </Text>
          </Pressable>
        </View>

        {/* Active filter chip (shown when not "All") */}
        {activeFilter !== "all" && (
          <View className="flex-row items-center mb-2">
            <View className="flex-row items-center bg-blue-50 rounded-full px-3 py-1.5">
              <Text className="text-sm text-blue-600 font-medium mr-2">
                {FILTERS.find((f) => f.key === activeFilter)?.label}
              </Text>
              <Pressable onPress={() => setActiveFilter("all")}>
                <Text className="text-sm text-blue-600 font-bold">✕</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Chat list */}
        {isLoading ? (
          <SkeletonList />
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ChatRow chat={item} isLast={index === filteredChats.length - 1} />
            )}
            ListEmptyComponent={
              <View className="items-center mt-16">
                <Text className="text-base text-slate-400">
                  No chats match your search.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}