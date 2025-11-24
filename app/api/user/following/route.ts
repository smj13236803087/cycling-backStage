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

        // 查询关注列表：查找所有 followerId 等于当前 userId 的记录
        // 并关联查询 following (被关注者) 的详细信息
        const following = await prisma.userFollow.findMany({
            where: {
                followerId: userId,
            },
            include: {
                following: { // 假设你的 Prisma schema 中关联字段名为 following
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
        const users = following.map((record) => record.following);

        return NextResponse.json({ users });
    } catch (err) {
        console.error("获取关注列表失败:", err);
        return NextResponse.json({ error: "获取关注列表失败" }, { status: 500 });
    }
}