import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ message: "邮箱或验证码不能为空" }, { status: 400 });
    }

    // 查找 pending_users 表
    const pendingUser = await prisma.pendingUser.findUnique({ where: { email } });
    if (!pendingUser) {
      return NextResponse.json({ message: "未找到注册记录或验证码已过期" }, { status: 400 });
    }

    //验证验证码是否正确
    if (pendingUser.verificationCode !== code) {
      return NextResponse.json({ message: "验证码错误" }, { status: 400 });
    }

    // 检查验证码是否过期
    if (pendingUser.expiresAt < new Date()) {
      // 删除过期记录
      await prisma.pendingUser.delete({ where: { email } });
      return NextResponse.json({ message: "验证码已过期，请重新注册" }, { status: 400 });
    }

    // 写入正式用户表
    await prisma.user.create({
      data: {
        email: pendingUser.email,
        displayName: pendingUser.displayName,
        password: pendingUser.password,
      },
    });

    // 删除 pending_users 记录
    await prisma.pendingUser.delete({ where: { email } });
    
    return NextResponse.json({ message: "注册成功" }, { status: 201 });
  } catch (error) {
    console.error("验证码验证失败:", error);
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}
