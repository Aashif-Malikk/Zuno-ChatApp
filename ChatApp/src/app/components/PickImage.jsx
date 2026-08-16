import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { API_BASE } from "../../config/api";

const PickImage = (setSelectedImage) => {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return Alert.alert("image not selected");

    const imageUri = result.assets[0].uri;

    console.log("Selected image:", imageUri);
    setSelectedImage(imageUri)

  };

  pickImage();
};

export default PickImage;