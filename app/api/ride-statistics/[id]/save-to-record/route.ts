import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 先获取 rideStatistics 数据
    const rideStat = await prisma.rideStatistics.findUnique({
      where: { id: params.id },
    });

    if (!rideStat) {
      return NextResponse.json(
        { error: "Ride statistics not found" },
        { status: 404 }
      );
    }

    // 将数据保存到 RideRecordRoute
    const createdRecord = await prisma.rideRecordRoute.create({
      data: {
        startAddress: rideStat.startAddress,
        endAddress: rideStat.endAddress,
        startCoordinate: rideStat.startCoordinate,
        endCoordinate: rideStat.endCoordinate,
        distance: rideStat.distance,
        duration: rideStat.duration,
        elevation: rideStat.elevation,
        avgSpeed: rideStat.avgSpeed,
        maxSpeed: rideStat.maxSpeed,
        uphillDistance: rideStat.uphillDistance,
        downhillDistance: rideStat.downhillDistance,
        flatDistance: rideStat.flatDistance,
        avgAltitude: rideStat.avgAltitude,
        maxAltitude: rideStat.maxAltitude,
        heatConsumption: rideStat.heatConsumption,
        route: rideStat.route ?? [],
        userId: rideStat.userId,
      },
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
        maxSpeed: true,
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
    });

    return NextResponse.json(
      {
        message: "Ride statistics saved to record successfully",
        record: createdRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving ride statistics to record:", error);
    return NextResponse.json(
      { error: "Failed to save ride statistics to record" },
      { status: 500 }
    );
  }
}

