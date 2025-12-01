import { NextResponse } from "next/server";
import { deleteFromR2, buildUserSlotKey } from "@/app/lib/r2";

// 接受前端 userId + slotIndex，删除指定图片
export async function POST(req: Request) {
  try {
    const { userId, slotIndex } = await req.json();

    if (!userId || !slotIndex) {
      return NextResponse.json({ error: "缺少 userId 或 slotIndex 参数" }, { status: 400 });
    }

    const key = buildUserSlotKey(userId, slotIndex);

    await deleteFromR2(key);

    return NextResponse.json({ message: "图片删除成功" }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}


