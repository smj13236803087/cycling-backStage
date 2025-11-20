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

    // 验证：只能自己点赞
    if (userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 检查路线是否存在
    const route = await prisma.userPublishRoute.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json({ error: "路线不存在" }, { status: 404 });
    }

    // 检查是否已点赞
    const existingLike = await prisma.routeLike.findUnique({
      where: {
        userId_routeId: {
          userId: userId,
          routeId: routeId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: "已点赞该路线" }, { status: 400 });
    }

    // 创建点赞记录
    await prisma.routeLike.create({
      data: {
        userId: userId,
        routeId: routeId,
      },
    });

    return NextResponse.json({ message: "点赞成功" }, { status: 201 });
  } catch (err) {
    console.error("点赞路线失败:", err);
    return NextResponse.json({ error: "点赞路线失败" }, { status: 500 });
  }
}

