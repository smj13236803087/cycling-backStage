import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const route = await prisma.userPublishRoute.findUnique({
      where: { id: params.id },
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
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json(
      { error: "Failed to fetch route" },
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
      startName,
      startCoord,
      endName,
      endCoord,
      distance,
      duration,
      heatConsumption,
    } = await req.json();

    const route = await prisma.userPublishRoute.update({
      where: { id: params.id },
      data: {
        startName,
        startCoord,
        endName,
        endCoord,
        distance,
        duration,
        heatConsumption: heatConsumption || null,
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

    return NextResponse.json(route);
  } catch (error) {
    console.error("Error updating route:", error);
    return NextResponse.json(
      { error: "Failed to update route" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.userPublishRoute.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Route deleted successfully" });
  } catch (error) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      { error: "Failed to delete route" },
      { status: 500 }
    );
  }
}

