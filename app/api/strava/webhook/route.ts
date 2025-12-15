import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getStravaAccessToken } from "@/app/lib/strava";

// Force dynamic to allow use of request URL/session.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Strava Webhook 接收端点
 * 
 * Strava Webhook 验证流程：
 * 1. GET 请求：验证订阅（返回 challenge）
 * 2. POST 请求：接收事件通知
 * 
 * 事件类型：
 * - create: 活动创建
 * - update: 活动更新
 * - delete: 活动删除
 */
export async function GET(request: NextRequest) {
  try {
    // Strava Webhook 验证
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("[Strava Webhook] GET 验证请求:", { mode, token, challenge });

    // 验证 token（应该与你在 Strava 设置的一致）
    const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
    if (mode === "subscribe" && token === verifyToken) {
      console.log("[Strava Webhook] ✅ 验证成功");
      return NextResponse.json({
        "hub.challenge": challenge,
      });
    } else {
      console.log("[Strava Webhook] ❌ 验证失败");
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("[Strava Webhook] GET 验证错误:", error);
    return NextResponse.json(
      { error: "Verification error" },
      { status: 500 }
    );
  }
}

/**
 * 接收 Strava Webhook 事件
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Strava Webhook] POST 事件:", JSON.stringify(body, null, 2));

    const { object_type, object_id, aspect_type, updates, owner_id } = body;

    // 只处理活动（activity）相关事件
    if (object_type !== "activity") {
      console.log("[Strava Webhook] 忽略非活动事件:", object_type);
      return NextResponse.json({ received: true });
    }

    // 处理不同的事件类型
    switch (aspect_type) {
      case "create":
        await handleActivityCreate(object_id, owner_id);
        break;
      case "update":
        console.log("[Strava Webhook] 活动更新事件，暂不处理");
        // 可以在这里处理活动更新
        break;
      case "delete":
        console.log("[Strava Webhook] 活动删除事件，暂不处理");
        // 可以在这里处理活动删除
        break;
      default:
        console.log("[Strava Webhook] 未知事件类型:", aspect_type);
    }

    // 立即返回 200，避免 Strava 重试
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Strava Webhook] POST 处理错误:", error);
    // 即使出错也要返回 200，避免 Strava 无限重试
    // 但可以在日志中记录错误，后续手动处理
    return NextResponse.json({ received: true });
  }
}

/**
 * 处理活动创建事件
 */
async function handleActivityCreate(activityId: number, athleteId: number) {
  try {
    console.log(
      `[Strava Webhook] 处理活动创建: activityId=${activityId}, athleteId=${athleteId}`
    );

    // 根据 athleteId 查找用户
    const user = await prisma.user.findFirst({
      where: {
        stravaAthleteId: String(athleteId),
      },
    });

    if (!user) {
      console.log(
        `[Strava Webhook] 未找到对应的用户: athleteId=${athleteId}`
      );
      return;
    }

    // 检查是否已经存在该活动（避免重复同步）
    const existing = await prisma.rideStatistics.findFirst({
      where: {
        stravaActivityId: String(activityId),
        userId: user.id,
      },
    });

    if (existing) {
      console.log(
        `[Strava Webhook] 活动已存在，跳过同步: activityId=${activityId}`
      );
      return;
    }

    // 获取活动的 access token
    const accessToken = await getStravaAccessToken(user.id);
    if (!accessToken) {
      console.log(
        `[Strava Webhook] 无法获取 access token: userId=${user.id}`
      );
      return;
    }

    // 从 Strava API 获取活动详情
    const activityData = await fetchStravaActivity(accessToken, activityId);
    if (!activityData) {
      console.log(
        `[Strava Webhook] 无法获取活动详情: activityId=${activityId}`
      );
      return;
    }

    // 只处理骑行活动
    if (activityData.type !== "Ride" && activityData.sport_type !== "Ride") {
      console.log(
        `[Strava Webhook] 非骑行活动，跳过: type=${activityData.type}`
      );
      return;
    }

    // 转换为 RideStatistics 格式并保存
    await saveActivityToRideStatistics(activityData, user.id, String(activityId));
  } catch (error) {
    console.error("[Strava Webhook] 处理活动创建错误:", error);
    throw error;
  }
}

/**
 * 从 Strava API 获取活动详情
 */
async function fetchStravaActivity(
  accessToken: string,
  activityId: number
): Promise<any | null> {
  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `[Strava API] 获取活动失败: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const activity = await response.json();
    return activity;
  } catch (error) {
    console.error("[Strava API] 获取活动详情错误:", error);
    return null;
  }
}

/**
 * 获取活动的详细流数据（GPS 轨迹点）
 */
async function fetchStravaActivityStreams(
  accessToken: string,
  activityId: number
): Promise<any | null> {
  try {
    // 请求需要的流类型：latlng（坐标）、altitude（海拔）、time（时间）
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng,altitude,time&key_by_type=true`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      // 404 通常表示活动没有 GPS 数据（例如手动创建的活动）
      if (response.status === 404) {
        console.log(
          `[Strava API] 活动没有 GPS 流数据（可能是手动创建的活动）: activityId=${activityId}`
        );
      } else {
        console.error(
          `[Strava API] 获取活动流数据失败: ${response.status} ${response.statusText}`
        );
      }
      return null;
    }

    const streams = await response.json();
    return streams;
  } catch (error) {
    console.error("[Strava API] 获取活动流数据错误:", error);
    return null;
  }
}

