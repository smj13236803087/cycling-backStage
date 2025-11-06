import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJwt } from "@/app/lib/jwt";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "缺少授权头" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "JWT 无效" }, { status: 403 });
    }

    const body = await req.json();
    console.log("Received body:", body);

    const { userId, ...rest } = body;
    if (!userId) {
      return NextResponse.json({ error: "缺少 userId 参数" }, { status: 400 });
    }

    const field = Object.keys(rest)[0];
    const value = rest[field];

    if (!field) {
      return NextResponse.json({ error: "缺少要更新的字段" }, { status: 400 });
    }

    const allowedFields = [
      "displayName",
      "gender",
      "region",
      "birthday",
      "height",
      "weight",
      "avatar",
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: `不允许修改字段: ${field}` }, { status: 400 });
    }

    let finalValue = value;
    if (field === "gender") {
      const genderMap: Record<string, "MALE" | "FEMALE" | "OTHER"> = {
        男: "MALE",
        女: "FEMALE",
        其他: "OTHER",
        OTHER: "OTHER",
        MALE: "MALE",
        FEMALE: "FEMALE",
      };

      finalValue = genderMap[value] ?? "OTHER";
    }
    if (field === "height") {
      finalValue = parseFloat(value);
    }

    if (field === "weight") {
      finalValue = parseFloat(value);
    }

    const updateData: Record<string, any> = {};
    updateData[field] = finalValue;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        email: true,
        avatar: true,
        gender: true,
        region: true,
        birthday: true,
        height: true,
        weight: true,
      },
    });

    return NextResponse.json({
      message: `用户字段「${field}」更新成功`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("更新用户信息失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
