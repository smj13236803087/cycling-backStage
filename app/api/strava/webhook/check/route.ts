import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth-helper";
import prisma from "@/app/lib/prisma";

// Force dynamic to allow use of request URL/session.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 检查 Webhook 配置和用户连接状态
 * GET /api/strava/webhook/check
 * 
 * 用于验证：
 * 1. Webhook 订阅是否已创建
 * 2. 用户是否已连接 Strava 账户
 * 3. 环境变量是否配置正确
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    const checks = {
      webhookSubscription: {
        status: "unknown" as "ok" | "missing" | "error",
        message: "",
        details: null as any,
      },
      userConnection: {
        status: "unknown" as "ok" | "missing" | "error",
        message: "",
        athleteId: null as string | null,
      },
      environment: {
        status: "unknown" as "ok" | "missing",
        message: "",
        variables: {} as Record<string, boolean>,
      },
    };

    // 1. 检查环境变量
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
    const callbackUrl = process.env.STRAVA_WEBHOOK_CALLBACK_URL;

    checks.environment.variables = {
      STRAVA_CLIENT_ID: !!clientId,
      STRAVA_CLIENT_SECRET: !!clientSecret,
      STRAVA_WEBHOOK_VERIFY_TOKEN: !!verifyToken,
      STRAVA_WEBHOOK_CALLBACK_URL: !!callbackUrl,
    };

    const allEnvVarsSet =
      clientId && clientSecret && verifyToken && callbackUrl;

    if (allEnvVarsSet) {
      checks.environment.status = "ok";
      checks.environment.message = "所有环境变量已配置";
    } else {
      checks.environment.status = "missing";
      const missing = Object.entries(checks.environment.variables)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
      checks.environment.message = `缺少环境变量: ${missing.join(", ")}`;
    }

    // 2. 检查 Webhook 订阅
    if (clientId && clientSecret) {
      try {
        const response = await fetch(
          `https://www.strava.com/api/v3/push_subscriptions?client_id=${clientId}&client_secret=${clientSecret}`,
          {
            method: "GET",
          }
        );

        if (response.ok) {
          const subscriptions = await response.json();
          if (Array.isArray(subscriptions) && subscriptions.length > 0) {
            const activeSubscription = subscriptions.find(
              (sub: any) => sub.active !== false
            );
            if (activeSubscription) {
              checks.webhookSubscription.status = "ok";
              checks.webhookSubscription.message = "Webhook 订阅已创建并激活";
              checks.webhookSubscription.details = {
                id: activeSubscription.id,
                callback_url: activeSubscription.callback_url,
                created_at: activeSubscription.created_at,
                updated_at: activeSubscription.updated_at,
              };
            } else {
              checks.webhookSubscription.status = "missing";
              checks.webhookSubscription.message = "Webhook 订阅已创建但未激活";
            }
          } else {
            checks.webhookSubscription.status = "missing";
            checks.webhookSubscription.message = "未找到 Webhook 订阅，需要创建";
          }
        } else {
          checks.webhookSubscription.status = "error";
          const errorData = await response.text();
          checks.webhookSubscription.message = `获取订阅失败: ${response.status}`;
          checks.webhookSubscription.details = errorData;
        }
      } catch (error) {
        checks.webhookSubscription.status = "error";
        checks.webhookSubscription.message = `检查订阅时出错: ${error instanceof Error ? error.message : String(error)}`;
      }
    } else {
      checks.webhookSubscription.status = "error";
      checks.webhookSubscription.message = "无法检查订阅：缺少 Strava 配置";
    }

    // 3. 检查用户连接状态
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        stravaAccessToken: true,
        stravaRefreshToken: true,
        stravaAthleteId: true,
      },
    });

    if (user?.stravaAccessToken && user?.stravaRefreshToken) {
      if (user.stravaAthleteId) {
        checks.userConnection.status = "ok";
        checks.userConnection.message = "已连接 Strava 账户";
        checks.userConnection.athleteId = user.stravaAthleteId;
      } else {
        checks.userConnection.status = "missing";
        checks.userConnection.message = "已授权但缺少 athleteId，可能需要重新授权";
      }
    } else {
      checks.userConnection.status = "missing";
      checks.userConnection.message = "未连接 Strava 账户，请先授权";
    }

    // 总结
    const canReceiveWebhooks =
      checks.webhookSubscription.status === "ok" &&
      checks.userConnection.status === "ok" &&
      checks.environment.status === "ok";

    return NextResponse.json({
      canReceiveWebhooks,
      checks,
      summary: {
        message: canReceiveWebhooks
          ? "✅ 配置正确，可以接收 Webhook 通知"
          : "❌ 配置不完整，无法接收 Webhook 通知",
        nextSteps: canReceiveWebhooks
          ? [
              "在 Strava 网页或 App 中创建一次骑行活动",
              "查看服务器日志确认是否收到 Webhook 事件",
              "检查 RideStatistics 表是否有新记录",
            ]
          : [
              checks.webhookSubscription.status !== "ok" &&
                "1. 创建 Webhook 订阅（在 Strava 开发者后台或使用 /api/strava/webhook/subscribe）",
              checks.userConnection.status !== "ok" &&
                "2. 连接 Strava 账户（访问 /api/strava/authorize）",
              checks.environment.status !== "ok" &&
                "3. 配置环境变量（.env 文件）",
            ].filter(Boolean),
      },
    });
  } catch (error) {
    console.error("检查 Webhook 配置错误:", error);
    return NextResponse.json(
      {
        error: "检查失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

