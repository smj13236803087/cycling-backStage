import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const keyword = url.searchParams.get("keyword") || "";
  const type = url.searchParams.get("type") || "";
  const sort = url.searchParams.get("sort") || "";

  try {
    let whereCondition: Prisma.RouteLikeWhereInput = {};

    if (keyword && !type) {
      whereCondition = {
        OR: [
          {
            user: {
              OR: [
                { displayName: { contains: keyword } },
                { email: { contains: keyword } },
              ],
            },
          },
          {
            route: {
              OR: [
                { startName: { contains: keyword } },
                { endName: { contains: keyword } },
                {
                  user: {
                    OR: [
                      { displayName: { contains: keyword } },
                      { email: { contains: keyword } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      };
    } else if (keyword && type) {
      if (type === "user") {
        whereCondition = {
          user: {
            OR: [
              { displayName: { contains: keyword } },
              { email: { contains: keyword } },
            ],
          },
        };
      } else if (type === "routeCreator") {
        whereCondition = {
          route: {
            user: {
              OR: [
                { displayName: { contains: keyword } },
                { email: { contains: keyword } },
              ],
            },
          },
        };
      } else if (type === "startName") {
        whereCondition = {
          route: {
            startName: { contains: keyword },
          },
        };
      } else if (type === "endName") {
        whereCondition = {
          route: {
            endName: { contains: keyword },
          },
        };
      }
    }

    let orderByCondition:
      | Prisma.RouteLikeOrderByWithRelationInput
      | Prisma.RouteLikeOrderByWithRelationInput[] = [];

    if (sort) {
      const sortFields = sort.split(",");
      orderByCondition = sortFields.map((field) => {
        const [key, order] = field.split(":");
        return { [key]: order === "asc" ? "asc" : "desc" };
      });
    } else {
      orderByCondition = { createdAt: "desc" };
    }

    const likedRoutes = await prisma.routeLike.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: whereCondition,
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
      orderBy: orderByCondition,
    });

    const totalCount = await prisma.routeLike.count({
      where: whereCondition,
    });

    return NextResponse.json({ likedRoutes, totalCount });
  } catch (error) {
    console.error("Error fetching liked routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch liked routes" },
      { status: 500 }
    );
  }
}

