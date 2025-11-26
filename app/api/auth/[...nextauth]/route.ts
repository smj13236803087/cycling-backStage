import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth-options";

// NextAuth 路由处理器
const handler = NextAuth(authOptions);

// 在 Next.js App Router 中，路由文件只能导出 HTTP 方法处理器
export { handler as GET, handler as POST };