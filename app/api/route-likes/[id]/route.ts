import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const like = await prisma.routeLike.findUnique({
      where: { id: params.id },
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

    if (!like) {
      return NextResponse.json({ error: "Like not found" }, { status: 404 });
    }

    return NextResponse.json(like);
  } catch (error) {
    console.error("Error fetching like:", error);
    return NextResponse.json(
      { error: "Failed to fetch like" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // 检查是否已存在其他相同的点赞记录
    const existingLike = await prisma.routeLike.findFirst({
      where: {
        userId: userId,
        routeId: routeId,
        id: { not: params.id },
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: "已存在相同的点赞记录" }, { status: 400 });
    }

    const like = await prisma.routeLike.update({
      where: { id: params.id },
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

    return NextResponse.json(like);
  } catch (error) {
    console.error("Error updating like:", error);
    return NextResponse.json(
      { error: "Failed to update like" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.routeLike.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Like deleted successfully" });
  } catch (error) {
    console.error("Error deleting like:", error);
    return NextResponse.json(
      { error: "Failed to delete like" },
      { status: 500 }
    );
  }
}

