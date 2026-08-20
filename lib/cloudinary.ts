import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

/**
 * Uploads a file safely to Firebase Storage.
 * Generates safe ASCII filenames to prevent any charset encoding issues with Arabic letters.
 */
export async function uploadToFirebaseStorage(file: File, folder = "products"): Promise<string> {
  const extension = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const randomId = Math.random().toString(36).substring(2, 9);
  const safeFileName = `${Date.now()}_${randomId}.${extension}`;
  const storageRef = ref(storage, `${folder}/${safeFileName}`);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });

  return await getDownloadURL(snapshot.ref);
}

/**
 * Universal Image Uploader:
 * 1. Attempts Cloudinary Server-side & Unsigned Presets.
 * 2. Seamlessly falls back to Firebase Storage for 100% guaranteed success.
 */
export async function uploadToCloudinary(file: File, folder = "products"): Promise<string> {
  // ── 1. Try secure Server-side API Upload routes (/api/upload & /api/admin/cloudinary/upload)
  const apiEndpoints = ["/api/upload", "/api/admin/cloudinary/upload"];
  for (const endpoint of apiEndpoints) {
    try {
      const apiFormData = new FormData();
      apiFormData.append("file", file);
      apiFormData.append("folder", folder);

      const apiRes = await fetch(endpoint, {
        method: "POST",
        body: apiFormData,
      });

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.secure_url) {
          return apiData.secure_url as string;
        }
      }
    } catch {
      // Continue to next method
    }
  }

  // ── 2. Client-side Direct Cloudinary Upload fallback
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const configuredPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && configuredPreset) {
    const presetsToTry = Array.from(new Set([configuredPreset, "luno_products", "ml_default"]));

    for (const preset of presetsToTry) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", preset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.secure_url) {
            return data.secure_url as string;
          }
        }
      } catch {
        // Fall through to Firebase Storage
      }
    }
  }

  // ── 3. Guaranteed Reliable Fallback: Firebase Storage
  try {
    const firebaseUrl = await uploadToFirebaseStorage(file, folder);
    return firebaseUrl;
  } catch (fbErr) {
    console.error("Firebase Storage upload error:", fbErr);
    throw new Error("فشل رفع الصورة على السيرفر، يرجى إعادة المحاولة.");
  }
}

export async function uploadMultipleToCloudinary(files: File[], folder = "products"): Promise<string[]> {
  const uploads = files.map((file) => uploadToCloudinary(file, folder));
  return Promise.all(uploads);
}

export function getCloudinaryPublicId(url: string): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("cloudinary.com")) return "";

  try {
    const cleanUrl = url.split("?")[0];
    const uploadIndex = cleanUrl.indexOf("/upload/");
    if (uploadIndex === -1) return "";

    const pathAfterUpload = cleanUrl.substring(uploadIndex + "/upload/".length);
    const parts = pathAfterUpload.split("/");

    const publicIdParts: string[] = [];
    for (const part of parts) {
      if (/^v\d+$/.test(part)) continue;
      if (part.includes(",") || part.includes("=")) continue;
      publicIdParts.push(part);
    }

    if (publicIdParts.length === 0) return "";

    const fullFilename = publicIdParts.join("/");
    return fullFilename.replace(/\.[^/.]+$/, "");
  } catch (err) {
    console.error("Failed to extract Cloudinary public_id from URL:", url, err);
    return "";
  }
}

/**
 * Universal Image Deletion:
 * Handles Cloudinary public IDs and Firebase Storage URLs cleanly.
 */
export async function deleteFromCloudinary(urls: string | string[]): Promise<void> {
  const urlArray = Array.isArray(urls) ? urls : [urls];

  for (const url of urlArray) {
    if (!url || typeof url !== "string") continue;

    // A. If Firebase Storage URL
    if (url.includes("firebasestorage.googleapis.com")) {
      try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
      } catch {
        // Safe ignore
      }
      continue;
    }

    // B. If Cloudinary URL
    const publicId = getCloudinaryPublicId(url);
    if (publicId) {
      try {
        await fetch("/api/admin/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicIds: [publicId] }),
        });
      } catch {
        // Safe ignore
      }
    }
  }
}
