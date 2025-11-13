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
    let whereCondition: Prisma.RideRecordRouteWhereInput = {};

    if (keyword && !type) {
      whereCondition = {
        OR: [
          { startAddress: { contains: keyword } },
          { endAddress: { contains: keyword } },
          { user: { displayName: { contains: keyword } } },
          { user: { email: { contains: keyword } } },
        ],
      };
    } else if (keyword && type) {
      if (type === "startAddress") {
        whereCondition = { startAddress: { contains: keyword } };
      } else if (type === "endAddress") {
        whereCondition = { endAddress: { contains: keyword } };
      } else if (type === "creator") {
        whereCondition = {
          OR: [
            { user: { displayName: { contains: keyword } } },
            { user: { email: { contains: keyword } } },
          ],
        };
      }
    }

    let orderByCondition:
      | Prisma.RideRecordRouteOrderByWithRelationInput
      | Prisma.RideRecordRouteOrderByWithRelationInput[] = [];

    if (sort) {
      const sortFields = sort.split(",");
      orderByCondition = sortFields.map((field) => {
        const [key, order] = field.split(":");
        return { [key]: order === "asc" ? "asc" : "desc" };
      });
    }

    const routes = await prisma.rideRecordRoute.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: whereCondition,
      select: {
        id: true,
        startAddress: true,
        endAddress: true,
        startCoordinate: true,
        endCoordinate: true,
        distance: true,
        duration: true,
        elevation: true,
        avgSpeed: true,
        uphillDistance: true,
        downhillDistance: true,
        flatDistance: true,
        avgAltitude: true,
        maxAltitude: true,
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

    const totalCount = await prisma.rideRecordRoute.count({
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
