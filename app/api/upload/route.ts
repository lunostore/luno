import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hvotfqtr";

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary server credentials not configured. Use client-side or Firebase Storage." },
        { status: 400 }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
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

    return NextResponse.json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (err: unknown) {
    console.warn("Cloudinary server upload error:", err);
    const errorMessage = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
