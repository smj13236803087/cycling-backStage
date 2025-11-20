import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const routes = await prisma.userPublishRoute.findMany({
      select: {
        id: true,
        startName: true,
        startCoord: true,
        endName: true,
        endCoord: true,
        distance: true,
        duration: true,
        heatConsumption: true,
        elevation: true,
        avgSpeed: true,
        uphillDistance: true,
        downhillDistance: true,
        flatDistance: true,
        avgAltitude: true,
        maxAltitude: true,
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
      startName,
      startCoord,
      endName,
      endCoord,
      distance,
      duration,
      heatConsumption,
      elevation,
      avgSpeed,
      uphillDistance,
      downhillDistance,
      flatDistance,
      avgAltitude,
      maxAltitude,
      userId,
    } = await req.json();

    const route = await prisma.userPublishRoute.create({
      data: {
        startName,
        startCoord,
        endName,
        endCoord,
        distance,
        duration,
        heatConsumption: heatConsumption || null,
        elevation: elevation || null,
        avgSpeed: avgSpeed || null,
        uphillDistance: uphillDistance || null,
        downhillDistance: downhillDistance || null,
        flatDistance: flatDistance || null,
        avgAltitude: avgAltitude || null,
        maxAltitude: maxAltitude || null,
        userId: userId,
      },
      select: {
        id: true,
        startName: true,
        startCoord: true,
        endName: true,
        endCoord: true,
        distance: true,
        duration: true,
        heatConsumption: true,
        elevation: true,
        avgSpeed: true,
        uphillDistance: true,
        downhillDistance: true,
        flatDistance: true,
        avgAltitude: true,
        maxAltitude: true,
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

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Failed to create route" },
      { status: 500 }
    );
  }
}

