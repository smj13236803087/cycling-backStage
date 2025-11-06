import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJwt } from "@/app/lib/jwt";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "缺少授权头" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const data = await req.json();
    const { userId } = data;
    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "JWT 无效" }, { status: 403 });
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
        route: true
      }
    });

    return NextResponse.json({ manualRoutes });
  } catch (err) {
    console.error("获取手动创建路线失败:", err);
    return NextResponse.json({ error: "获取手动创建路线失败" }, { status: 500 });
  }
}
