import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    const automationDir = path.join(process.cwd(), "automation");
    const scriptPath = path.join(automationDir, "main.py");

    // Build python command (uses 'py' launcher on Windows with fallback to 'python')
    let cmd = `py "${scriptPath}"`;
    if (orderId && typeof orderId === "string") {
      cmd += ` --order "${orderId.replace(/[^a-zA-Z0-9_-]/g, "")}"`;
    }

    // Execute script
    const { stdout, stderr } = await execPromise(cmd, {
      cwd: automationDir,
      timeout: 120000, // 2 minutes max
      env: { ...process.env },
    });

    const output = stdout || stderr;

    return NextResponse.json({
      success: true,
      message: orderId ? `تم تشغيل بوت الشحن للطلب #${orderId.slice(0, 8)}` : "تم تشغيل بوت الشحن لجميع الطلبات المؤكدة",
      output,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string; stderr?: string };
    console.error("Shipping Automation Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "حدث خطأ أثناء تشغيل بوت الشحن",
        output: (err.stdout || "") + "\n" + (err.stderr || ""),
      },
      { status: 500 }
    );
  }
}
