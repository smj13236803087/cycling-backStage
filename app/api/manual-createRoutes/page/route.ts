import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import dayjs from "dayjs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const keyword = url.searchParams.get("keyword") || "";
  const type = url.searchParams.get("type") || "";
  const sort = url.searchParams.get("sort") || "";

  try {
    // 从 Prisma Client 实例中推断类型，避免直接依赖 Prisma 命名空间里的具体类型名
    type ManualCreatedRouteWhereInput = NonNullable<
      Parameters<typeof prisma.manualCreatedRoute.findMany>[0]
    >["where"];
    type ManualCreatedRouteOrderByInput = NonNullable<
      Parameters<typeof prisma.manualCreatedRoute.findMany>[0]
    >["orderBy"];

    let whereCondition: ManualCreatedRouteWhereInput = {};

    if (keyword && !type) {
      whereCondition = {
        OR: [
          { startName: { contains: keyword } },
          { endName: { contains: keyword } },
          { user: { displayName: { contains: keyword } } },
          { user: { email: { contains: keyword } } },
        ],
      };
    } else if (keyword && type) {
      if (type === "startName") {
        whereCondition = { startName: { contains: keyword } };
      } else if (type === "endName") {
        whereCondition = { endName: { contains: keyword } };
      } else if (type === "creator") {
        whereCondition = {
          OR: [
            { user: { displayName: { contains: keyword } } },
            { user: { email: { contains: keyword } } },
          ],
        };
      }
    }

    let orderByCondition: ManualCreatedRouteOrderByInput = [];

    if (sort) {
      const sortFields = sort.split(",");
      orderByCondition = sortFields.map((field) => {
        const [key, order] = field.split(":");
        return { [key]: order === "asc" ? "asc" : "desc" };
      });
    }

    const routes = await prisma.manualCreatedRoute.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: whereCondition,
      select: {
        id: true,
        startName: true,
        startCoord: true,
        endName: true,
        endCoord: true,
        distance: true,
        duration: true,
        heatConsumption: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        createdTime: true,
      },
      orderBy: orderByCondition,
    });

    const totalCount = await prisma.manualCreatedRoute.count({
      where: whereCondition,
    });

    return NextResponse.json({ routes, totalCount });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}
