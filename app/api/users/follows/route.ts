import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const keyword = url.searchParams.get("keyword") || "";
  const type = url.searchParams.get("type") || ""; // followerId 或 followingId
  const sort = url.searchParams.get("sort") || "";

  try {
    let whereCondition: Prisma.UserFollowWhereInput = {};

    if (keyword && !type) {
      whereCondition = {
        OR: [
          {
            follower: {
              OR: [
                { displayName: { contains: keyword } },
                { email: { contains: keyword } },
              ],
            },
          },
          {
            following: {
              OR: [
                { displayName: { contains: keyword } },
                { email: { contains: keyword } },
              ],
            },
          },
        ],
      };
    } else if (keyword && type) {
      if (type === "follower") {
        whereCondition = {
          follower: {
            OR: [
              { displayName: { contains: keyword } },
              { email: { contains: keyword } },
            ],
          },
        };
      } else if (type === "following") {
        whereCondition = {
          following: {
            OR: [
              { displayName: { contains: keyword } },
              { email: { contains: keyword } },
            ],
          },
        };
      }
    }

    let orderByCondition:
      | Prisma.UserFollowOrderByWithRelationInput
      | Prisma.UserFollowOrderByWithRelationInput[] = [];

    if (sort) {
      const sortFields = sort.split(",");
      orderByCondition = sortFields.map((field) => {
        const [key, order] = field.split(":");
        return { [key]: order === "asc" ? "asc" : "desc" };
      });
    } else {
      orderByCondition = { createdAt: "desc" };
    }

    const follows = await prisma.userFollow.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: whereCondition,
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
      orderBy: orderByCondition,
    });

    const totalCount = await prisma.userFollow.count({
      where: whereCondition,
    });

    return NextResponse.json({ follows, totalCount });
  } catch (error) {
    console.error("Error fetching follows:", error);
    return NextResponse.json(
      { error: "Failed to fetch follows" },
      { status: 500 }
    );
  }
}

