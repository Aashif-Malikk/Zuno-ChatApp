import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ChevronLeft,
    Camera,
    User,
    Mail,
    IdCard,
    Phone,
    Lock,
    Info,
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import PickImage from '../components/PickImage'
import axios from "axios";
import { API_BASE } from "../../config/api";

// ---- Data fetching / mutation ---------------------------------------------
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

// Sends username, email, and (if changed) a new profile picture.
// Uses FormData since an image file may be attached.
const updateProfile = async ({ username, email, avatarUri }) => {
    const token = await SecureStore.getItemAsync("token");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);

    // Only attach the picture if the user actually picked a new local file —
    // avatarUri from the server is a remote https:// URL, not something we
    // need to (or can) re-upload as a file.
    if (avatarUri && !avatarUri.startsWith("http")) {
        formData.append("image", {
            uri: avatarUri,
            name: `avatar-${Date.now()}.jpg`,
            type: "image/jpeg",
        });
    }

    const response = await axios.post(`${API_BASE}/update-profile`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
};

// ---- Small pieces -----------------------------------------------------
function LockedField({ icon: Icon, label, value }) {
    return (
        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-4">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center mr-3">
                <Icon size={18} color="#64748b" />
            </View>
            <View className="flex-1">
                <Text className="text-sm text-slate-400">{label}</Text>
                <Text className="text-base text-slate-900 mt-0.5">{value || "—"}</Text>
            </View>
            <Lock size={18} color="#94a3b8" />
        </View>
    );
}

// ---- Screen ----------------------------------------------------------------
export default function EditProfile() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState("");

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [avatarUri, setAvatarUri] = useState(""); // current remote avatar OR a freshly picked local file
    const [uniqueId, setUniqueId] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const user = await getProfileDeatils();
                setUsername(user?.name || "");
                setEmail(user?.email || "");
                setAvatarUri(user?.avatar || "");
                setUniqueId(user?.uniqueId || "");
                setPhone(user?.phone || "");
            } catch (error) {
                setMsg("Couldn't load your profile. Pull to refresh or try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handlePickImage = () => {
        PickImage(setAvatarUri);
    };

    const handleSave = async () => {
        if (isSaving) return; // guard against double taps while a request is in flight

        if (!username.trim()) {
            setMsg("Username can't be empty.");
            return;
        }
        if (!email.trim()) {
            setMsg("Gmail can't be empty.");
            return;
        }

        setMsg("");
        setIsSaving(true);

        try {
            const result = await updateProfile({
                username: username.trim(),
                email: email.trim(),
                avatarUri,
            });

            if (result?.success) {
                router.replace("/(tabs)/Profile");
            } else {
                setMsg(result?.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            setMsg(
                error.response?.data?.message ||
                "Failed to update profile. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-3">
                <Pressable onPress={() => router.back()} className="p-1">
                    <ChevronLeft size={24} color="#0f172a" />
                </Pressable>

                <Text className="text-lg font-bold text-slate-900">Edit Profile</Text>

                <Pressable onPress={handleSave} disabled={isSaving} className="p-1">
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                        <Text className="text-base font-semibold text-blue-600">Save</Text>
                    )}
                </Pressable>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Error / info message */}
                {msg ? (
                    <View className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mt-4">
                        <Text className="text-sm text-red-600">{msg}</Text>
                    </View>
                ) : null}

                {/* Profile picture */}
                <View className="items-center mt-6 mb-8">
                    <View className="relative">
                        <Image
                            source={{ uri: avatarUri || "https://i.pravatar.cc/150?img=12" }}
                            className="w-32 h-32 rounded-full bg-slate-100"
                        />
                        <Pressable
                            onPress={handlePickImage}
                            className="absolute bottom-0 right-0 w-11 h-11 rounded-full bg-blue-600 items-center justify-center border-4 border-white"
                        >
                            <Camera size={18} color="white" />
                        </Pressable>
                    </View>

                    <Pressable onPress={handlePickImage} className="mt-4">
                        <Text className="text-base text-blue-600 font-semibold">
                            Change Profile Picture
                        </Text>
                    </Pressable>
                </View>

                {/* Editable Information */}
                <Text className="text-base text-slate-400 font-medium mb-3">
                    Editable Information
                </Text>
                <View className="border border-slate-100 rounded-2xl px-4 mb-8 bg-white shadow-sm">
                    <View className="py-4 border-b border-slate-100">
                        <Text className="text-sm text-slate-400 mb-2">Username</Text>
                        <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
                            <User size={20} color="#2563eb" />
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter your username"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="none"
                                className="flex-1 ml-3 text-base text-slate-900 h-full"
                            />
                        </View>
                    </View>

                    <View className="py-4">
                        <Text className="text-sm text-slate-400 mb-2">Gmail</Text>
                        <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 h-14">
                            <Mail size={20} color="#2563eb" />
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                className="flex-1 ml-3 text-base text-slate-900 h-full"
                            />
                        </View>
                    </View>
                </View>

                {/* Account Information (locked) */}
                <Text className="text-base text-slate-400 font-medium mb-3">
                    Account Information
                </Text>
                <View className="mb-6" style={{ gap: 12 }}>
                    <LockedField icon={IdCard} label="Unique ID" value={uniqueId} />
                    <LockedField icon={Phone} label="Phone Number" value={phone} />
                </View>

                {/* Info banner */}
                <View className="flex-row items-start bg-blue-50 rounded-2xl px-4 py-3">
                    <Info size={18} color="#2563eb" style={{ marginTop: 2 }} />
                    <Text className="text-sm text-blue-900 ml-2 flex-1 flex-wrap">
                        You can update your username, gmail and profile picture. Unique ID
                        and phone number cannot be changed.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}