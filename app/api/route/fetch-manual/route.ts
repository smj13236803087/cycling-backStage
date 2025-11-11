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

    // 2️⃣ 验证 token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "JWT 无效或已过期" }, { status: 403 });
    }

    // 3️⃣ 解析请求体
    const data = await req.json();
    const { userId } = data;
    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 可选：确保 userId 与 token 中 id 一致
    if (userId !== decoded.id) {
      return NextResponse.json({ error: "用户ID与令牌不匹配" }, { status: 403 });
    }

    // 4️⃣ 查询数据库
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

    // 5️⃣ 返回结果
    return NextResponse.json({ manualRoutes });
  } catch (err) {
    console.error("获取手动创建路线失败:", err);
    return NextResponse.json({ error: "获取手动创建路线失败" }, { status: 500 });
  }
}
