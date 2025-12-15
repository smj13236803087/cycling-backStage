import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth-helper";

// Force dynamic to allow use of request URL/session.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 创建 Strava Webhook 订阅
 * POST /api/strava/webhook/subscribe
 * 
 * 注意：这个端点需要管理员权限，或者你可以手动在 Strava 开发者后台创建
 * 
 * 参考文档：https://developers.strava.com/docs/webhooks/
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const callbackUrl =
      process.env.STRAVA_WEBHOOK_CALLBACK_URL ||
      `${request.nextUrl.origin}/api/strava/webhook`;
    const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || "your_verify_token";

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Strava配置缺失" },
        { status: 500 }
      );
    }

    // 创建 Webhook 订阅
    const response = await fetch("https://www.strava.com/api/v3/push_subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        callback_url: callbackUrl,
        verify_token: verifyToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("创建 Webhook 订阅失败:", errorData);
      return NextResponse.json(
        { error: "创建 Webhook 订阅失败", details: errorData },
        { status: response.status }
      );
    }

    const subscription = await response.json();
    console.log("✅ Webhook 订阅创建成功:", subscription);

    return NextResponse.json({
      success: true,
      subscription,
      message: "Webhook 订阅创建成功",
    });
  } catch (error) {
    console.error("创建 Webhook 订阅错误:", error);
    return NextResponse.json(
      { error: "创建 Webhook 订阅失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 获取所有 Webhook 订阅
 * GET /api/strava/webhook/subscribe
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Strava配置缺失" },
        { status: 500 }
      );
    }

    // 获取所有订阅
    const response = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions?client_id=${clientId}&client_secret=${clientSecret}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("获取 Webhook 订阅失败:", errorData);
      return NextResponse.json(
        { error: "获取 Webhook 订阅失败", details: errorData },
        { status: response.status }
      );
    }

    const subscriptions = await response.json();
    return NextResponse.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error("获取 Webhook 订阅错误:", error);
    return NextResponse.json(
      { error: "获取 Webhook 订阅失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 删除 Webhook 订阅
 * DELETE /api/strava/webhook/subscribe?id={subscription_id}
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get("id");

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "缺少 subscription_id 参数" },
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

    // 删除订阅
    const response = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}?client_id=${clientId}&client_secret=${clientSecret}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("删除 Webhook 订阅失败:", errorData);
      return NextResponse.json(
        { error: "删除 Webhook 订阅失败", details: errorData },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Webhook 订阅删除成功",
    });
  } catch (error) {
    console.error("删除 Webhook 订阅错误:", error);
    return NextResponse.json(
      { error: "删除 Webhook 订阅失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

