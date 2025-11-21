import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const follow = await prisma.userFollow.findUnique({
      where: { id: params.id },
      include: {
        follower: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true,
          },
        },
        following: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!follow) {
      return NextResponse.json({ error: "Follow not found" }, { status: 404 });
    }

    return NextResponse.json(follow);
  } catch (error) {
    console.error("Error fetching follow:", error);
    return NextResponse.json(
      { error: "Failed to fetch follow" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { followerId, followingId } = await req.json();

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 不能关注自己
    if (followerId === followingId) {
      return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
    }

    // 检查是否已存在其他相同的关注关系
    const existingFollow = await prisma.userFollow.findFirst({
      where: {
        followerId: followerId,
        followingId: followingId,
        id: { not: params.id },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: "已存在相同的关注关系" }, { status: 400 });
    }

    const follow = await prisma.userFollow.update({
      where: { id: params.id },
      data: {
        followerId: followerId,
        followingId: followingId,
      },
      include: {
        follower: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true,
          },
        },
        following: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(follow);
  } catch (error) {
    console.error("Error updating follow:", error);
    return NextResponse.json(
      { error: "Failed to update follow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.userFollow.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Follow deleted successfully" });
  } catch (error) {
    console.error("Error deleting follow:", error);
    return NextResponse.json(
      { error: "Failed to delete follow" },
      { status: 500 }
    );
  }
}

