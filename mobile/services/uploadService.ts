import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfou7lxtg';
const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export async function uploadToCloudinary(
  fileUri: string,
  fileName: string = 'document.jpg',
  mimeTypeOverride?: string
): Promise<{ secure_url?: string; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    const cleanFileName = fileName || 'upload.jpg';
    const isPdf = cleanFileName.toLowerCase().endsWith('.pdf');
    const mimeType = mimeTypeOverride || (isPdf ? 'application/pdf' : 'image/jpeg');

    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: cleanFileName,
    } as any);

    formData.append('upload_preset', CLOUDINARY_PRESET);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.secure_url) {
      return {
        error: data.error?.message || 'Failed to upload document to Cloudinary',
      };
    }

    return { secure_url: data.secure_url, url: data.secure_url };
  } catch (err: any) {
    console.error('Cloudinary mobile upload error:', err);
    return {
      error: err.message || 'Network error during document upload',
    };
  }
}

export const uploadService = {
  uploadToCloudinary,

  async pickDocument(): Promise<{ uri: string; name: string; mimeType?: string } | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || undefined,
    };
  },

  async pickImage(): Promise<{ uri: string; name: string } | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName || 'camera_upload.jpg',
    };
  },

  async takePhoto(): Promise<{ uri: string; name: string } | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName || `photo_${Date.now()}.jpg`,
    };
  },
};
