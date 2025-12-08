import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function DELETE(req: Request) {
  const { ids } = await req.json();
  try {
    if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.rideStatistics.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({
        message: "Ride statistics deleted successfully",
      });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting ride statistics:", error);
    return NextResponse.json(
      { error: "Failed to delete ride statistics" },
      { status: 500 }
    );
  }
}

