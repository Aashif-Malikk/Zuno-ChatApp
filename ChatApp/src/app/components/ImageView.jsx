import { View, Image, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ImageView() {
    const { imageUri } = useLocalSearchParams();

    console.log("ImageUri:", imageUri);

    return (
        <View className="flex-1 bg-black items-center justify-center">
            {imageUri ? (
                <Image
                    source={{ uri: imageUri }}
                    style={{ width: 300, height: 300 }}
                    onLoad={() => console.log("IMAGE LOADED")}
                    onError={(e) => console.log("IMAGE ERROR:", e.nativeEvent)}
                />
            ) : (
                <Text className="text-white">No image found</Text>
            )}
        </View>
    );
}