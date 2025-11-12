import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const data = await req.json();
    const { userId, startName, startCoord, endName, endCoord, waypoints, distance, duration, encodedPolyline, mainRoute, waypointRoutes, heatConsumption, routeData } = data;

    if (userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const route = await prisma.manualCreatedRoute.create({
      data: {
        userId: userId,
        startName: startName,
        startCoord: startCoord,
        endName: endName,
        endCoord: endCoord,
        waypoints: waypoints,
        distance: parseFloat(distance),
        duration: duration,
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
