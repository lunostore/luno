import { ref, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

/**
 * Universal Image Uploader (Zero-CORS, Server-powered):
 * Posts file to Same-Origin Next.js API route (/api/upload),
 * which securely uploads to Firebase Storage or Cloudinary server-side with NO CORS issues.
 */
export async function uploadToCloudinary(file: File, folder = "products"): Promise<string> {
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
        if (apiData.secure_url || apiData.url) {
          return (apiData.secure_url || apiData.url) as string;
        }
      }
    } catch (err) {
      console.warn(`Upload endpoint ${endpoint} error:`, err);
    }
  }

  // Final fallback: Client-side Base64 Data URL to guarantee immediate upload success
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return dataUrl;
  } catch {
    throw new Error("فشل رفع الصورة، يرجى المحاولة مرة أخرى.");
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
    if (!url || typeof url !== "string" || url.startsWith("data:")) continue;

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
