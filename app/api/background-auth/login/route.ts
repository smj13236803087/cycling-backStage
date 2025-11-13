import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/app/lib/prisma";
import { generateJwt } from "@/app/lib/jwt";
import redis from '@/app/lib/redis';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "用户未找到" }, { status: 404 });
    }

    if (user.status.toUpperCase() !== 'ACTIVE') {
      return NextResponse.json({ error: '用户未激活，请先验证您的邮箱' }, { status: 403 });
    }

    if (!user.password) {
      return NextResponse.json({ error: "密码未设置" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "密码无效" }, { status: 401 });
    }

    const token = await generateJwt({ userId: user.id });

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
