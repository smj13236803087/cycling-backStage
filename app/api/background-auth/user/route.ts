import { NextResponse } from 'next/server';
import prisma from "@/app/lib/prisma";
import { verifyJwt } from '@/app/lib/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await verifyJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded!.userId as string || '' },
      select: { 
        id: true, 
        email: true, 
        age: true, 
        gender: true, 
        displayName: true,  
        birthday: true,
        region: true,
        createdTime: true, 
        updatedAt: true, 
        avatar: true, 
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '未找到用户' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}