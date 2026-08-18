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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Lock,
  Play,
  Mic,
  Plus,
  Smile,
  Paperclip,
  Camera,
  Send,
  Check,
  CheckCheck,
  Pause,
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_BASE } from "../../config/api";
import { io } from "socket.io-client";
import PickImage from "../components/PickImage";
import useVoiceRecorder from "../components/VoiceRecorder";
import useVoicePlayer from "../components/UseVoicePlayer";

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
  const [size, setSize] = useState({ width: 250, height: 250 });

  useEffect(() => {
    Image.getSize(message.image, (width, height) => {
      const maxWidth = 260;
      const maxHeight = 350;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      setSize({ width: width * ratio, height: height * ratio });
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
          style={{ width: size.width, height: size.height, borderRadius: 16 }}
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

  const {
    playVoice,
    pauseVoice,
    playing,
  } = useVoicePlayer(message.audio);

  return (
    <View className={`w-80 mb-4 ${isMe ? "self-end" : "self-start"}`}>
      <View
        className={`flex-row items-center rounded-3xl px-4 py-3 ${isMe
            ? "bg-blue-100"
            : "bg-white border border-slate-100"
          }`}
      >
        <Pressable
          onPress={playing ? pauseVoice : playVoice}
          className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3"
        >
          {playing ? (
            <Pause size={16} color="white" />
          ) : (
            <Play size={16} color="white" fill="white" />
          )}
        </Pressable>

        <View className="flex-1">
          <View className="flex-row items-end h-6">
            {(message.waveform || DEFAULT_WAVEFORM).map((h, i) => (
              <View
                key={i}
                style={{ height: h }}
                className="w-1 bg-blue-400 rounded-full mr-0.5"
              />
            ))}
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-xs text-slate-600 font-semibold">
              {message.duration ?? "0:00"}
            </Text>

            <Text className="text-xs text-slate-400">
              {message.time}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}


const DEFAULT_WAVEFORM = [
  6, 14, 9, 20, 12, 24, 10, 18, 8, 22,
  14, 10, 16, 9, 20, 12, 8, 15, 10, 18,
  7, 13, 9, 16, 11,
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

  const friendId = id ? JSON.parse(id) : null;

  const [draft, setDraft] = useState("");
  const [inputHeight, setInputHeight] = useState(42);
  const [contact, setContact] = useState({});
  const [isContactOnline, setIsContactOnline] = useState(false);
  const [selectedImage, setselectedImage] = useState(null);
  const { isRecording, toggleRecording } = useVoiceRecorder();
  const [messages, setMessages] = useState([
    { id: "date-1", type: "date", label: "Today" },
  ]);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const [myId, setMyId] = useState("");

  const hasDraft = draft.trim().length > 0;

  // -------------------- Voice Message ------------------//
  const handleMicPress = async () => {
    const result = await toggleRecording();

    console.log("result", result)

    if (!result?.success) {
      if (result?.error === "permission_denied") {
        Alert.alert(
          "Microphone access needed",
          "Enable microphone permission in settings to send voice messages."
        );
      } else {
        Alert.alert("Voice message failed", "Could not record audio.");
      }
      return;
    }

    // FIX: check isRecording FIRST. On the start branch there's no uri yet,
    // so checking for a uri before this was firing a false "no audio
    // produced" error on every single first press.
    if (result.isRecording) {
      return; // recording has started — nothing else to do yet
    }

    // We've stopped — now we should actually have a uri
    const localUri = result.uri;
    if (!localUri) {
      Alert.alert("Voice message failed", "No audio file was produced.");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("token");

      const formData = new FormData();

      formData.append("audio", {
        uri: result.uri,
        name: `recording-${Date.now()}.m4a`,
        type: "audio/m4a",
      });


      const response = await axios.post(
        `${API_BASE}/upload-audio`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // NOTE: do NOT set Content-Type here.
            // React Native sets it automatically with the correct
            // multipart boundary. Setting it manually removes the
            // boundary, which makes the server unable to parse the
            // body and causes a "Network Error".
          },
        }
      );

      console.log("Audio URL:", response.data.url);

      const uploadedUri = response.data.url;
      console.log(uploadedUri)
      const voiceMessage = {
        _id: `local-${Date.now()}`,
        type: "voice",
        sender: "me",
        senderId: myId,
        audio: uploadedUri,
        duration: result.duration,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
      };

      setMessages((prev) => [...prev, voiceMessage]);

      socketRef.current?.emit("message", {
        message: "",
        audioUrl: uploadedUri,
        type: voiceMessage.type,
        receiverId: friendId,
        voiceMessage,
      });
    } catch (error) {
      console.error(
        "Failed to send voice message:",
        error.response?.data || error.message
      );
      Alert.alert("Message not sent", "Couldn't send voice message. Please try again.");
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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

  const handleSend = async () => {
    if ((!hasDraft && !selectedImage) || !friendId) return;

    try {
      const token = await SecureStore.getItemAsync("token");
      let imageUrl = "";

      // 1. Upload image first
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", {
          uri: selectedImage,
          name: "chat-image.jpg",
          type: "image/jpeg",
        });

        const response = await axios.post(`${API_BASE}/upload-image`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            // NOTE: do NOT set Content-Type here — same reason as audio upload.
          },
        });

        imageUrl = response.data.url;
      }

      // 2. Create message
      const outgoingMessage = {
        _id: `local-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: "me",
        senderId: myId,
        receiverId: friendId,
        status: "sent",
        type: selectedImage ? "image" : "text",
        message: selectedImage ? "" : draft.trim(),
        image: imageUrl || selectedImage,
      };

      // 3. Show immediately in your own chat
      setMessages((prev) => [...prev, outgoingMessage]);

      // 4. Send ONLY the Cloudinary URL through Socket.IO
      socketRef.current?.emit("message", {
        message: outgoingMessage.message,
        image: imageUrl,
        type: outgoingMessage.type,
        receiverId: friendId,
        outgoingMessage,
      });

      setDraft("");
      setselectedImage("");
    } catch (error) {
      // FIX: this is what was missing — without a catch, a failed request
      // (like your 500) becomes an unhandled promise rejection instead of
      // a normal, recoverable error.
      console.error(
        "Failed to send message:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Message not sent",
        selectedImage
          ? "Couldn't upload that image. Please try again."
          : "Couldn't send your message. Please try again."
      );

      // Don't clear the draft/image on failure — let the user retry
      // instead of silently losing what they typed/picked.
    }
  };

  // ---- Socket: live messages, seen receipts, and presence -----------------
  useEffect(() => {
    if (!friendId || !myId) return;

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

      socket.on("connect", () => {
        socket.emit("message:seen", {
          senderId: friendId,
          receiverId: myId,
        });
      });

      socket.on("receive-message", (data) => {
        if (!mounted) return;
        if (data.senderId !== friendId) return;

        socket.emit("message:seen", {
          senderId: friendId,
          receiverId: myId,
        });

        const incomingMessage = {
          _id: data._id || `remote-${Date.now()}`,
          type: data.type || "text",
          message: data.message || data.text || "",
          image: data.image || (data.type === "image" ? data.message : ""),
          audio: data.audioUrl || (data.type === "voice" ? data.message : ""),
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
          status: "seen",
        };
        setMessages((prev) => [...prev, incomingMessage]);
      });

      socket.on("message:marked-seen", (data) => {
        if (!mounted) return;
        if (data.receiverId !== friendId) return;

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
      handleSend();
    }
  }, [selectedImage]);

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
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
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
            <Pressable
              onPress={() => PickImage(setselectedImage)}
              className="ml-3 mb-3"
            >
              <Camera size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <Pressable
            onPress={hasDraft ? handleSend : handleMicPress}
            className={`w-11 h-11 rounded-full items-center justify-center ml-2 ${isRecording ? "bg-red-500" : "bg-blue-600"
              }`}
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