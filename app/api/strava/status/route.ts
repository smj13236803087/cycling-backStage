import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import prisma from "@/app/lib/prisma";

/**
 * 获取用户Strava连接状态
 * GET /api/strava/status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stravaAccessToken: true,
        stravaRefreshToken: true,
        stravaTokenExpiresAt: true,
        stravaAthleteId: true,
      },
    });

    if (!user?.stravaAccessToken || !user?.stravaRefreshToken) {
      return NextResponse.json({
        connected: false,
        message: "未连接Strava账户",
      });
    }

    // 检查token是否过期
    const now = new Date();
    const expiresAt = user.stravaTokenExpiresAt;
    const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : false;
    const willExpireSoon = expiresAt
      ? expiresAt.getTime() - now.getTime() < 5 * 60 * 1000
      : false;

    return NextResponse.json({
      connected: true,
      athleteId: user.stravaAthleteId,
      expiresAt: expiresAt?.toISOString(),
      isExpired,
      willExpireSoon,
      message: isExpired
        ? "Token已过期，需要刷新"
        : willExpireSoon
        ? "Token即将过期"
        : "已连接Strava账户",
    });
  } catch (error) {
    console.error("获取Strava状态失败:", error);
    return NextResponse.json(
      { error: "获取状态失败" },
      { status: 500 }
    );
  }
}

