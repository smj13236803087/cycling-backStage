import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "";

export async function POST(req: Request) {
  try {
    // 1️⃣ 获取 Authorization 头
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "缺少授权头" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ 验证 JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "JWT 无效或已过期" }, { status: 403 });
    }

    // 3️⃣ 获取请求体
    const data = await req.json();
    const { userId } = data;
    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 4️⃣ 查询用户信息
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        email: true,
        avatar: true,
        gender: true,
        age: true,
        region: true,
        birthday: true,
        height: true,
        weight: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 5️⃣ 返回用户信息
    return NextResponse.json({ userInfo });
  } catch (err) {
    console.error("获取用户信息失败:", err);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}
