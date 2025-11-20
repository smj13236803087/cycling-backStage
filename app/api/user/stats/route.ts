import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();
    const { userId } = data;

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 统计粉丝数：关注我的人（followingId = userId）
    const followersCount = await prisma.userFollow.count({
      where: {
        followingId: userId,
      },
    });

    // 统计关注数：我关注的人（followerId = userId）
    const followingCount = await prisma.userFollow.count({
      where: {
        followerId: userId,
      },
    });

    // 统计获赞数：该用户发布的所有路线收到的点赞总数
    // 1. 先获取该用户发布的所有路线ID
    const userRoutes = await prisma.userPublishRoute.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    const routeIds = userRoutes.map((route) => route.id);

    // 2. 统计这些路线收到的总点赞数
    const likesReceivedCount = await prisma.routeLike.count({
      where: {
        routeId: {
          in: routeIds,
        },
      },
    });

    return NextResponse.json({
      stats: {
        followersCount,
        followingCount,
        likesReceivedCount,
      },
    });
  } catch (err) {
    console.error("获取用户统计信息失败:", err);
    return NextResponse.json({ error: "获取用户统计信息失败" }, { status: 500 });
  }
}