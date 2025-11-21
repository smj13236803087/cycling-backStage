import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function DELETE(req: Request) {
  const { ids } = await req.json();
  try {
    if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.routeLike.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({
        message: "Likes deleted successfully",
      });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting likes:", error);
    return NextResponse.json(
      { error: "Failed to delete likes" },
      { status: 500 }
    );
  }
}

