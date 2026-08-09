import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Lock,
  Share2,
  Play,
  Mic,
  Plus,
  Smile,
  Paperclip,
  Camera,
  Send,
  Check,
  CheckCheck,
} from "lucide-react-native";

// Requires: npm install lucide-react-native react-native-svg
// Route suggestion: app/chat/[id].tsx (a stack screen outside the (tabs) group)

const CONTACT = {
  name: "Rahul Sharma",
  status: "Online",
  avatar: "https://i.pravatar.cc/150?img=12",
};

// ---- Mock messages ---------------------------------------------------
const MESSAGES = [
  { id: "date-1", type: "date", label: "Today" },
  {
    id: "1",
    type: "text",
    sender: "other",
    text: "Hey! Are we still meeting today?",
    time: "10:30 AM",
  },
  {
    id: "2",
    type: "text",
    sender: "me",
    text: "Yes, absolutely! 6 PM at the cafe.",
    time: "10:31 AM",
    read: true,
  },
  {
    id: "3",
    type: "text",
    sender: "other",
    text: "Perfect! I'll be there.",
    time: "10:31 AM",
  },
  {
    id: "4",
    type: "text",
    sender: "me",
    text: "Great! I'm looking forward to it 😊",
    time: "10:32 AM",
    read: true,
  },
  {
    id: "5",
    type: "text",
    sender: "other",
    text: "Me too! By the way, check out this photo I took yesterday.",
    time: "10:33 AM",
  },
  {
    id: "6",
    type: "image",
    sender: "other",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    time: "10:33 AM",
  },
  {
    id: "7",
    type: "text",
    sender: "me",
    text: "Wow! That's beautiful 😍",
    time: "10:34 AM",
    read: true,
  },
  {
    id: "8",
    type: "voice",
    sender: "other",
    duration: "0:12",
    time: "10:35 AM",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: "9",
    type: "text",
    sender: "me",
    text: "Nice voice note! 😀",
    time: "10:36 AM",
    read: true,
  },
];

// Fixed-height fake waveform bars for the voice note UI
const WAVEFORM_BARS = [
  6, 14, 9, 20, 12, 24, 10, 18, 8, 22, 14, 10, 16, 9, 20, 12, 8, 15, 10, 18, 7,
  13, 9, 16, 11,
];

// ---- Sub-components ------------------------------------------------------
function DateSeparator({ label }) {
  return (
    <View className="items-center my-4">
      <View className="bg-white border border-slate-200 rounded-full px-4 py-1.5">
        <Text className="text-sm text-slate-500">{label}</Text>
      </View>
    </View>
  );
}

function ReadReceipt({ read }) {
  return read ? (
    <CheckCheck size={15} color="#2563eb" />
  ) : (
    <Check size={15} color="#94a3b8" />
  );
}

function TextBubble({ message }) {
  const isMe = message.sender === "me";
  return (
    <View
      className={`max-w-[80%] mb-4 ${isMe ? "self-end" : "self-start"}`}
    >
      <View
        className={`rounded-3xl px-5 py-3 ${
          isMe
            ? "bg-blue-100 rounded-tr-md"
            : "bg-white rounded-tl-md border border-slate-100"
        }`}
      >
        <Text className="text-base text-slate-900">{message.text}</Text>
        <View className="flex-row items-center justify-end mt-1.5 gap-1">
          <Text className="text-xs text-slate-400">{message.time}</Text>
          {isMe && <ReadReceipt read={message.read} />}
        </View>
      </View>
    </View>
  );
}

function ImageBubble({ message }) {
  const isMe = message.sender === "me";
  return (
    <View
      className={`max-w-[80%] mb-4 flex-row items-center ${
        isMe ? "self-end justify-end" : "self-start"
      }`}
    >
      <View className="rounded-3xl overflow-hidden border border-slate-100">
        <Image
          source={{ uri: message.image }}
          className="w-64 h-44"
          resizeMode="cover"
        />
        <View className="absolute bottom-2 right-3">
          <Text className="text-xs text-white font-medium">
            {message.time}
          </Text>
        </View>
      </View>

      <Pressable className="w-9 h-9 rounded-full bg-white border border-slate-200 items-center justify-center ml-2 shadow-sm">
        <Share2 size={16} color="#2563eb" />
      </Pressable>
    </View>
  );
}

