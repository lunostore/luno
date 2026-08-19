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

    // Determine Python executable depending on platform (Windows uses 'py' or 'python', Linux/Mac uses 'python3' or 'python')
    const isWindows = process.platform === "win32";
    const pythonExecs = isWindows ? ["py", "python", "python3"] : ["python3", "python", "py"];

    let lastError: Error | null = null;
    let stdout = "";
    let stderr = "";
    let executed = false;

    const safeOrderId = orderId && typeof orderId === "string" ? orderId.replace(/[^a-zA-Z0-9_-]/g, "") : "";

    for (const pyBin of pythonExecs) {
      try {
        let cmd = `${pyBin} "${scriptPath}"`;
        if (safeOrderId) {
          cmd += ` --order "${safeOrderId}"`;
        }

        const res = await execPromise(cmd, {
          cwd: automationDir,
          timeout: 120000,
          env: { ...process.env },
        });

        stdout = res.stdout;
        stderr = res.stderr;
        executed = true;
        break;
      } catch (err: unknown) {
        lastError = err as Error;
        // If command not found, try next executable in loop
        if ((err as { message?: string }).message?.includes("command not found") || (err as { message?: string }).message?.includes("not recognized")) {
          continue;
        }
        // If script ran but threw another error, break loop
        break;
      }
    }

    if (!executed) {
      const errMsg = lastError?.message || "لم يتم العثور على بايثون في بيئة الاستضافة.";
      const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === "production";

      const friendlyMsg = isVercel
        ? "سيرفر Vercel لا يدعم تشغيل متصفح Playwright/Python مباشرة. يرجى تشغيل البوت محلياً (py main.py) أو أدخل رقم التتبع يدوياً."
        : `فشل تشغيل البوت: ${errMsg}`;

      return NextResponse.json(
        {
          success: false,
          error: friendlyMsg,
          output: lastError?.message || "",
        },
        { status: 500 }
      );
    }

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
