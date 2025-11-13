import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
export async function DELETE(req: Request) {
  const { ids } = await req.json();
  try {
    if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { status: 'inactive' },
      });
      return NextResponse.json({ message: "users status update successfully" });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error update user status:", error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
