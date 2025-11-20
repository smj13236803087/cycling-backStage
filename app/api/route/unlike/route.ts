import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();
    const { userId, routeId } = data;

    if (!userId || !routeId) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 验证：只能自己取消点赞
    if (userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 删除点赞记录
    await prisma.routeLike.deleteMany({
      where: {
        userId: userId,
        routeId: routeId,
      },
    });

    return NextResponse.json({ message: "取消点赞成功" }, { status: 200 });
  } catch (err) {
    console.error("取消点赞失败:", err);
    return NextResponse.json({ error: "取消点赞失败" }, { status: 500 });
  }
}

