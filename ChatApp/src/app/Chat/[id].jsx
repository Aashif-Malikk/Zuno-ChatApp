import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
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
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_BASE } from "../../config/api";
import { io } from "socket.io-client";
import PickImage from "../components/PickImage";

// Requires: npm install lucide-react-native react-native-svg
// Route: app/chat/[id].tsx

// ---- Sub-components (unchanged) -------------------------------------------
function DateSeparator({ label }) {
  return (
    <View className="items-center my-4">
      <View className="bg-white border border-slate-200 rounded-full px-4 py-1.5">
        <Text className="text-sm text-slate-500">{label}</Text>
      </View>
    </View>
  );
}

function ReadReceipt({ status }) {
  return status === "seen" ? (
    <CheckCheck size={15} color="#2563eb" />
  ) : (
    <Check size={15} color="#94a3b8" />
  );
}

function TextBubble({ chat, myId }) {
  const isMe = chat.senderId === myId || chat.sender === "me";
  return (
    <View className={`max-w-[80%] mb-4 ${isMe ? "self-end" : "self-start"}`}>
      <View
        className={`rounded-3xl px-5 py-3 ${isMe
          ? "bg-blue-100 rounded-tr-md"
          : "bg-white rounded-tl-md border border-slate-100"
          }`}
      >
        <Text className="text-base text-slate-900">{chat.message}</Text>
        <View className="flex-row items-center justify-end mt-1.5 gap-1">
          <Text className="text-xs text-slate-400">{chat.time}</Text>
          {isMe && <ReadReceipt status={chat.status || "sent"} />}
        </View>
      </View>
    </View>
  );
}

function ImageBubble({ message, myId }) {
  const isMe = message.sender === "me" || message.senderId === myId;
  const [size, setSize] = useState({
    width: 250,
    height: 250,
  });

  useEffect(() => {
    Image.getSize(message.image, (width, height) => {
      const maxWidth = 260;
      const maxHeight = 350;

      const ratio = Math.min(
        maxWidth / width,
        maxHeight / height,
        1
      );

      setSize({
        width: width * ratio,
        height: height * ratio,
      });
    });
  }, [message.image]);
  return (
    <View
      className={`max-w-[80%] mb-4 flex-row items-center ${isMe ? "self-end justify-end" : "self-start"
        }`}
    >
      <View className="rounded-3xl overflow-hidden border border-slate-100">
        <Image
          source={{ uri: message.image }}
          style={{
            width: size.width,
            height: size.height,
            borderRadius: 16,
          }}
          resizeMode="cover"
        />
        <View className="absolute bottom-2 right-3">
          <Text className="text-xs text-white font-medium">
            {message.time}
          </Text>
        </View>
      </View>
    </View>
  );
}

