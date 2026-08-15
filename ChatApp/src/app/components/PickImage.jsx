import * as ImagePicker from "expo-image-picker";

const PickImage = (setSelectedImage) => {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;

      console.log("Selected image:", imageUri);
      setSelectedImage(imageUri);
    }
  };

  pickImage();
};

export default PickImage;