import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {admin} from "@/app/lib/firebaseAdmin";
import bcrypt from 'bcryptjs';
import { generateJwt } from '@/app/lib/jwt';

export async function POST(req: Request) {
    try {
        const {
            id,
            displayName,
            email,
            avatar,
            age,
            gender,
            region,
            birthday,
            height,
            weight,
        } = await req.json();

        // 从请求头中获取 Bearer token
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: '缺少或无效的授权头' }, { status: 401 });
        }
        const firebaseToken = authHeader.split(' ')[1];

        // 校验 Firebase token 的合法性
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        if (!decodedToken) {
            return NextResponse.json({ error: '无效的 Firebase token' }, { status: 401 });
        }

        // 查询数据库中是否已经存在用户
        let user = await prisma.user.findUnique({ where: { id } });

        if (user) {
            // 如果用户存在，返回 JWT
            const token = await generateJwt({ userId: user.id.toString() });
            return NextResponse.json({ token });
        } else {
            // 如果用户不存在，创建一个新用户
            let avatarUrl = null;

            let randomName = Math.floor(Math.random() * 10000);
            // 创建新用户
            user = await prisma.user.create({
                data: {
                    displayName,
                    email: email === '' ? `newuser_${randomName}@cycling_temp.com` : email,
                    avatar: avatarUrl,
                    password: bcrypt.hashSync('defaultPassword', 10),
                    gender: gender ?? '',
                    age: age ?? 0,
                    region: region ?? '',
                    birthday: birthday ? new Date(birthday) : null,
                    height: height ?? 0,
                    weight: weight ?? 0,
                }
            });

            // 生成新的 JWT
            const token = await generateJwt({ userId: user.id.toString() });
            console.log(token)
            // 返回 JWT
            return NextResponse.json({ token });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: '登录失败' }, { status: 500 });
    }
}
