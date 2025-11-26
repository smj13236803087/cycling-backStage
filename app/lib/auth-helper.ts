import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options"; // 导入你的 authOptions

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("未授权");
  }
  return user;
}