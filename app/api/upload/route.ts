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

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hvotfqtr";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "luno_products";

    // ── 1. Try Cloudinary Unsigned Upload (Preset based) ──
    try {
      const cldFormData = new FormData();
      cldFormData.append("file", file);
      cldFormData.append("upload_preset", uploadPreset);
      cldFormData.append("folder", folder);

      const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: cldFormData,
      });

      if (cldRes.ok) {
        const cldData = await cldRes.json();
        if (cldData.secure_url) {
          return NextResponse.json({
            secure_url: cldData.secure_url,
            url: cldData.secure_url,
            public_id: cldData.public_id,
            success: true,
          });
        }
      }
    } catch (cldErr) {
      console.warn("Cloudinary preset upload failed, checking signed config:", cldErr);
    }

    // ── 2. Try Cloudinary Signed SDK if API keys exist ──
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (apiKey && apiSecret) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });

        const cldResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id });
              else reject(new Error("Upload failed with empty result"));
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

    return NextResponse.json({ error: "Failed to upload image to storage provider", success: false }, { status: 500 });
  } catch (err: unknown) {
    console.error("Server upload API error:", err);
    const errorMessage = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
