import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const routes = await prisma.rideRecordRoute.findMany({
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
        maxAvgSpeed: true,
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
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
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
      maxAvgSpeed,
      uphillDistance,
      downhillDistance,
      flatDistance,
      avgAltitude,
      maxAltitude,
      heatConsumption,
      userId,
      route,
    } = await req.json();

    const createdRoute = await prisma.rideRecordRoute.create({
      data: {
        startAddress,
        endAddress,
        startCoordinate,
        endCoordinate,
        distance,
        duration,
        elevation: elevation || null,
        avgSpeed: avgSpeed || null,
        maxAvgSpeed: maxAvgSpeed || null,
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
        maxAvgSpeed: true,
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
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Failed to create route" },
      { status: 500 }
    );
  }
}
