import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "تم تعطيل الأتمتة البرمجية — نظام الشحن الآن يعتمد على الإدخال اليدوي لأرقام البوالص مباشرة من لوحة التحكم 📦",
  });
}
