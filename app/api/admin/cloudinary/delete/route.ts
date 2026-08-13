import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hvotfqtr",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error(
        "⚠️ Cloudinary Delete Warning: CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET missing in environment variables."
      );
      return NextResponse.json(
        {
          error: "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be configured in environment variables to allow image deletion.",
          success: false,
        },
        { status: 400 }
      );
    }

    const { publicId, publicIds } = await req.json();
    const idsToDelete: string[] = publicIds || (publicId ? [publicId] : []);

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { message: "No public IDs provided" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      idsToDelete.map(async (id) => {
        try {
          // 1. Attempt image destroy first
          const res = await cloudinary.uploader.destroy(id, { invalidate: true });
          if (res.result !== "ok") {
            // 2. Try raw resource type if image destroy was not ok
            const rawRes = await cloudinary.uploader.destroy(id, {
              resource_type: "raw",
              invalidate: true,
            });
            return { id, result: rawRes.result };
          }
          return { id, result: res.result };
        } catch (err) {
          console.error("Cloudinary destroy error for ID:", id, err);
          return { id, result: "error", error: String(err) };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    console.error("Cloudinary delete route error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
