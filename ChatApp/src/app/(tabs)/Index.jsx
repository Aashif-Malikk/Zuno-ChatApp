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
import { useRouter } from "expo-router";
import {
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  Pin,
  BellOff,
  Users,
  Briefcase,
  UserPlus,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_BASE } from "../../config/api";
import { io } from "socket.io-client";

// Requires: npm install lucide-react-native react-native-svg

// ---- Mock data -------------------------------------------------------
const CHATS = [
  // ...unchanged, kept out for brevity — see your original file
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
// `isOnline` is now a plain prop derived from the parent's Set, not something
// this component figures out on its own — it has no way to know about every
// online user, only the parent (which owns the full list) does.
function ChatRow({ chat, isLast, isOnline }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/Chat/[id]",
          params: { id: JSON.stringify(chat._id) },
        })
      }
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
        {isOnline && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </View>

      {/* Name + message */}
      <View className="flex-1 mr-3">
        <Text
          className="text-base font-semibold text-slate-900"
          numberOfLines={1}
        >
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
            {chat.lastMessage !== null ? (chat.lastMessage.type !== "image" ? chat.lastMessage.message : "image") : "no message"}
          </Text>
        )}
      </View>

      {/* Right column: time, badges, icons */}
      <View className="items-end">
        <Text className="text-sm text-slate-400 mb-2">
          {"on", chat.lastMessage !== null ? chat.lastMessage.time : " " || "2m ago"}
        </Text>

        {chat.unseenCount > 0 && (
          <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {chat.unseenCount || 0}
            </Text>
          </View>
        )}
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
          className={`px-4 py-3 ${activeFilter === f.key ? "bg-blue-50" : ""}`}
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

const getAllIndexData = async (setIsLoading) => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      console.log("No token found");
      return;
    }
    setIsLoading(true)

    const response = await axios.get(`${API_BASE}/indexData`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    return {
      friends: response.data.friends,
      friendRequestsReceived: response.data.friendRequestsReceived,
    };
  } catch (error) {
    console.error("Error fetching friends and requests:", error);
  } finally {
    setIsLoading(false)
  }
};

// ---- Screen ---------------------------------------------------------------
export default function ChatsScreen() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setfriends] = useState([]);
  const [friendRequest, setfriendRequest] = useState([]);

  // A Set of every currently-online userId — not a single string.
  // This is the actual fix: we can track any number of online friends at once.
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const socketRef = useRef(null);

  console.log(API_BASE)

  // ---- Socket setup ---------------------------------------------------
  useEffect(() => {
    let socket;

    // useEffect callbacks can't be async themselves (React expects them to
    // return void or a cleanup function, not a Promise) — so the async work
    // lives in this inner function instead.
    const setupSocket = async () => {
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      socket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"],
      });
      socketRef.current = socket;

      // One-time snapshot the server sends right after we connect, so we
      // don't miss anyone who was already online before we joined.
      socket.on("onlineUsers:init", (ids) => {
        setOnlineUserIds(new Set(ids));
      });

      socket.on("user:online", ({ userId }) => {
        setOnlineUserIds((prev) => new Set(prev).add(userId));
      });

      socket.on("user:offline", ({ userId }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      socket.on("connect_error", (err) => {
        console.log("Socket connection failed:", err.message);
      });
    };

    setupSocket();

    // Cleanup: disconnect when this screen unmounts so we don't leak
    // sockets or keep listening after the component is gone.
    return () => {
      socket?.disconnect();
    };
  }, [socketRef]);

  // useEffect(() => {
  //   const timer = setTimeout(() => setIsLoading(false), 1200);
  //   return () => clearTimeout(timer);
  // }, []);

  // ---- Fetching friends + friend requests ----------------------------
  useEffect(() => {
    const indexData = async () => {
      const result = await getAllIndexData(setIsLoading);
      if (!result) return;
      setfriendRequest(result.friendRequestsReceived);
      setfriends(result.friends);
    };
    indexData();
  }, []);

  const filteredChats = useMemo(() => {
    let result = friends;

    if (query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    switch (activeFilter) {
      case "unread":
        result = result.filter((c) => c.unseenCount > 0);
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
  }, [query, activeFilter, friends]);

  const router = useRouter();

  const showFriendRequests = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        console.log("No token found");
        return;
      }
      const response = await axios.post(
        `${API_BASE}/friend-requests`,
        { requestIds: friendRequest },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      router.push({
        pathname: "/Requests/FriendRequests",
        params: {
          requests: JSON.stringify(response.data.usersThatSendRequest),
        },
      });
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      throw error;
    }
  };

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
                className="w-11 h-11 rounded-xl border border-slate-200 items-center justify-center"
              >
                <UserPlus size={23} color="#0f172a" />
              </Pressable>

              {friendRequest.length > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 items-center justify-center border-2 border-white">
                  <Text className="text-[10px] font-bold text-white">
                    {friendRequest.length}
                  </Text>
                </View>
              )}
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
              <ChatRow
                chat={item}
                isLast={index === filteredChats.length - 1}
                isOnline={onlineUserIds.has(item._id)}
              />
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