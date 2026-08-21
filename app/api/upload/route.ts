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

    // ── 1. Try Cloudinary Signed SDK (If credentials exist) ──
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

    // ── 2. Try Cloudinary Unsigned Upload (Preset based) ──
    try {
      const cldFormData = new FormData();
      cldFormData.append("file", file);
      cldFormData.append("upload_preset", uploadPreset);
      cldFormData.append("folder", folder);

      const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: cldFormData,
      });

      const cldData = await cldRes.json();
      if (cldRes.ok && cldData?.secure_url) {
        return NextResponse.json({
          secure_url: cldData.secure_url,
          url: cldData.secure_url,
          public_id: cldData.public_id,
          success: true,
        });
      } else {
        console.warn("Cloudinary preset upload returned error:", cldData);
      }
    } catch (cldErr) {
      console.warn("Cloudinary preset upload network error:", cldErr);
    }

    // ── 3. Guaranteed Server-Side Firebase Admin Storage (Zero CORS) ──
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
    } catch (fbAdminErr) {
      console.error("Firebase Admin Storage upload failed:", fbAdminErr);
    }

    return NextResponse.json(
      {
        error: "فشل الرفع السحابي. يرجى التحقق من إعدادات Cloudinary أو Firebase Storage في Vercel.",
        success: false,
      },
      { status: 500 }
    );
  } catch (err: unknown) {
    console.error("Server upload API fatal error:", err);
    const errorMessage = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
