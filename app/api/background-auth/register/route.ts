import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from "@/app/lib/prisma";
import redis from '@/app/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '@/app/lib/mailer';

export async function POST(req: Request) {
    try {
        const { name, email, password, age, gender, nickname, phone } = await req.json();
        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = uuidv4();
        await redis.set(
            `cycling_email_verification:${verificationToken}`,
            email,
            { ex: 60 * 60 } // 设置过期时间（秒）
        );
        // 1 hour expiration

        await sendVerificationEmail(email, verificationToken);

        // ✅ 确保 gender 是合法值
        const validGenders = ['MALE', 'FEMALE', 'OTHER'];
        const genderValue = validGenders.includes(gender?.toUpperCase()) ? gender.toUpperCase() : 'OTHER';

        const user = await prisma.user.create({
            data: {
                displayName: name,
                email,
                password: hashedPassword,
                age: age ?? 0,
                gender: genderValue, // ✅ 传入正确的 Enum 值
                status: 'INACTIVE',
            },
        });

        return NextResponse.json(
            { message: 'User registered successfully. Please verify your email.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
