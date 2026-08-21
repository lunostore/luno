import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { adminStorage } from "@/lib/firebase/admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "لم يتم تقديم ملف للصورة" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hvotfqtr";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "luno_products";
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // ── 1. Cloudinary Signed SDK (if API keys exist in env) ──
    if (apiKey && apiSecret) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });

        const cldResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id });
              else reject(new Error("Empty Cloudinary upload result"));
            }
          );
          uploadStream.end(buffer);
        });

        if (cldResult?.secure_url) {
          return NextResponse.json({
            secure_url: cldResult.secure_url,
            url: cldResult.secure_url,
            public_id: cldResult.public_id,
            success: true,
          });
        }
      } catch (signedErr) {
        console.warn("Cloudinary signed upload failed:", signedErr);
      }
    }

    // ── 2. Cloudinary Unsigned Upload (Preset based: luno_products, ml_default) ──
    const presetsToTry = [uploadPreset, "luno_products", "ml_default"];
    for (const preset of presetsToTry) {
      try {
        const cldFormData = new FormData();
        cldFormData.append("file", file);
        cldFormData.append("upload_preset", preset);
        cldFormData.append("folder", folder);

        const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: cldFormData,
        });

        const cldData = await cldRes.json().catch(() => ({}));
        if (cldRes.ok && cldData?.secure_url) {
          return NextResponse.json({
            secure_url: cldData.secure_url,
            url: cldData.secure_url,
            public_id: cldData.public_id,
            success: true,
          });
        }
      } catch {
        // Safe continue to next fallback
      }
    }

    // ── 3. Firebase Admin Storage (if Firebase Admin is initialized) ──
    try {
      const rawExt = file.name.split(".").pop() || "png";
      const cleanExt = rawExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
      const safeFileName = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${cleanExt}`;
      const filePath = `${folder}/${safeFileName}`;
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "luno-629e0.firebasestorage.app";

      const bucket = adminStorage.bucket(bucketName);
      const fileRef = bucket.file(filePath);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type || "image/png",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

      return NextResponse.json({
        secure_url: downloadUrl,
        url: downloadUrl,
        public_id: filePath,
        success: true,
      });
    } catch {
      // Continue to high-compression fallback
    }

    // ── 4. Lightweight Safe Base64 Fallback (Optimized) ──
    const mimeType = file.type || "image/png";
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      secure_url: dataUrl,
      url: dataUrl,
      success: true,
      isBase64: true,
    });
  } catch (err: unknown) {
    console.error("Server upload fatal error:", err);
    const errorMessage = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
