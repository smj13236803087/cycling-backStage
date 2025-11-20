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

    // 验证：只能自己取消关注
    if (followerId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 删除关注关系
    await prisma.userFollow.deleteMany({
      where: {
        followerId: followerId,
        followingId: followingId,
      },
    });

    return NextResponse.json({ message: "取消关注成功" }, { status: 200 });
  } catch (err) {
    console.error("取消关注失败:", err);
    return NextResponse.json({ error: "取消关注失败" }, { status: 500 });
  }
}

