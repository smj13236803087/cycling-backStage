import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import prisma from "@/app/lib/prisma";

// Force dynamic to allow use of request URL/session.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Strava OAuth回调处理
 * GET /api/strava/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[Strava Callback] request URL:", request.url);

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("[Strava Callback] params", { code, state, error });

    // 检查是否有错误
    if (error) {
      return NextResponse.redirect(
        new URL(`/strava/auth-result?status=error&reason=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/strava/auth-result?status=error&reason=missing_params", request.url)
      );
    }

    // 解析state获取userId
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch (e) {
      return NextResponse.redirect(
        new URL("/strava/auth-result?status=error&reason=invalid_state", request.url)
      );
    }

    // 验证用户身份（可选）。某些移动端/外部浏览器可能未携带会话。
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("[Strava Callback] session missing, fallback to state userId", {
        userIdFromState: userId,
      });
      // 继续处理，但依赖 state 传递的 userId。若需要更高安全性，可改为签名 state。
    } else if (session.user.id !== userId) {
      console.warn("[Strava Callback] session user mismatch, proceed with state userId", {
        sessionUserId: session.user.id,
        stateUserId: userId,
      });
      // 不再中断，继续使用 state 中的 userId 以适配多端登录/外部浏览器。
    }

    // 使用code换取access token
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    // Keep in sync with /api/strava/authorize; avoid BASE_URL to prevent stale domain redirects.
    const redirectUri =
      process.env.STRAVA_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/strava/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/strava/auth-result?status=error&reason=config_missing", request.url)
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
        new URL("/strava/auth-result?status=error&reason=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    console.log("[Strava Callback] tokenData received");
    const {
      access_token,
      refresh_token,
      expires_at,
      athlete,
    } = tokenData;

    if (!access_token || !refresh_token) {
      return NextResponse.redirect(
        new URL("/strava/auth-result?status=error&reason=invalid_token_response", request.url)
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
      new URL("/strava/auth-result?status=success", request.url)
    );
  } catch (error) {
    console.error("Strava OAuth回调处理失败:", error);
    return NextResponse.redirect(
      new URL("/strava/auth-result?status=error&reason=server_error", request.url)
    );
  }
}

