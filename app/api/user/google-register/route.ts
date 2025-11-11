import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { email,displayName } = data;

        if (!email) {
            return NextResponse.json({ message: "Google ID或邮箱不能为空" }, { status: 400 });
        }

        // 检查用户是否已存在
        let user = await prisma.user.findUnique({ where: { email } });
        const hashedPassword = await bcrypt.hash(email, 10);
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    displayName: displayName || "Google用户",
                    password: hashedPassword,
                },
            });
        } else {
            return NextResponse.json({ message: "用户已存在，直接登录", user }, { status: 200 });
        }

        return NextResponse.json({ message: "注册成功", user }, { status: 200 });
    } catch (error) {
        console.error("Google注册失败:", error);
        return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
    }
}