import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import prisma from "@/app/lib/prisma";

/**
 * 获取用户有效的Strava access token
 * 如果token过期或即将过期，会自动刷新
 * @param userId 用户ID（可选，如果不提供则从session获取）
 * @returns access token或null
 */
export async function getStravaAccessToken(userId?: string): Promise<string | null> {
  try {
    let targetUserId = userId;
    
    // 如果没有提供userId，从session获取
    if (!targetUserId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return null;
      }
      targetUserId = session.user.id;
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        stravaAccessToken: true,
        stravaRefreshToken: true,
        stravaTokenExpiresAt: true,
      },
    });

    if (!user?.stravaAccessToken || !user?.stravaRefreshToken) {
      return null;
    }

    // 检查token是否过期（提前5分钟刷新）
    const now = new Date();
    const expiresAt = user.stravaTokenExpiresAt;
    const shouldRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

    if (shouldRefresh) {
      // 刷新token
      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error("Strava配置缺失");
        return user.stravaAccessToken; // 返回旧token，虽然可能已过期
      }

      try {
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
          console.error("Strava token刷新失败");
          // 如果刷新失败，清除token
          await prisma.user.update({
            where: { id: targetUserId },
            data: {
              stravaAccessToken: null,
              stravaRefreshToken: null,
              stravaTokenExpiresAt: null,
            },
          });
          return null;
        }

        const tokenData = await tokenResponse.json();
        const { access_token, refresh_token, expires_at } = tokenData;

        if (!access_token || !refresh_token) {
          return null;
        }

        // 更新数据库
        const newExpiresAt = expires_at ? new Date(expires_at * 1000) : null;
        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            stravaAccessToken: access_token,
            stravaRefreshToken: refresh_token,
            stravaTokenExpiresAt: newExpiresAt,
          },
        });

        return access_token;
      } catch (error) {
        console.error("刷新Strava token时出错:", error);
        return user.stravaAccessToken; // 返回旧token
      }
    }

    return user.stravaAccessToken;
  } catch (error) {
    console.error("获取Strava access token失败:", error);
    return null;
  }
}

