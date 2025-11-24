import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

export async function POST(req: Request) {
    try {
        // 验证用户登录状态
        await requireAuth();
        const data = await req.json();
        const { userId } = data;

        if (!userId) {
            return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
        }

        // 查询粉丝列表：查找所有 followingId 等于当前 userId 的记录
        // 并关联查询 follower (粉丝) 的详细信息
        const followers = await prisma.userFollow.findMany({
            where: {
                followingId: userId,
            },
            include: {
                follower: { // 假设你的 Prisma schema 中关联字段名为 follower
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        avatar: true,
                        gender: true,
                        age: true,
                        region: true,
                        birthday: true,
                        height: true,
                        weight: true,
                    },
                },
            },
        });

        // 提取用户信息数组
        const users = followers.map((record) => record.follower);

        return NextResponse.json({ users });
    } catch (err) {
        console.error("获取粉丝列表失败:", err);
        return NextResponse.json({ error: "获取粉丝列表失败" }, { status: 500 });
    }
}