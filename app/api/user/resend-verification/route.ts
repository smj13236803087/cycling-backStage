import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { sendVerificationCodeEmail } from "@/app/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "邮箱不能为空" }, { status: 400 });
    }

    const pendingUser = await prisma.pendingUser.findUnique({ where: { email } });
    if (!pendingUser) {
      return NextResponse.json({ message: "未找到注册记录，请重新注册" }, { status: 400 });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟有效

    await prisma.pendingUser.update({
      where: { email },
      data: {
        verificationCode,
        expiresAt,
      },
    });

    await sendVerificationCodeEmail(email, verificationCode);

    return NextResponse.json({ message: "验证码已重新发送" }, { status: 200 });
  } catch (error) {
    console.error("重新发送验证码失败:", error);
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}


