import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import prisma from "@/app/lib/prisma";

/**
 * Strava OAuth回调处理
 * GET /api/strava/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // 检查是否有错误
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?strava_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard?strava_error=missing_params", request.url)
      );
    }

    // 解析state获取userId
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch (e) {
      return NextResponse.redirect(
        new URL("/dashboard?strava_error=invalid_state", request.url)
      );
    }

    // 验证用户身份（可选，但建议添加）
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.redirect(
        new URL("/dashboard?strava_error=unauthorized", request.url)
      );
    }

    // 使用code换取access token
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const redirectUri = process.env.STRAVA_REDIRECT_URI || `${request.nextUrl.origin}/api/strava/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/dashboard?strava_error=config_missing", request.url)
      );
    }

    // 调用Strava API换取token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Strava token交换失败:", errorData);
      return NextResponse.redirect(
        new URL("/dashboard?strava_error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_at,
      athlete,
    } = tokenData;

    if (!access_token || !refresh_token) {
      return NextResponse.redirect(
        new URL("/dashboard?strava_error=invalid_token_response", request.url)
      );
    }

    // 保存token到数据库
    const expiresAt = expires_at ? new Date(expires_at * 1000) : null;
    const athleteId = athlete?.id?.toString() || null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        stravaAccessToken: access_token,
        stravaRefreshToken: refresh_token,
        stravaTokenExpiresAt: expiresAt,
        stravaAthleteId: athleteId,
      },
    });

    // 重定向到成功页面
    return NextResponse.redirect(
      new URL("/dashboard?strava_success=true", request.url)
    );
  } catch (error) {
    console.error("Strava OAuth回调处理失败:", error);
    return NextResponse.redirect(
      new URL("/dashboard?strava_error=server_error", request.url)
    );
  }
}

