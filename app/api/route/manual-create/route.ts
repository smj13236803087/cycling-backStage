import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "";

export async function POST(req: Request) {
  try {
    // 1️⃣ 验证授权头
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "缺少授权头" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ 使用 jsonwebtoken 验证 token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "JWT 无效或已过期" }, { status: 403 });
    }

    // 3️⃣ 解析请求体
    const data = await req.json();
    const { userId, startName, startCoord, endName, endCoord, waypoints, distance, duration, encodedPolyline, mainRoute, waypointRoutes, heatConsumption, routeData } = data;

    // 可选：确保 userId 与 token 中 id 一致
    const userIdFromToken = decoded.id;
    if (userId !== userIdFromToken) {
      return NextResponse.json({ error: "用户ID与令牌不匹配" }, { status: 403 });
    }

    // 4️⃣ 写入数据库
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

    // 5️⃣ 返回成功响应
    return NextResponse.json({ route });
  } catch (err) {
    console.error("保存路线失败:", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
