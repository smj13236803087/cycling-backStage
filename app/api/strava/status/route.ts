import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

// Force dynamic because session/headers are used.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 获取用户Strava连接状态
 * GET /api/strava/status
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
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

