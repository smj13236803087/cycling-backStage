import { NextResponse } from "next/server";
import { uploadToR2, buildUserSlotKey, getCdnBaseUrl } from "@/app/lib/r2";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const slotIndex = formData.get("slotIndex") as string; // 1~7
    const file = formData.get("file") as File;

    if (!userId || !slotIndex || !file) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const key = buildUserSlotKey(userId, slotIndex, ext);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadToR2(buffer, key, file.type);

    return NextResponse.json({
      url: `${getCdnBaseUrl()}/${key}`,
      key,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "上传失败" }, { status: 500 });
  }
}

