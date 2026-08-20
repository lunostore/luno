import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── 1. Try Cloudinary if API keys exist ──
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (apiKey && apiSecret && cloudName) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });

        const cldResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: folder,
              resource_type: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id });
              else reject(new Error("Upload failed with empty result"));
            }
          );
          uploadStream.end(buffer);
        });

        if (cldResult?.secure_url) {
          return NextResponse.json({ secure_url: cldResult.secure_url, public_id: cldResult.public_id, success: true });
        }
      } catch (cldErr) {
        console.warn("Cloudinary server-side upload attempt failed, falling back to Firebase Storage:", cldErr);
      }
    }

    // ── 2. Primary / Guaranteed Fallback: Server-side Firebase Storage (Zero CORS) ──
    const rawExt = file.name.split(".").pop() || "jpg";
    const cleanExt = rawExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    const randomId = Math.random().toString(36).substring(2, 9);
    const safeFileName = `${Date.now()}_${randomId}.${cleanExt}`;
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "luno-629e0.firebasestorage.app";
    const filePath = `${folder}/${safeFileName}`;

    const fbUploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(filePath)}&uploadType=media`;

    const fbRes = await fetch(fbUploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: buffer,
    });

    if (fbRes.ok) {
      const fbData = await fbRes.json();
      const token = fbData.downloadTokens;
      const downloadUrl = token
        ? `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`
        : `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;

      return NextResponse.json({
        secure_url: downloadUrl,
        url: downloadUrl,
        public_id: filePath,
        success: true,
      });
    }

    // ── 3. Fallback: Base64 Data URL for standalone reliable display ──
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      secure_url: dataUrl,
      url: dataUrl,
      success: true,
    });
  } catch (err: unknown) {
    console.error("Server upload API error:", err);
    const errorMessage = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