function VoiceBubble({ message, myId }) {
  const isMe = message.sender === "me" || message.senderId === myId;
  return (
    <View className={`max-w-[85%] mb-4 ${isMe ? "self-end" : "self-start"}`}>
      <View
        className={`flex-row items-center rounded-3xl px-4 py-3 ${isMe ? "bg-blue-100" : "bg-white border border-slate-100"
          }`}
      >
        <Pressable className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3">
          <Play size={16} color="white" fill="white" />
        </Pressable>

        <View className="flex-1">
          <View className="flex-row items-end h-6">
            {(message.waveform || DEFAULT_WAVEFORM).map((h, i) => (
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

const DEFAULT_WAVEFORM = [
  6, 14, 9, 20, 12, 24, 10, 18, 8, 22, 14, 10, 16, 9, 20, 12, 8, 15, 10, 18, 7,
  13, 9, 16, 11,
];

function MessageItem({ myId, item }) {
  switch (item.type) {
    case "date":
      return <DateSeparator label={item.label} />;
    case "image":
      return <ImageBubble myId={myId} message={item} />;
    case "voice":
      return <VoiceBubble myId={myId} message={item} />;
    default:
      return <TextBubble myId={myId} chat={item} />;
  }
}

// Fetches: who the other person is, the message history, and my own user id
// (needed so we can tell "my messages" apart from "their messages" in the UI).
const fetchChatPersonAndHistory = async (friendId) => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      console.log("No token found");
      return;
    }

    const myProfile = await axios.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    const response = await axios.post(
      `${API_BASE}/chatPerson`,
      { receiverId: friendId, senderId: myProfile.data.user._id },
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }
    );

    return {
      contact: response.data.person,
      previousChats: response?.data?.previousChats || [],
      myId: myProfile.data.user._id,
    };
  } catch (error) {
    console.error("Error fetching chat person:", error);
  }
};

// ---- Screen ----------------------------------------------------------------
export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // The id of the PERSON YOU'RE CHATTING WITH (from the route), not a
  // conversation id and not your own id.
  const friendId = id ? JSON.parse(id) : null;

  const [draft, setDraft] = useState("");
  const [inputHeight, setInputHeight] = useState(42);
  const [contact, setContact] = useState({});
  const [isContactOnline, setIsContactOnline] = useState(false);
  const [selectedImage, setselectedImage] = useState(null)
  const [messages, setMessages] = useState([
    { id: "date-1", type: "date", label: "Today" },
  ]);
  const socketRef = useRef(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    }
  }, [messages]);

  // Your OWN logged-in user id — previously (confusingly) called `senderID`,
  // even though it never held a message sender's id, only your own.
  const [myId, setMyId] = useState("");

  const hasDraft = draft.trim().length > 0;

  // ---- Fetch contact info + message history -------------------------------
  useEffect(() => {
    if (!friendId) return;

    const load = async () => {
      const result = await fetchChatPersonAndHistory(friendId);
      if (result?.contact) {
        setContact(result.contact);
        setMessages((prev) => [...prev, ...(result.previousChats || [])]);
        setMyId(result.myId);
      }
    };
    load();
  }, [id]);

  const renderItem = useCallback(
    ({ item }) => <MessageItem item={item} myId={myId} />,
    [myId]
  );
  const keyExtractor = useCallback((item) => item._id ?? item.id, []);

  const handleSend = () => {
    if ((!hasDraft && !selectedImage) || !friendId) return;
    const outgoingMessage = {
      _id: `local-${Math.floor(Date.now() / 1000)}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "me",
      senderId: myId,
      status: "sent",
      image: "",
    };

    if (selectedImage) {
      outgoingMessage.type = "image";
      outgoingMessage.message = selectedImage;
      outgoingMessage.image = selectedImage;
    } else {
      outgoingMessage.type = "text";
      outgoingMessage.message = draft.trim();
    }

    setMessages((prev) => [...prev, outgoingMessage]);
    socketRef.current?.emit("message", {
      message: outgoingMessage.message || draft.trim(),
      image: outgoingMessage.image || "",
      receiverId: friendId,
      outgoingMessage,
    });

    setDraft("");
    setselectedImage("");
  };

  // ---- Socket: live messages, seen receipts, and presence -----------------
  useEffect(() => {
    if (!friendId || !myId) return; // wait until we actually know both ids

    let mounted = true;
    let socket;

    const setupSocket = async () => {
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      socket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"],
      });
      socketRef.current = socket;

      // FIX: fire on every successful connect (including reconnects), not
      // tied to the `messages` array changing. This is what actually marks
      // any messages that arrived while you were offline as "seen" the
      // moment you open this chat screen.
      socket.on("connect", () => {
        socket.emit("message:seen", {
          senderId: friendId, // messages sent BY the person you're chatting with
          receiverId: myId, // ...that YOU have now seen
        });
      });

      // A new message arrives while this chat screen is open.
      socket.on("receive-message", (data) => {
        if (!mounted) return;
        if (data.senderId !== friendId) return; // not this conversation — ignore

        // Real-time case: you're looking at the chat right now, so
        // immediately tell the server you've seen it.
        socket.emit("message:seen", {
          senderId: friendId,
          receiverId: myId,
        });

        const incomingMessage = {
          _id: data._id || `remote-${Date.now()}`,
          type: data.type || "text",
          message: data.message || data.text || "",
          image: data.image || (data.type === "image" ? data.message : ""),
          duration: data.duration,
          avatar: data.avatar,
          time:
            data.time ||
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          sender: "other",
          senderId: data.senderId,
          status: "seen", // you saw it the instant it arrived
        };
        setMessages((prev) => [...prev, incomingMessage]);
      });

      // The other person has just seen the messages YOU sent them.
      // FIX: was comparing `msg.senderId === data.receiverId`, but outgoing
      // messages never had a `senderId` set, so this never matched anything.
      // Now that handleSend() tags outgoing messages with `senderId: myId`,
      // and we only update messages that belong to THIS open conversation.
      socket.on("message:marked-seen", (data) => {
        if (!mounted) return;
        if (data.receiverId !== friendId) return; // seen-event for a different chat

        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === "me" ? { ...msg, status: "seen" } : msg
          )
        );
      });

      socket.on("onlineUsers:init", (ids) => {
        if (mounted) setIsContactOnline(ids.includes(friendId));
      });

      socket.on("user:online", ({ userId }) => {
        if (mounted && userId === friendId) setIsContactOnline(true);
      });

      socket.on("user:offline", ({ userId }) => {
        if (mounted && userId === friendId) setIsContactOnline(false);
      });

      socket.on("connect_error", (err) => {
        console.log("Socket connection failed:", err.message);
      });
    };

    setupSocket();

    return () => {
      mounted = false;
      socket?.off("connect");
      socket?.off("receive-message");
      socket?.off("message:marked-seen");
      socket?.disconnect();
    };
  }, [friendId, myId]);

  useEffect(() => {
    if (selectedImage) {
      handleSend()
    }
  }, [selectedImage])

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-slate-100">
        <Pressable onPress={() => router.back()} className="mr-2 p-1">
          <ChevronLeft size={26} color="#0f172a" />
        </Pressable>

        <View className="relative">
          <Image
            source={{ uri: contact.avatar }}
            className="w-11 h-11 rounded-full"
          />
          {isContactOnline && (
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          )}
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-slate-900">
            {contact.name}
          </Text>
          <Text
            className={`text-sm ${isContactOnline ? "text-emerald-500" : "text-slate-400"
              }`}
          >
            {isContactOnline ? "Online" : "Offline"}
          </Text>
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 10}
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
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 8,
          }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({
              animated: true,
            });
          }}
        />

        {/* Input bar */}
        <View className="flex-row items-end px-4 py-3 bg-white border-t border-slate-100">
          <Pressable className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center mr-2">
            <Plus size={20} color="#334155" />
          </Pressable>

          <View
            style={{ height: inputHeight }}
            className="flex-1 flex-row items-end bg-slate-100 rounded-md px-4"
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              multiline
              onContentSizeChange={(event) => {
                const height = event.nativeEvent.contentSize.height;
                setInputHeight(Math.min(Math.max(42, height), 120));
              }}
              style={{ height: inputHeight, textAlignVertical: "top" }}
              className="flex-1 text-base text-slate-900"
            />
            <Pressable className="ml-2 mb-3">
              <Smile size={20} color="#94a3b8" />
            </Pressable>
            <Pressable className="ml-3 mb-3">
              <Paperclip size={20} color="#94a3b8" />
            </Pressable>
            <Pressable onPress={() => PickImage(setselectedImage)} className="ml-3 mb-3">
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