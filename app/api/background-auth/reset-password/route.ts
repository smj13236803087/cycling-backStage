import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from "@/app/lib/prisma";
import redis from '@/app/lib/redis';

export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json();

        const email = await redis.get(`password_reset:${token}`);

        if (!email) {
            return NextResponse.json({ error: 'Token expired or invalid' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email: email as string },
            data: { password: hashedPassword },
        });

        await redis.del(`password_reset:${token}`);

        return NextResponse.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}