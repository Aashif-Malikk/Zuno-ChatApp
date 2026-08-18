import { View, Text, Pressable, FlatList, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BellOff, Briefcase, ImageIcon, Pin, SlidersHorizontal, Users } from 'lucide-react-native';

const CHATS = [
  {
    id: "1",
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
    id: "2",
    name: "Work Group",
    message: "You: Presentation tomorrow at 11 AM",
    time: "Yesterday",
    isGroup: true,
    groupIcon: "briefcase",
    isMuted: true,
    unreadCount: 0,
  },
  {
    id: "3",
    name: "Work Group",
    message: "You: Presentation tomorrow at 11 AM",
    time: "Yesterday",
    isGroup: true,
    groupIcon: "briefcase",
    isMuted: true,
    unreadCount: 0,
  },
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
            {chat.message}
          </Text>
        )}
      </View>

      {/* Right column: time, badges, icons */}
      <View className="items-end">
        <Text className="text-sm text-slate-400 mb-2">{chat.time}</Text>

        {chat.unreadCount > 0 && (
          <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {chat.unreadCount}
            </Text>
          </View>
        )}

        {(chat.isPinned || chat.isMuted) && (
          <View className="flex-row items-center gap-3 mt-1">
            {chat.isPinned && <Pin size={18} color="#2563eb" />}
            {chat.isMuted && <BellOff size={18} color="#94a3b8" />}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const Groups = () => {
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <View className='flex-1 px-6'>
        <View className="flex-row items-center justify-between mt-2 mb-5">
          <Text className="text-3xl font-extrabold text-slate-900">Groups</Text>
        </View>

        {/* <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-slate-900">
            All Groups
          </Text>
        </View>

        <FlatList
          data={CHATS}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ChatRow chat={item} isLast={index === CHATS.length - 1} />
          )}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Text className="text-base text-slate-400">
                No chats match your search.
              </Text>
            </View>
          }
        /> */}

        <View className='flex-1 justify-center content-center'>
            <Text className='font-semibold text-center text-slate-600'>This page has not been completed yet, but work is ongoing 😊.</Text>
        </View>
      </View>
      {/* <Text>Groups</Text> */}
    </SafeAreaView>
  )
}

export default Groups