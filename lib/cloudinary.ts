import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

/**
 * Universal Image Uploader:
 * 1. Direct Cloudinary Unsigned Upload (Fastest, zero-latency)
 * 2. Next.js Server-side /api/upload
 * 3. Client-side Firebase Storage (Guaranteed fallback, hosted URL)
 */
export async function uploadToCloudinary(file: File, folder = "products"): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hvotfqtr";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "luno_products";

  // 1. Direct Client-side Cloudinary upload via unsigned preset
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url as string;
      }
    }
  } catch (err) {
    console.warn("Direct Cloudinary upload failed, trying server API:", err);
  }

  // 2. Server-side API endpoint (/api/upload)
  try {
    const apiFormData = new FormData();
    apiFormData.append("file", file);
    apiFormData.append("folder", folder);

    const apiRes = await fetch("/api/upload", {
      method: "POST",
      body: apiFormData,
    });

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData.secure_url || apiData.url) {
        return (apiData.secure_url || apiData.url) as string;
      }
    }
  } catch (err) {
    console.warn("Server API upload failed, trying Firebase storage fallback:", err);
  }

  // 3. Guaranteed Fallback: Client Firebase Storage SDK (Generates small hosted HTTPS URL)
  try {
    const rawExt = file.name.split(".").pop() || "jpg";
    const cleanExt = rawExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
    const storagePath = `${folder}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (fbErr) {
    console.error("Firebase Storage SDK upload failed:", fbErr);
    throw new Error("فشل رفع الصورة إلى السحابة، يرجى التحقق من اتصالك والمحاولة مرة أخرى.");
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
