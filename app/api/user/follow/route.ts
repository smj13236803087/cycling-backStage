import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();
    const { followerId, followingId } = data;

    if (!followerId || !followingId) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 验证：只能自己关注别人
    if (followerId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 不能关注自己
    if (followerId === followingId) {
      return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
    }

    // 检查是否已关注
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: "已关注该用户" }, { status: 400 });
    }

    // 创建关注关系
    await prisma.userFollow.create({
      data: {
        followerId: followerId,
        followingId: followingId,
      },
    });

    return NextResponse.json({ message: "关注成功" }, { status: 201 });
  } catch (err) {
    console.error("关注用户失败:", err);
    return NextResponse.json({ error: "关注用户失败" }, { status: 500 });
  }
}

