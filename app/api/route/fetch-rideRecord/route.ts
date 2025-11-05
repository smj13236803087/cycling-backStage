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
      return NextResponse.json({ error: "JWT 无效" }, { status: 403 });
    }

    const data = await req.json();
    const { userId } = data;

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    const rideRecordRoutes = await prisma.rideRecordRoute.findMany({
      where: { userId },
      select: {
        id: true,
        createdTime: true,
        startCoordinate: true,
        endCoordinate: true,
        startAddress: true,
        endAddress: true,
        distance: true,
        duration: true,
        elevation: true,
        avgSpeed: true,
        route: true,
        uphillDistance: true,
        downhillDistance: true,
        flatDistance: true,
        avgAltitude: true,
        maxAltitude: true
      }
    });

    return NextResponse.json({ rideRecordRoutes });
  } catch (err) {
    console.error("获取骑行记录失败:", err);
    return NextResponse.json({ error: "获取骑行记录失败" }, { status: 500 });
  }
}
