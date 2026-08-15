import { View, Text, Image } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router';

export default function ImageView() {
    const { imageUri } = useLocalSearchParams();

    console.log("Image:", imageUri);
    return (
        <View>
            <Text>ImageView</Text>
            {/* {imageUri &&
            } */}
            <Image
                source={{ uri: imageUri }}
                className="w-full h-96"
                resizeMode="contain"
            />
        </View>
    )
}