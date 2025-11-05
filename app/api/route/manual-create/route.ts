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
    const decoded = verifyJwt(token);
    if (!decoded) {
        return NextResponse.json({ error: "无效的令牌" }, { status: 401 });
    }
    const data = await req.json();
    const { userId, startName, startCoord, endName, endCoord, waypoints, distance, duration, encodedPolyline, mainRoute, waypointRoutes, heatConsumption, routeData } = data;

    const route = await prisma.manualCreatedRoute.create({
      data: {
        userId: userId,
        startName: startName,
        startCoord: startCoord,
        endName: endName,
        endCoord: endCoord,
        waypoints: waypoints,
        distance: parseFloat(distance),
        duration: parseFloat(duration),
        encodedPolyline: encodedPolyline ?? null,
        mainRoute: mainRoute,
        waypointRoutes: waypointRoutes,
        heatConsumption: heatConsumption ?? null,
        route: routeData ?? null,
      },
    });

    return NextResponse.json({ route });
  } catch (err) {
    console.error("保存路线失败:", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
