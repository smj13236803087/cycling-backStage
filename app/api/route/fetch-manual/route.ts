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

    // 选择需要的字段
    const manualRoutes = await prisma.manualCreatedRoute.findMany({
      where: { userId },
      select: {
        id: true,
        createdTime: true, // 对应 `date` 字段
        startName: true,
        startCoord: true, // 如果是字符串类型，后端传回的就是原始经纬度字符串
        endName: true,
        endCoord: true, // 同上
        waypoints: true, // 这里是 JSON 格式，可以在前端解析
        distance: true, // 如果是字符串类型，这里可以直接返回
        duration: true, // 同上
        encodedPolyline: true,
        mainRoute: true, // 可以选择是否需要
        waypointRoutes: true, // 同上
        heatConsumption: true, // 根据需要返回
        route: true // 根据需要返回
      }
    });

    // 返回数据
    return NextResponse.json({ manualRoutes });
  } catch (err) {
    console.error("获取手动创建路线失败:", err);
    return NextResponse.json({ error: "获取手动创建路线失败" }, { status: 500 });
  }
}
