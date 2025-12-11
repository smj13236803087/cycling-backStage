import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth-helper";

// Ensure this route is always dynamic (relies on headers/session).
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 生成Strava OAuth授权URL
 * GET /api/strava/authorize
 */
export async function GET(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const user = await requireAuth();

    const clientId = process.env.STRAVA_CLIENT_ID;
    // Prefer explicit STRAVA_REDIRECT_URI, otherwise use current request origin.
    // Avoid BASE_URL to prevent sending users to stale domains.
    const redirectUri =
      process.env.STRAVA_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/strava/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: "Strava客户端ID未配置" },
        { status: 500 }
      );
    }

    // 生成state参数用于防止CSRF攻击
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
    
    // Strava OAuth授权URL
    const scope = "activity:read,activity:write"; // 读取和写入活动数据
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&approval_prompt=force`;

    return NextResponse.json({
      authUrl,
      state,
    });
  } catch (error) {
    console.error("生成Strava授权URL失败:", error);
    return NextResponse.json(
      { error: "生成授权URL失败" },
      { status: 500 }
    );
  }
}

