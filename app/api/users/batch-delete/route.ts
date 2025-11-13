import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function DELETE(req: Request) {
  const { ids } = await req.json();
  try {
    if (ids && Array.isArray(ids) && ids.length > 0) {
      // 先删除这些用户关联的骑行记录路线
      await prisma.rideRecordRoute.deleteMany({
        where: { userId: { in: ids } },
      });

      // 再删除这些用户关联的手动创建的路线
      await prisma.manualCreatedRoute.deleteMany({
        where: { userId: { in: ids } },
      });

      // 最后删除用户
      await prisma.user.deleteMany({
        where: { id: { in: ids } },
      });

      return NextResponse.json({ message: "users deleted successfully" });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting users:", error);
    return NextResponse.json(
      { error: 'Failed to delete users' },
      { status: 500 }
    );
  }
}
