import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, routeId } = await req.json();

    if (!userId || !routeId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 检查路线是否存在
    const route = await prisma.userPublishRoute.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json({ error: "路线不存在" }, { status: 404 });
    }

    // 检查是否已点赞
    const existingLike = await prisma.routeLike.findUnique({
      where: {
        userId_routeId: {
          userId: userId,
          routeId: routeId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: "已点赞该路线" }, { status: 400 });
    }

    // 创建点赞记录
    const like = await prisma.routeLike.create({
      data: {
        userId: userId,
        routeId: routeId,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        route: {
          select: {
            id: true,
            startName: true,
            endName: true,
            distance: true,
            duration: true,
            createdTime: true,
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    console.error("Error creating like:", error);
    return NextResponse.json(
      { error: "Failed to create like" },
      { status: 500 }
    );
  }
}

