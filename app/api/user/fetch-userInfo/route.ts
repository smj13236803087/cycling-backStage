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
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
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

    return NextResponse.json({ userInfo });
  } catch (err) {
    console.error("获取用户信息失败:", err);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}
