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

    // 检查关注关系
    const follow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow }, { status: 200 });
  } catch (err) {
    console.error("检查关注状态失败:", err);
    return NextResponse.json({ error: "检查关注状态失败" }, { status: 500 });
  }
}

