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
    const {
      userId,
      startAddress,
      endAddress,
      startCoordinate,
      endCoordinate,
      distance,
      duration,
      elevation,
      avgSpeed,
      route,          // [{lat, lng}, ...]
      uphillDistance,
      downhillDistance,
      flatDistance,
      avgAltitude,
      maxAltitude
    } = data;

    const rideRecord = await prisma.rideRecordRoute.create({
      data: {
        userId: userId,
        startAddress: startAddress || "未知起点",
        endAddress: endAddress || "未知终点",
        startCoordinate: startCoordinate, // 例如 "lat,lng"
        endCoordinate: endCoordinate,     // 例如 "lat,lng"
        distance: parseFloat(distance),   // 米
        duration: parseFloat(duration),   // 秒
        elevation: elevation ?? null,
        avgSpeed: avgSpeed ?? null,
        route: route ?? [],               // JSON 存储坐标数组
        uphillDistance: uphillDistance ?? null,
        downhillDistance: downhillDistance ?? null,
        flatDistance: flatDistance ?? null,
        avgAltitude: avgAltitude ?? null,
        maxAltitude: maxAltitude ?? null
      }
    });
    return NextResponse.json({ rideRecord });
  } catch (err) {
    console.error("保存骑行路线失败:", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
