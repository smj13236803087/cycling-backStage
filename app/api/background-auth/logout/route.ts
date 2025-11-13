import { NextResponse } from 'next/server';

export async function POST() {
  // 在服务器端,我们只需要返回一个成功响应
  // 客户端负责清除本地存储的 token
  return NextResponse.json({ message: 'Logged out successfully' });
}