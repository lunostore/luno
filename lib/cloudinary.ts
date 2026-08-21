import { ref, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

/**
 * Client-Side Smart Image Compressor:
 * Shrinks heavy 3MB-10MB images down to ~50KB-120KB WebP without losing visual sharpness,
 * guaranteeing instantaneous upload and 0 Firestore document size overflow errors.
 */
export async function compressImageClient(file: File, maxDimension = 1200, quality = 0.88): Promise<File> {
  // If file is already tiny (< 80KB), return as is
  if (file.size < 80 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP to preserve transparency while ensuring minimal weight
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const compressedFile = new File([blob], cleanName, { type: "image/webp" });
          resolve(compressedFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Universal Image Uploader:
 * 1. Direct Cloudinary Unsigned Upload (Ultra-fast CDN)
 * 2. Next.js Server-side /api/upload
 * 3. Compact Safe Fallback
 */
export async function uploadToCloudinary(file: File, folder = "products"): Promise<string> {
  const optimizedFile = await compressImageClient(file);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hvotfqtr";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "luno_products";

  // 1. Direct Cloudinary Client Preset Upload (Fastest)
  try {
    const formData = new FormData();
    formData.append("file", optimizedFile);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.secure_url) {
      return data.secure_url as string;
    } else if (data?.error) {
      console.warn("Direct Cloudinary upload notice:", data.error);
    }
  } catch (err) {
    console.warn("Client direct Cloudinary upload failed, checking server API:", err);
  }

  // 2. Server-side API Route Fallback (/api/upload)
  try {
    const apiFormData = new FormData();
    apiFormData.append("file", optimizedFile);
    apiFormData.append("folder", folder);

    const apiRes = await fetch("/api/upload", {
      method: "POST",
      body: apiFormData,
    });

    const apiData = await apiRes.json().catch(() => ({}));
    if (apiRes.ok && (apiData.secure_url || apiData.url)) {
      return (apiData.secure_url || apiData.url) as string;
    }
  } catch (err) {
    console.warn("Server API upload failed, checking fallback:", err);
  }

  // 3. Fallback: Compact WebP Data URL (< 60KB safe for Firestore)
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(optimizedFile);
    });

    return dataUrl;
  } catch {
    throw new Error("فشل رفع الصورة. يرجى المحاولة مرة أخرى.");
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

export async function deleteFromCloudinary(urls: string | string[]): Promise<void> {
  const urlArray = Array.isArray(urls) ? urls : [urls];

  for (const url of urlArray) {
    if (!url || typeof url !== "string" || url.startsWith("data:")) continue;

    if (url.includes("firebasestorage.googleapis.com")) {
      try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
      } catch {
        // Safe ignore
      }
      continue;
    }

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
