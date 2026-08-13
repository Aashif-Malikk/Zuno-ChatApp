import { StyleSheet, View, Text, Button, Alert, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react'
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: false,
        shouldShowAlert: true,
        shouldSetBadge: false,
    })
})
const Notification = () => {

    useEffect(() => {
        (async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission is not granted");
            }
        })();
    }, []);

    const triggerNotifications = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission denied");
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Hello",
                body: "Notification triggeres from button press"
            },
            trigger: null,
        });
    }

    return (
        <SafeAreaView>
            <View className='flex-1 content-center justify-center'>
                <Pressable onPress={triggerNotifications} className='p-2 bg-blue-400 text-black font-bold rounded-xl'>Click</Pressable>
            </View>
        </SafeAreaView>
    )
}

export default Notification