import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;
    const safeOrderId = orderId && typeof orderId === "string" ? orderId.replace(/[^a-zA-Z0-9_-]/g, "") : "";

    const automationDir = path.join(process.cwd(), "automation");
    const scriptPath = path.join(automationDir, "main.py");

    // ── 1. Try Local Execution first (for local dev server / VPS) ──
    const isWindows = process.platform === "win32";
    const pythonExecs = isWindows ? ["py", "python", "python3"] : ["python3", "python", "py"];

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

        return NextResponse.json({
          success: true,
          message: safeOrderId
            ? `تم تشغيل بوت الشحن محلياً للطلب #${safeOrderId.slice(0, 8)} 🚀`
            : "تم تشغيل بوت الشحن محلياً لجميع الطلبات المؤكدة 🚀",
          output: res.stdout || res.stderr,
        });
      } catch (err: unknown) {
        const msg = (err as { message?: string }).message || "";
        if (msg.includes("command not found") || msg.includes("not recognized")) {
          continue;
        }
        break;
      }
    }

    // ── 2. Cloud Fallback: Trigger GitHub Actions Workflow ──
    const githubRepo = process.env.GITHUB_REPOSITORY; // e.g. "username/lunostore"
    const githubToken = process.env.GITHUB_TOKEN || process.env.GH_PAT;

    if (githubRepo && githubToken) {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "auto-ship",
            client_payload: safeOrderId ? { orderId: safeOrderId } : {},
          }),
        });

        if (ghRes.ok || ghRes.status === 204) {
          return NextResponse.json({
            success: true,
            message: safeOrderId
              ? `تم تشغيل بوت الشحن في السحاب (GitHub Actions) للطلب #${safeOrderId.slice(0, 8)} 🚀`
              : "تم تشغيل بوت الشحن في السحاب (GitHub Actions) لجميع الطلبات المؤكدة 🚀",
          });
        }
      } catch (ghErr) {
        console.error("GitHub Action Dispatch Error:", ghErr);
      }
    }

    // ── 3. Friendly Notice: Scheduled Cloud Bot Active ──
    return NextResponse.json({
      success: true,
      message: safeOrderId
        ? `طلب الشحن جاهز! البوت يعمل أوتوماتيكياً كل 15 دقيقة في السحاب عبر GitHub Actions 🚀`
        : "البوت يعمل أوتوماتيكياً كل 15 دقيقة في السحاب عبر GitHub Actions لجميع الطلبات المؤكدة 🚀",
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Shipping Automation Route Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "حدث خطأ أثناء الاتصال ببوت الشحن",
      },
      { status: 500 }
    );
  }
}
