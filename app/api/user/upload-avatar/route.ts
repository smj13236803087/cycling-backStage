import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import fs from "fs";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "";

export async function POST(req: Request) {
  try {
    // 1️⃣ 获取 Authorization 头
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "缺少授权头" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ 验证 JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "JWT 无效或已过期" }, { status: 403 });
    }

    // 3️⃣ 获取表单数据
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // 优先用 token 的 id，如果 formData 有 userId 就覆盖
    let userId = decoded.id as string;
    const formUserId = formData.get("userId") as string;
    if (formUserId) userId = formUserId;

    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 4️⃣ 读取文件 buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5️⃣ 确保目录存在
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatar");
    await mkdir(uploadDir, { recursive: true });

    // 6️⃣ 构造文件路径
    const filename = `${userId}-${Date.now()}.jpg`;
    const uploadPath = path.join(uploadDir, filename);

    // 7️⃣ 写入文件
    await writeFile(uploadPath, buffer);

    // 8️⃣ 拼接 URL
    const imageUrl = `uploads/avatar/${filename}`;
    const fullUrl = `https://${process.env.NEXT_PUBLIC_ENDPOINT}/${imageUrl}`;

    // 9️⃣ 更新数据库
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
