import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();
    const { userId } = data;
    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const manualRoutes = await prisma.manualCreatedRoute.findMany({
      where: { userId },
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
      },
    });
    return NextResponse.json({ manualRoutes });
  } catch (err) {
    console.error("获取手动创建路线失败:", err);
    return NextResponse.json({ error: "获取手动创建路线失败" }, { status: 500 });
  }
}
