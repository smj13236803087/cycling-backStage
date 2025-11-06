import { NextResponse } from "next/server";
import { verifyJwt } from "@/app/lib/jwt";
import prisma from "@/app/lib/prisma";
import fs from "fs";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "缺少授权头" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "JWT 无效" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 1️⃣ 读取文件 buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2️⃣ 确保目录存在
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatar");
    await mkdir(uploadDir, { recursive: true }); // ✅ 自动创建多级目录

    // 3️⃣ 构造文件路径
    const filename = `${userId}-${Date.now()}.jpg`;
    const uploadPath = path.join(uploadDir, filename);

    // 4️⃣ 写入文件
    await writeFile(uploadPath, buffer);

    // 5️⃣ 拼接 URL
    const imageUrl = `uploads/avatar/${filename}`;
    const fullUrl = `https://${process.env.NEXT_PUBLIC_ENDPOINT}/${imageUrl}`;

    // 6️⃣ 更新数据库
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: fullUrl },
    });

    return NextResponse.json({ success: true, url: fullUrl });
  } catch (err) {
    console.error("上传头像失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
