import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  FlatList,
  Animated,
} from "react-native";
import { Search as SearchIcon, X, UserPlus, Check } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { API_BASE } from "../../config/api";
import * as SecureStore from 'expo-secure-store'

// Requires: npm install lucide-react-native react-native-svg

// ---- Mock data ---------------------------------------------------------
const ALL_USERS = [
  { id: "1", name: "Rahul Sharma", username: "@rahul_s", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "2", name: "Aman Verma", username: "@aman.v", avatar: "https://i.pravatar.cc/150?img=13" },
  { id: "3", name: "Priya Singh", username: "@priyasingh", avatar: "https://i.pravatar.cc/150?img=32" },
  { id: "4", name: "Sneha Patel", username: "@sneha_p", avatar: "https://i.pravatar.cc/150?img=45" },
  { id: "5", name: "Vikram Rana", username: "@vikram.r", avatar: "https://i.pravatar.cc/150?img=51" },
  { id: "6", name: "Ananya Gupta", username: "@ananya_g", avatar: "https://i.pravatar.cc/150?img=25" },
  { id: "7", name: "Karan Mehta", username: "@karanm", avatar: "https://i.pravatar.cc/150?img=15" },
  { id: "8", name: "Isha Kapoor", username: "@isha.kapoor", avatar: "https://i.pravatar.cc/150?img=47" },
  { id: "9", name: "Rohit Yadav", username: "@rohit_y", avatar: "https://i.pravatar.cc/150?img=18" },
  { id: "10", name: "Neha Joshi", username: "@neha.joshi", avatar: "https://i.pravatar.cc/150?img=29" },
];

const ROW_HEIGHT = 76;
const SEARCH_DELAY = 500; // simulated network latency

// ---- Skeleton loader -----------------------------------------------------
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

// ---- User fetching -----------------------------------------------------
const fetchAllUsers = async () => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      console.log("No token found");
      return;
    }

    const response = await axios.get(`${API_BASE}/get-users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
    });
    return response.data.users;

  } catch (error) {
    console.error("Status:", error.response?.status);
    console.error("Backend error:", error.response?.data);
    console.error("Message:", error.message);
  }
}

// ---- Result row (memoized) -----------------------------------------------
const UserRow = React.memo(function UserRow({ item, onAdd, isAdded }) {
  return (
    <View
      style={{ height: ROW_HEIGHT }}
      className="flex-row items-center px-6 border-b border-slate-100"
    >
      <Image source={{ uri: item.avatar }} className="w-14 h-14 rounded-full" />

      <View className="ml-4 flex-1">
        <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-sm text-slate-400 mt-0.5" numberOfLines={1}>
          {item?._id || "No username"}
        </Text>
      </View>

      {
        isAdded === item._id ||  item.friendRequestsSent?.includes(isAdded) ? (
          <View className="w-9 h-9 rounded-xl bg-green-50 items-center justify-center">
            <Check size={18} color="#16a34a" />
          </View>
        ) : (
          <Pressable
            onPress={() => onAdd([item._id])}
            className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center"
          >
            <UserPlus size={18} color="#2563eb" />
          </Pressable>
        )
      }
    </View>
  );
});

// ---- Screen ----------------------------------------------------------------
export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);
  const [ALL_USER, setALL_USER] = useState([]);
  const [addedFriend, setAddedFriend] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await fetchAllUsers();
      setALL_USER(users);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();

    if (trimmed.length === 0) {
      setIsLoading(false);
      setResults([]);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(() => {
      const q = trimmed.toLowerCase();
      const matches = ALL_USER.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u._id.toLowerCase().includes(q)
      );
      setResults(matches);
      setIsLoading(false);
    }, SEARCH_DELAY);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleAdd = useCallback(async ([_id]) => {
    try {
      console.log("Add pressed for user:", _id);

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        console.log("No token found");
        return;
      }

      const response = await axios.post(
        `${API_BASE}/add-friend`,
        { _id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Add friend response:", response.data);

      if (response.data.success) {
        setAddedFriend(_id);
      }
    } catch (error) {
      console.error("Add friend error:", error.response?.data || error.message);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }) => <UserRow item={item} onAdd={handleAdd} isAdded={addedFriend} />,
    [handleAdd, addedFriend]
  );

  const keyExtractor = useCallback((item) => item._id, []);

  const getItemLayout = useCallback(
    (_, index) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    []
  );

  const hasQuery = query.trim().length > 0;

  const listEmptyComponent = useMemo(() => {
    if (isLoading) return null;
    if (!hasQuery) {
      return (
        <View className="items-center mt-20 px-10">
          <SearchIcon size={40} color="#cbd5e1" />
          <Text className="text-base text-slate-400 mt-4 text-center">
            Search for people by name or username
          </Text>
        </View>
      );
    }
    return (
      <View className="items-center mt-20 px-10">
        <Text className="text-base text-slate-400 text-center">
          No results found for "{query.trim()}"
        </Text>
      </View>
    );
  }, [isLoading, hasQuery, query]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-2 pb-4">
        <Text className="text-3xl font-extrabold text-slate-900 mb-5">
          Search
        </Text>

        {/* Search bar */}
        <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
          <SearchIcon size={20} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or username"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 ml-3 text-base text-slate-900 h-full"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={18} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          ListEmptyComponent={listEmptyComponent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}