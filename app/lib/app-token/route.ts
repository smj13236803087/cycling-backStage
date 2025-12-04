import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import jwt from "jsonwebtoken";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    // 生成 JWT token (有效期 30 天)
    const token = jwt.sign(
      {
        userId: session.user.id,
        email: session.user.email,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: session.user,
    });
  } catch (error) {
    console.error("生成 token 失败:", error);
    return NextResponse.json(
      { error: "生成 token 失败" },
      { status: 500 }
    );
  }
}