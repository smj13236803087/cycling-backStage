import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import prisma from "@/app/lib/prisma";

/**
 * 刷新Strava access token
 * POST /api/strava/refresh-token
 */
export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      );
    }

    // 获取用户的refresh token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stravaRefreshToken: true,
        stravaAccessToken: true,
        stravaTokenExpiresAt: true,
      },
    });

    if (!user?.stravaRefreshToken) {
      return NextResponse.json(
        { error: "未找到Strava refresh token，请重新授权" },
        { status: 400 }
      );
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Strava配置缺失" },
        { status: 500 }
      );
    }

    // 调用Strava API刷新token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: user.stravaRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Strava token刷新失败:", errorData);
      
      // 如果refresh token也失效了，清除数据库中的token
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          stravaAccessToken: null,
          stravaRefreshToken: null,
          stravaTokenExpiresAt: null,
        },
      });

      return NextResponse.json(
        { error: "Token刷新失败，请重新授权", requiresReauth: true },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_at } = tokenData;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: "无效的token响应" },
        { status: 500 }
      );
    }

    // 更新数据库中的token
    const expiresAt = expires_at ? new Date(expires_at * 1000) : null;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stravaAccessToken: access_token,
        stravaRefreshToken: refresh_token,
        stravaTokenExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt?.toISOString(),
    });
  } catch (error) {
    console.error("刷新Strava token失败:", error);
    return NextResponse.json(
      { error: "刷新token失败" },
      { status: 500 }
    );
  }
}

/**
 * 获取当前有效的access token（如果过期则自动刷新）
 * GET /api/strava/refresh-token
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
      },
    });

    if (!user?.stravaAccessToken || !user?.stravaRefreshToken) {
      return NextResponse.json(
        { error: "未连接Strava账户", requiresAuth: true },
        { status: 400 }
      );
    }

    // 检查token是否过期（提前5分钟刷新）
    const now = new Date();
    const expiresAt = user.stravaTokenExpiresAt;
    const shouldRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

    if (shouldRefresh) {
      // 自动刷新token
      const refreshRequest = new Request(request.url, {
        method: "POST",
        headers: request.headers,
      });
      const refreshResponse = await POST(refreshRequest);
      
      if (!refreshResponse.ok) {
        return refreshResponse;
      }

      // 重新获取更新后的token
      const updatedUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          stravaAccessToken: true,
          stravaTokenExpiresAt: true,
        },
      });

      return NextResponse.json({
        accessToken: updatedUser?.stravaAccessToken,
        expiresAt: updatedUser?.stravaTokenExpiresAt?.toISOString(),
      });
    }

    return NextResponse.json({
      accessToken: user.stravaAccessToken,
      expiresAt: expiresAt?.toISOString(),
    });
  } catch (error) {
    console.error("获取Strava token失败:", error);
    return NextResponse.json(
      { error: "获取token失败" },
      { status: 500 }
    );
  }
}

