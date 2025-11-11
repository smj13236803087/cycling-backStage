import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import fs from "fs";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { requireAuth } from "@/app/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    let userId = user.id;
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
