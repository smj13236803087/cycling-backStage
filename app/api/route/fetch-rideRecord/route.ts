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
    // if (userId !== user.id) {
    //   return NextResponse.json({ error: "无权操作" }, { status: 403 });
    // }
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
        maxAltitude: true,
        heatConsumption: true,
      },
    });

    return NextResponse.json({ rideRecordRoutes });
  } catch (err) {
    console.error("获取骑行记录失败:", err);
    return NextResponse.json({ error: "获取骑行记录失败" }, { status: 500 });
  }
}
