import { NextResponse } from "next/server";
import { deleteFromR2 } from "@/app/lib/r2";

const ALLOWED_EXT = "gif";
const SINGLE_ANIMATION_KEY = (userId: string) => `animations/${userId}/animation.${ALLOWED_EXT}`;

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const key = SINGLE_ANIMATION_KEY(userId);

    await deleteFromR2(key);

    return NextResponse.json({ message: "动图删除成功", key }, { status: 200 });
  } catch (err: any) {
    console.error("删除动图失败:", err);
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}


