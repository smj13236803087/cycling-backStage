import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const routes = await prisma.rideStatistics.findMany({
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
    return NextResponse.json(routes);
  } catch (error) {
    console.error("Error fetching ride statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch ride statistics" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      startAddress,
      endAddress,
      startCoordinate,
      endCoordinate,
      distance,
      duration,
      elevation,
      avgSpeed,
      maxSpeed,
      uphillDistance,
      downhillDistance,
      flatDistance,
      avgAltitude,
      maxAltitude,
      heatConsumption,
      userId,
      route,
    } = await req.json();

    const createdRoute = await prisma.rideStatistics.create({
      data: {
        startAddress,
        endAddress,
        startCoordinate,
        endCoordinate,
        distance,
        duration,
        elevation: elevation || null,
        avgSpeed: avgSpeed || null,
        maxSpeed: maxSpeed || null,
        uphillDistance: uphillDistance || null,
        downhillDistance: downhillDistance || null,
        flatDistance: flatDistance || null,
        avgAltitude: avgAltitude || null,
        maxAltitude: maxAltitude || null,
        heatConsumption: heatConsumption || null,
        route: route || [],
        userId,
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

    return NextResponse.json(createdRoute, { status: 201 });
  } catch (error) {
    console.error("Error creating ride statistics:", error);
    return NextResponse.json(
      { error: "Failed to create ride statistics" },
      { status: 500 }
    );
  }
}

