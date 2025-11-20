import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

export async function POST(req: Request) {
  try {
    // 获取当前用户（需要认证）
    const currentUser = await requireAuth();
    if (!currentUser) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    // 验证 userId 是否匹配当前用户
    if (userId !== currentUser.id) {
      return NextResponse.json(
        { error: "无权访问" },
        { status: 403 }
      );
    }

    // 查询用户点赞的所有路线
    const likedRoutes = await prisma.routeLike.findMany({
      where: {
        userId: userId,
      },
      include: {
        route: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatar: true,
              },
            },
            likes: {
              select: {
                id: true,
                userId: true,
                routeId: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 转换为前端需要的格式
    const userPublishRoutes = likedRoutes.map((like) => {
      const route = like.route;

      // 格式化路线点（从 JSON 数组转换为坐标数组）
      const formatRoutePoints = (points: any) => {
        if (!points || !Array.isArray(points) || points.length === 0) return null;
        return points.map((p: any) => {
          // 如果已经是 {lat, lng} 格式
          if (p.lat !== undefined && p.lng !== undefined) {
            return { lat: p.lat, lng: p.lng };
          }
          // 如果是其他格式，尝试解析
          return null;
        }).filter((p: any) => p !== null);
      };

      return {
        id: route.id,
        createdTime: route.createdTime.toISOString(),
        startName: route.startName,
        startCoord: route.startCoord, // 已经是 "lat,lng" 字符串格式
        endName: route.endName,
        endCoord: route.endCoord, // 已经是 "lat,lng" 字符串格式
        waypoints: route.waypoints
          ? (Array.isArray(route.waypoints) 
              ? route.waypoints.map((wp: any) => ({ lat: wp.lat || wp[0], lng: wp.lng || wp[1] }))
              : null)
          : null,
        distance: route.distance,
        duration: route.duration,
        encodedPolyline: route.encodedPolyline,
        mainRoute: formatRoutePoints(route.mainRoute),
        waypointRoutes: route.waypointRoutes
          ? (Array.isArray(route.waypointRoutes)
              ? route.waypointRoutes.map((wpr: any) =>
                  Array.isArray(wpr)
                    ? wpr.map((p: any) => ({ lat: p.lat || p[0], lng: p.lng || p[1] }))
                    : []
                )
              : null)
          : null,
        heatConsumption: route.heatConsumption,
        route: formatRoutePoints(route.route),
        elevation: route.elevation,
        avgSpeed: route.avgSpeed,
        uphillDistance: route.uphillDistance,
        downhillDistance: route.downhillDistance,
        flatDistance: route.flatDistance,
        avgAltitude: route.avgAltitude,
        maxAltitude: route.maxAltitude,
        user: route.user
          ? {
              id: route.user.id,
              displayName: route.user.displayName,
              email: route.user.email,
              avatar: route.user.avatar,
            }
          : null,
        likes: route.likes.map((l) => ({
          id: l.id,
          userId: l.userId,
          routeId: l.routeId,
          createdAt: l.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({
      userPublishRoutes,
    });
  } catch (error: any) {
    console.error("获取点赞路线失败:", error);
    return NextResponse.json(
      { error: error.message || "获取点赞路线失败" },
      { status: 500 }
    );
  }
}

