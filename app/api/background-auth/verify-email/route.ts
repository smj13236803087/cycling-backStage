import { NextResponse } from 'next/server';
import prisma from "@/app/lib/prisma";
import redis from '@/app/lib/redis';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Invalid or missing token' }, { status: 400 });
    }

    const email = await redis.get(`cycling_email_verification:${token}`);

    if (!email) {
        return NextResponse.json({ error: 'Token expired or invalid' }, { status: 400 });
    }

    await prisma.user.update({
        where: { email: email as string },
        data: { status: 'ACTIVE' },
    });

    await redis.del(`cycling_email_verification:${token}`);

    return NextResponse.json({ message: 'Email verified successfully' });
}