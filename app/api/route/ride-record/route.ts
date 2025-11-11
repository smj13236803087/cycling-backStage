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

    // decoded 中通常包含 id, email 等信息
    const userIdFromToken = decoded.id;
    if (!userIdFromToken) {
      return NextResponse.json({ error: "JWT 中缺少用户信息" }, { status: 403 });
    }

    // 3️⃣ 解析请求体
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

    // 可选：确保 userId 与 token 中 id 一致
    if (userId !== userIdFromToken) {
      return NextResponse.json({ error: "用户ID与令牌不匹配" }, { status: 403 });
    }

    // 4️⃣ 写入数据库
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

    // 5️⃣ 返回成功响应
    return NextResponse.json({ rideRecord });
  } catch (err) {
    console.error("保存骑行路线失败:", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
