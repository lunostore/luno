import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hvotfqtr";

    if (!apiKey || !apiSecret) {
      // Gracefully skip server-side deletion without throwing an error to the client
      return NextResponse.json({
        success: true,
        message: "Skipped Cloudinary deletion: server credentials not configured in environment.",
      });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const { publicId, publicIds } = await req.json().catch(() => ({}));
    const idsToDelete: string[] = publicIds || (publicId ? [publicId] : []);

    if (idsToDelete.length === 0) {
      return NextResponse.json({ message: "No public IDs provided", success: true });
    }

    const results = await Promise.all(
      idsToDelete.map(async (id) => {
        try {
          const res = await cloudinary.uploader.destroy(id, { invalidate: true });
          if (res.result !== "ok") {
            const rawRes = await cloudinary.uploader.destroy(id, {
              resource_type: "raw",
              invalidate: true,
            });
            return { id, result: rawRes.result };
          }
          return { id, result: res.result };
        } catch (err) {
          return { id, result: "error", error: String(err) };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage, success: false }, { status: 200 });
  }
}
