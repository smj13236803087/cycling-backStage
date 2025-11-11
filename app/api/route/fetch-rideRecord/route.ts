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
    const { userId } = data;

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 可选：确保 userId 与 token 中 id 一致
    if (userId !== decoded.id) {
      return NextResponse.json({ error: "用户ID与令牌不匹配" }, { status: 403 });
    }

    // 4️⃣ 查询数据库
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
      },
    });

    // 5️⃣ 返回结果
    return NextResponse.json({ rideRecordRoutes });
  } catch (err) {
    console.error("获取骑行记录失败:", err);
    return NextResponse.json({ error: "获取骑行记录失败" }, { status: 500 });
  }
}
