import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import { logger } from "../utils/logger";

// Picker results live in a cache folder the OS may clear, so copy the photo
// into the app's document folder. If copying fails, keep the original path.
function persist(uri: string): string {
  try {
    const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
    const destination = new File(Paths.document, `medicine-${Date.now()}.${ext}`);
    new File(uri).copy(destination);
    return destination.uri;
  } catch (error) {
    logger.warn("Could not copy photo, using original path", error);
    return uri;
  }
}

/** Returns the saved photo path, or null if the user cancelled. */
export async function takePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Camera permission was denied. You can allow it in your phone settings.");
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return null;
  return persist(result.assets[0].uri);
}

export async function pickFromGallery(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return null;
  return persist(result.assets[0].uri);
}