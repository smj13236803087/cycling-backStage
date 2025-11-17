import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "不合法的请求" }, { status: 400 });
    }

    const userPublishRoutes = await prisma.userPublishRoute.findMany({
      select: {
        id: true,
        createdTime: true,
        startName: true,
        startCoord: true,
        endName: true,
        endCoord: true,
        waypoints: true,
        distance: true,
        duration: true,
        encodedPolyline: true,
        mainRoute: true,
        waypointRoutes: true,
        heatConsumption: true,
        route: true,
      }
    });

    return NextResponse.json({ userPublishRoutes });
  } catch (err) {
    console.error("获取用户发布路线失败:", err);
    return NextResponse.json({ error: "获取用户发布路线失败" }, { status: 500 });
  }
}