function VoiceBubble({ message }) {
  const isMe = message.sender === "me";
  return (
    <View className={`max-w-[85%] mb-4 ${isMe ? "self-end" : "self-start"}`}>
      <View
        className={`flex-row items-center rounded-3xl px-4 py-3 ${
          isMe ? "bg-blue-100" : "bg-white border border-slate-100"
        }`}
      >
        <Pressable className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3">
          <Play size={16} color="white" fill="white" />
        </Pressable>

        <View className="flex-1">
          <View className="flex-row items-end h-6">
            {WAVEFORM_BARS.map((h, i) => (
              <View
                key={i}
                style={{ height: h }}
                className="w-1 bg-blue-300 rounded-full mr-1"
              />
            ))}
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-xs text-slate-400">{message.duration}</Text>
            <Text className="text-xs text-slate-400">{message.time}</Text>
          </View>
        </View>

        <View className="relative ml-3">
          <Image
            source={{ uri: message.avatar }}
            className="w-9 h-9 rounded-full"
          />
          <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white items-center justify-center border border-slate-100">
            <Mic size={10} color="#2563eb" />
          </View>
        </View>
      </View>
    </View>
  );
}

function MessageItem({ item }) {
  switch (item.type) {
    case "date":
      return <DateSeparator label={item.label} />;
    case "image":
      return <ImageBubble message={item} />;
    case "voice":
      return <VoiceBubble message={item} />;
    default:
      return <TextBubble message={item} />;
  }
}

// ---- Screen ----------------------------------------------------------------
export default function ChatScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const hasDraft = draft.trim().length > 0;

  const renderItem = useCallback(({ item }) => <MessageItem item={item} />, []);
  const keyExtractor = useCallback((item) => item.id, []);

  const handleSend = () => {
    if (!hasDraft) return;
    // TODO: wire up your send-message logic here
    console.log("Send:", draft.trim());
    setDraft("");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-slate-100">
        <Pressable onPress={() => router.back()} className="mr-2 p-1">
          <ChevronLeft size={26} color="#0f172a" />
        </Pressable>

        <View className="relative">
          <Image
            source={{ uri: CONTACT.avatar }}
            className="w-11 h-11 rounded-full"
          />
          <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-slate-900">
            {CONTACT.name}
          </Text>
          <Text className="text-sm text-emerald-500">{CONTACT.status}</Text>
        </View>

        <View className="flex-row items-center gap-5">
          <Pressable>
            <Phone size={22} color="#334155" />
          </Pressable>
          <Pressable>
            <Video size={22} color="#334155" />
          </Pressable>
          <Pressable>
            <MoreVertical size={22} color="#334155" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Encrypted banner */}
        <View className="items-center py-3">
          <View className="flex-row items-center bg-white border border-slate-200 rounded-full px-4 py-2">
            <Lock size={14} color="#94a3b8" />
            <Text className="text-sm text-slate-500 ml-2">
              Messages and calls are end-to-end encrypted.{" "}
              <Text className="text-blue-600 font-medium">Learn more</Text>
            </Text>
          </View>
        </View>

        <FlatList
          data={MESSAGES}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        />

        {/* Input bar */}
        <View className="flex-row items-center px-4 py-3 bg-white border-t border-slate-100">
          <Pressable className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center mr-2">
            <Plus size={20} color="#334155" />
          </Pressable>

          <View className="flex-1 flex-row items-center bg-slate-100 rounded-full px-4 h-11">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              multiline
              className="flex-1 text-base text-slate-900"
            />
            <Pressable className="ml-2">
              <Smile size={20} color="#94a3b8" />
            </Pressable>
            <Pressable className="ml-3">
              <Paperclip size={20} color="#94a3b8" />
            </Pressable>
            <Pressable className="ml-3">
              <Camera size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <Pressable
            onPress={handleSend}
            className="w-11 h-11 rounded-full bg-blue-600 items-center justify-center ml-2"
          >
            {hasDraft ? (
              <Send size={18} color="white" />
            ) : (
              <Mic size={20} color="white" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}