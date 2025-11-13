import { NextResponse } from 'next/server';
import prisma from "@/app/lib/prisma";
import redis from '@/app/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/app/lib/mailer';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        const user = await prisma.user.findUnique({ where: { email: email as string } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const resetToken = uuidv4();
        await redis.set(
            `password_reset:${resetToken}`,
            email,
            { ex: 60 * 60 } // 设置过期时间（秒）
        );

        await sendPasswordResetEmail(email, resetToken);

        return NextResponse.json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
    }
}