/**
 * 将 Strava 活动数据转换为 RideStatistics 并保存
 */
async function saveActivityToRideStatistics(
  activity: any,
  userId: string,
  stravaActivityId: string
) {
  try {
    // 获取活动的流数据（GPS 轨迹点）
    const accessToken = await getStravaAccessToken(userId);
    if (!accessToken) {
      throw new Error("无法获取 access token");
    }

    const streams = await fetchStravaActivityStreams(
      accessToken,
      activity.id
    );

    // 处理坐标和轨迹数据
    let route: Array<{ lat: number; lng: number; elevation?: number }> | null =
      null;
    let startCoordinate = "";
    let endCoordinate = "";
    let startAddress = "未知地点";
    let endAddress = "未知地点";

    // 如果有 GPS 流数据，处理完整轨迹
    if (streams?.latlng?.data) {
      console.log(
        `[Strava Webhook] 活动包含 GPS 轨迹数据，点数: ${streams.latlng.data.length}`
      );
      const latlngData = streams.latlng.data; // [[lat, lng], ...]
      const altitudeData = streams.altitude?.data || []; // [altitude, ...]
      const timeData = streams.time?.data || []; // [time, ...]

      route = latlngData.map((point: [number, number], index: number) => {
        const [lat, lng] = point;
        const elevation = altitudeData[index];
        return {
          lat,
          lng,
          ...(elevation !== undefined && { elevation }),
        };
      });

      // 设置起点和终点坐标
      if (route && route.length > 0) {
        const start = route[0];
        const end = route[route.length - 1];
        startCoordinate = `${start.lat},${start.lng}`;
        endCoordinate = `${end.lat},${end.lng}`;

        // 尝试从活动数据获取地址
        if (activity.start_latlng) {
          startCoordinate = `${activity.start_latlng[0]},${activity.start_latlng[1]}`;
        }
        if (activity.end_latlng) {
          endCoordinate = `${activity.end_latlng[0]},${activity.end_latlng[1]}`;
        }
      }
    } else if (activity.start_latlng) {
      // 如果没有流数据（手动创建的活动），使用活动详情中的起点和终点坐标
      // 这些坐标来自 Strava API 的 /activities/{id} 端点返回的 activity 对象
      // 对于手动创建的活动，可能是：
      // 1. 用户手动选择的位置
      // 2. 根据地址反地理编码得到的位置
      // 3. 如果用户没有输入位置，这些字段可能为 null
      console.log(
        `[Strava Webhook] 活动没有 GPS 轨迹，使用活动详情中的坐标:`,
        {
          start_latlng: activity.start_latlng,
          end_latlng: activity.end_latlng,
          start_address: activity.start_address,
          end_address: activity.end_address,
        }
      );
      startCoordinate = `${activity.start_latlng[0]},${activity.start_latlng[1]}`;
      if (activity.end_latlng) {
        endCoordinate = `${activity.end_latlng[0]},${activity.end_latlng[1]}`;
      } else {
        // 如果没有终点坐标，使用起点坐标
        endCoordinate = startCoordinate;
        console.log(
          `[Strava Webhook] 活动没有终点坐标，使用起点坐标作为终点`
        );
      }
    } else {
      // 如果连 start_latlng 都没有，说明活动完全没有位置信息
      // 这种情况下 startCoordinate 和 endCoordinate 会是空字符串
      console.log(
        `[Strava Webhook] 活动完全没有位置信息（start_latlng 为 null），将使用空字符串`
      );
      // startCoordinate 和 endCoordinate 保持为空字符串 ""
    }

    // 尝试获取地址信息（如果有）
    if (activity.start_address) {
      startAddress = activity.start_address;
    }
    if (activity.end_address) {
      endAddress = activity.end_address;
    }

    // 计算平均海拔和最大海拔
    let avgAltitude: number | null = null;
    let maxAltitude: number | null = null;
    if (streams?.altitude?.data && streams.altitude.data.length > 0) {
      const altitudes = streams.altitude.data;
      const sum = altitudes.reduce((a: number, b: number) => a + b, 0);
      avgAltitude = sum / altitudes.length;
      maxAltitude = Math.max(...altitudes);
    }

    // 创建 RideStatistics 记录
    const rideStatistics = await prisma.rideStatistics.create({
      data: {
        userId,
        stravaActivityId,
        startCoordinate,
        endCoordinate,
        startAddress,
        endAddress,
        createdTime: new Date(activity.start_date),
        distance: activity.distance || 0, // 米
        duration: activity.moving_time || activity.elapsed_time || 0, // 秒
        elevation: activity.total_elevation_gain || null, // 总爬升（米）
        avgSpeed: activity.average_speed || null, // 米/秒
        route: route || undefined,
        avgAltitude,
        maxAltitude,
        heatConsumption: activity.calories || null, // 卡路里
        // 注意：Strava API 可能不提供这些字段，设为 null
        uphillDistance: null,
        downhillDistance: null,
        flatDistance: null,
      },
    });

    console.log(
      `[Strava Webhook] ✅ 成功同步活动到 RideStatistics: id=${rideStatistics.id}, activityId=${stravaActivityId}`
    );

    return rideStatistics;
  } catch (error) {
    console.error(
      "[Strava Webhook] 保存活动到 RideStatistics 错误:",
      error
    );
    throw error;
  }
}

