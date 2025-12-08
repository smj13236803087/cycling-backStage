import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const route = await prisma.rideStatistics.findUnique({
      where: { id: params.id },
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
    });

    if (!route) {
      return NextResponse.json({ error: "Ride statistics not found" }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error("Error fetching ride statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch ride statistics" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
      uphillDistance,
      downhillDistance,
      flatDistance,
      avgAltitude,
      maxAltitude,
      heatConsumption,
      userId,
      route,
    } = await req.json();

    const updatedRoute = await prisma.rideStatistics.update({
      where: { id: params.id },
      data: {
        startAddress,
        endAddress,
        startCoordinate,
        endCoordinate,
        distance,
        duration,
        elevation: elevation || null,
        avgSpeed: avgSpeed || null,
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

    return NextResponse.json(updatedRoute);
  } catch (error) {
    console.error("Error updating ride statistics:", error);
    return NextResponse.json(
      { error: "Failed to update ride statistics" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.rideStatistics.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Ride statistics deleted successfully" });
  } catch (error) {
    console.error("Error deleting ride statistics:", error);
    return NextResponse.json(
      { error: "Failed to delete ride statistics" },
      { status: 500 }
    );
  }
}

