export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that the uploaded file matches the expected category:
 * - CUSTOMER PHOTOGRAPH: Must be a portrait/passport person photo. Rejects ID cards (Aadhaar, PAN), deeds, drawings.
 * - CUSTOMER SIGNATURE: Must be a signature image. Rejects face photos, ID cards, full-page documents.
 * - Other documents: Must be image or PDF.
 */
export const validateUploadFile = async (
  file: File, 
  docType: string
): Promise<ImageValidationResult> => {
  const normType = docType.toUpperCase();
  const fileName = file.name.toLowerCase();

  // 1. Check file size limit (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size cannot exceed 10MB limit.' };
  }

  // 2. Format checks
  const isPhoto = normType.includes('PHOTOGRAPH') || normType.includes('PHOTO');
  const isSignature = normType.includes('SIGNATURE');

  if (isPhoto || isSignature) {
    if (!file.type.startsWith('image/')) {
      return { 
        valid: false, 
        error: `Invalid format! ${docType} must be an image file (JPG, PNG, WEBP), not a PDF or document.` 
      };
    }
  } else {
    const allowedDocTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedDocTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid format! ${docType} must be an image (JPG, PNG) or PDF document.` 
      };
    }
  }

  // 3. Keyword heuristic checks in filename
  const documentKeywords = [
    'aadhar', 'aadhaar', 'adhar', 'uidai', 'pan', 'pancard', 
    'deed', 'sale', 'patta', 'chitta', 'fmb', 'plan', 'layout', 
    'drawing', 'blueprint', 'tax', 'receipt', 'bill', 'idcard', 
    'id_card', 'voter', 'license', 'licence', 'certificate', 'marksheet'
  ];

  if (isPhoto) {
    const matchedDocWord = documentKeywords.find(kw => fileName.includes(kw));
    if (matchedDocWord) {
      return {
        valid: false,
        error: `Invalid Applicant Photo! It looks like you uploaded an ID card or document ("${matchedDocWord}"). Please upload a passport-size portrait photo of the applicant.`
      };
    }
  }

  if (isSignature) {
    const photoKeywords = ['photo', 'portrait', 'selfie', 'person', 'face', 'passport', 'aadhar', 'pan', 'deed', 'patta', 'fmb', 'plan'];
    const matchedPhotoWord = photoKeywords.find(kw => fileName.includes(kw));
    if (matchedPhotoWord) {
      return {
        valid: false,
        error: `Invalid Signature! It looks like you selected a photo or document ("${matchedPhotoWord}"). Please upload a photo of the applicant's signature on white paper.`
      };
    }
  }

  // 4. Aspect ratio and dimension verification via HTML Image
  if (isPhoto || isSignature) {
    try {
      const dimensions = await getImageDimensions(file);
      const ratio = dimensions.width / dimensions.height; // width / height

      if (isPhoto) {
        // Minimum resolution check
        if (dimensions.width < 120 || dimensions.height < 120) {
          return { valid: false, error: 'Photo resolution is too small. Please upload a clear photo of at least 150x150 pixels.' };
        }

        // An Aadhaar card or PAN card is landscape (width / height approx 1.58, or > 1.25).
        // A passport photo is portrait or square (ratio usually between 0.65 and 1.18).
        if (ratio > 1.25) {
          return {
            valid: false,
            error: `Invalid Photo! A landscape ID card or document format (${dimensions.width}x${dimensions.height}) was detected. Please upload a vertical/portrait passport-size photograph of the applicant.`
          };
        }
      }

      if (isSignature) {
        // A signature should not be a tall A4 portrait document (ratio < 0.55)
        if (ratio < 0.55) {
          return {
            valid: false,
            error: `Invalid Signature! A full-page portrait document was detected (${dimensions.width}x${dimensions.height}). Please crop and upload only the applicant's signature.`
          };
        }
      }
    } catch (e) {
      // If image loading fails, fail safely
      console.warn('Image dimension analysis failed:', e);
    }
  }

  return { valid: true };
};

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for validation'));
    };
    img.src = objectUrl;
  });
};
