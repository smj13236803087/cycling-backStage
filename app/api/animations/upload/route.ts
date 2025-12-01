import { NextResponse } from "next/server";
import { uploadToR2, getCdnBaseUrl } from "@/app/lib/r2";

const ALLOWED_EXT = "gif";
const ALLOWED_MIME = "image/gif";
const SINGLE_ANIMATION_KEY = (userId: string) => `animations/${userId}/animation.${ALLOWED_EXT}`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const speedInput = formData.get("speed") as string | null;
    const file = formData.get("file") as File;

    if (!userId || !file) {
      return NextResponse.json({ error: "缺少 userId 或文件" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase() || ALLOWED_EXT;
    if (ext !== ALLOWED_EXT || (file.type && file.type !== ALLOWED_MIME)) {
      return NextResponse.json({ error: "请上传 .gif 动图文件" }, { status: 400 });
    }

    const speed = speedInput ? Number(speedInput) : 1;
    if (Number.isNaN(speed) || speed <= 0) {
      return NextResponse.json({ error: "speed 需要是大于 0 的数字" }, { status: 400 });
    }

    const key = SINGLE_ANIMATION_KEY(userId);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadToR2(buffer, key, ALLOWED_MIME, {
      speed: speed.toString(),
    });

    return NextResponse.json(
      {
        key,
        url: `${getCdnBaseUrl()}/${key}`,
        speed,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("上传动图失败:", err);
    return NextResponse.json({ error: err.message || "上传失败" }, { status: 500 });
  }
}


