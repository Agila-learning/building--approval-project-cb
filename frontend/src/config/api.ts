export const getApiUrl = (): string => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

export const API_BASE_URL = getApiUrl();

/**
 * Uploads a file to Cloudinary.
 * First tries the authenticated backend endpoint (which uses the backend's CLOUDINARY_API_KEY & SECRET, requiring NO presets).
 * Falls back to direct upload only if the backend cannot be reached.
 */
export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const backendUrl = `${getApiUrl()}/documents/upload`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      const data = await response.json();
      if (data.secure_url || data.url) {
        return data.secure_url || data.url;
      }
    }
  } catch (err) {
    console.warn('Backend upload route failed, attempting direct Cloudinary fallback:', err);
  }

  // Fallback: direct Cloudinary upload
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'yy08owy2';
  const directForm = new FormData();
  directForm.append('file', file);
  directForm.append('upload_preset', 'ml_default');

  const directRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: directForm,
  });
  const directData = await directRes.json();
  if (directData.secure_url) {
    return directData.secure_url;
  }
  throw new Error(directData.error?.message || 'Failed to upload file');
};
