import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function DELETE(req: Request) {
  const { ids } = await req.json();
  try {
    if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.userFollow.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({
        message: "Follows deleted successfully",
      });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting follows:", error);
    return NextResponse.json(
      { error: "Failed to delete follows" },
      { status: 500 }
    );
  }
}

