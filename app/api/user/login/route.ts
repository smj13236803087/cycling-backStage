import { NextResponse } from "next/server";

// 此路由已暂时禁用，所有功能已迁移到 NextAuth
export async function POST(req: Request) {
  return NextResponse.json({ error: "此路由已禁用，请使用 /api/auth/signin" }, { status: 410 });
}
