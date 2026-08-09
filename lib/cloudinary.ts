export async function uploadToCloudinary(file: File, folder = "products"): Promise<string> {
  // 1. Try secure Server-side API Upload routes (/api/upload & /api/admin/cloudinary/upload)
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
    } catch (err) {
      console.warn(`Server API Cloudinary upload (${endpoint}) failed:`, err);
    }
  }

  // 2. Client-side Direct Upload fallback with multiple preset attempts
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hvotfqtr";
  const presetsToTry = Array.from(
    new Set([
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "luno_products",
      "ml_default",
      "unsigned",
      "nxt_products",
    ])
  );

  let lastErrorText = "";
  for (const preset of presetsToTry) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url) {
          return data.secure_url as string;
        }
      } else {
        lastErrorText = await response.text();
      }
    } catch (err: unknown) {
      lastErrorText = err instanceof Error ? err.message : String(err);
    }
  }

  console.error("All Cloudinary upload attempts failed:", lastErrorText);
  throw new Error("Failed to upload image to Cloudinary. Please set CLOUDINARY_API_KEY or create Unsigned Upload Preset.");
}

export async function uploadMultipleToCloudinary(files: File[]): Promise<string[]> {
  const uploads = files.map((file) => uploadToCloudinary(file));
  return Promise.all(uploads);
}

export function getCloudinaryPublicId(url: string): string {
  // Extract public_id from Cloudinary URL
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return "";
  // Skip version if present (v1234567)
  const afterUpload = parts.slice(uploadIndex + 1);
  const withoutVersion = afterUpload[0]?.startsWith("v")
    ? afterUpload.slice(1)
    : afterUpload;
  const filename = withoutVersion.join("/");
  // Remove extension
  return filename.replace(/\.[^/.]+$/, "");
}

export async function deleteFromCloudinary(urls: string | string[]): Promise<void> {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  const publicIds = urlArray.map(getCloudinaryPublicId).filter(Boolean);

  if (publicIds.length === 0) return;

  try {
    await fetch("/api/admin/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicIds }),
    });
  } catch (err) {
    console.error("Failed to delete images from Cloudinary:", err);
  }
}
