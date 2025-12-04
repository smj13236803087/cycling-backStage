import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/app/lib/prisma";

// 获取当前用户 (支持 Cookie 和 Token)
export async function getCurrentUser() {
  // 方式 1: 尝试从 Cookie 获取 session (网页端 + 邮箱密码登录)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    console.log("✅ 通过 Cookie Session 认证");
    return session.user;
  }

  // 方式 2: 尝试从 Header 获取 token (App 端 OAuth 登录)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    try {
      // 验证 JWT token
      const decoded = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET!
      ) as { userId: string; email: string };
      
      console.log("✅ 通过 Token 认证, userId:", decoded.userId);
      
      // 从数据库获取完整用户信息
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatar: true,
          gender: true,
          birthday: true,
          region: true,
          height: true,
          weight: true,
        },
      });
      
      if (!user) {
        console.error("❌ Token 中的用户不存在");
        return null;
      }
      
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        region: user.region,
        height: user.height,
        weight: user.weight,
      };
    } catch (error) {
      console.error("❌ Token 验证失败:", error);
      return null;
    }
  }

  console.log("⚠️ 未找到有效的认证信息");
  return null;
}

// 要求必须认证
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("未授权");
  }
  return user;
}