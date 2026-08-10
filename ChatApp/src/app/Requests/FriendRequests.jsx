import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    FlatList,
    Animated,
    DevSettings,
} from "react-native";
import { Search as SearchIcon, X, UserPlus, Check, UserRoundCheck, UserRoundX } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { API_BASE } from "../../config/api";
import * as SecureStore from 'expo-secure-store'
import { useLocalSearchParams } from "expo-router";

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

const UserRow = React.memo(function UserRow({ item, onAccept, onDelete, setAccepted, accepted = false }) {
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

            {/* Delete */}
            <Pressable
                onPress={async () => {
                    await onDelete(item._id);
                    // DevSettings.reload()
                }}
                className="w-10 h-9 rounded-xl bg-red-50 items-center justify-center"
            >
                <UserRoundX size={18} color="#ef4444" />
            </Pressable>

            {/* Accept */}
            <Pressable
                disabled={accepted}
                onPress={async () => {
                    await onAccept(item._id);
                    setAccepted(true);
                    // DevSettings.reload()
                }}
                className={`h-9 px-3 rounded-xl flex-row items-center justify-center ${accepted ? "bg-emerald-50" : "bg-blue-50"
                    }`}
            >
                {accepted ? (
                    <Check size={18} color="#10b981" />
                ) : (
                    <UserRoundCheck size={18} color="#2563eb" />
                )}

                <Text
                    className={`ml-1 text-sm font-semibold ${accepted ? "text-emerald-600" : "text-blue-600"
                        }`}
                >
                    {accepted ? "Accepted" : "Accept"}
                </Text>
            </Pressable>

        </View>
    );
});

export default function FriendRequests() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const debounceRef = useRef(null);
    const [ALL_USER, setALL_USER] = useState([]);
    const [accepted, setAccepted] = useState(false)

    const { requests } = useLocalSearchParams();

    const friendRequests = requests
        ? JSON.parse(requests)
        : [];

    const handleAccept = useCallback(async (_id) => {
        try {
            // console.log("accept for user:", _id);

            const token = await SecureStore.getItemAsync("token");

            if (!token) {
                console.log("No token found");
                return;
            }

            const response = await axios.post(
                `${API_BASE}/accept-request`,
                { _id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Add friend response:", response.data);
        } catch (error) {
            console.error("Accept request error:", error.response?.data || error.message);
        }
    }, []);

    const handleDelete = useCallback(async (_id) => {
        try {
            console.log("delete for user:", _id);

            const token = await SecureStore.getItemAsync("token");

            if (!token) {
                console.log("No token found");
                return;
            }

            const response = await axios.post(
                `${API_BASE}/delete-request`,
                { _id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Add friend response:", response.data);
        } catch (error) {
            console.error("Delete Request error:", error.response?.data || error.message);
        }
    }, [])

    const renderItem = useCallback(
        ({ item }) => <UserRow item={item} onAccept={handleAccept} onDelete={handleDelete} setAccepted={setAccepted} accepted={accepted} />,
        [handleAccept, handleDelete, accepted]
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

    const listEmptyComponent = useMemo(() => {
        if (isLoading) return null;
        return (
            <View className="items-center mt-20 px-10">
                <Text className="text-base text-slate-400 text-center">
                    No Notifications
                </Text>
            </View>
        );
    }, [isLoading]);

    return (
        <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
            <View className="px-6 pt-2 pb-2">
                <Text className="text-3xl font-extrabold text-slate-900 mb-5">
                    Friend Requests
                </Text>
            </View>

            {isLoading ? (
                <SkeletonList />
            ) : (
                <FlatList
                    data={friendRequests}
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
    )
}