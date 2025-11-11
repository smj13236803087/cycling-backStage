import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/app/lib/prisma";
import { sendVerificationCodeEmail } from "@/app/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "邮箱或密码不能为空" }, { status: 400 });
    }

    // 1️⃣ 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "邮箱已注册" }, { status: 400 });
    }

    // 检查是否已有 pendingUser 记录
    const existingPending = await prisma.pendingUser.findUnique({ where: { email } });
    if (existingPending) {
      return NextResponse.json({ message: "该邮箱已发送验证码，请检查邮箱" }, { status: 400 });
    }

    // 2️⃣ 哈希密码
    const hashedPassword = await hash(password, 12);


    // 3️⃣ 生成 6 位验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // 4️⃣ 存入 pending_users 表
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟有效
    await prisma.pendingUser.create({
      data: {
        email,
        displayName,
        password: hashedPassword,
        verificationCode,
        expiresAt,
      },
    });

    // 5️⃣ 发送邮件
    await sendVerificationCodeEmail(email, verificationCode);

    // 6️⃣ 返回成功响应
    return NextResponse.json({ message: "验证码已发送，请查收邮箱" }, { status: 200 });
  } catch (error) {
    console.error("注册接口错误:", error);
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}
