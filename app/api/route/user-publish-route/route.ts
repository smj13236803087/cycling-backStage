import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const data = await req.json();
    const { userId, startName, startCoord, endName, endCoord, waypoints, distance, duration, encodedPolyline, mainRoute, waypointRoutes, heatConsumption, route, elevation, avgSpeed, uphillDistance, downhillDistance, flatDistance, avgAltitude, maxAltitude } = data;

    if (userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const routeData = await prisma.userPublishRoute.create({
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
        route: route ?? null,
        elevation: elevation ?? null,
        avgSpeed: avgSpeed ?? null,
        uphillDistance: uphillDistance ?? null,
        downhillDistance: downhillDistance ?? null,
        flatDistance: flatDistance ?? null,
        avgAltitude: avgAltitude ?? null,
        maxAltitude: maxAltitude ?? null,
      },
    });
    return NextResponse.json({ routeData });
  } catch (err) {
    console.error("保存用户发布路线失败:", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

