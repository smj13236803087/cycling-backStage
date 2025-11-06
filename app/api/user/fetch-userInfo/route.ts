import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJwt } from "@/app/lib/jwt";
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "缺少授权头" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];
        const decoded = verifyJwt(token);
        if (!decoded) {
            return NextResponse.json({ error: "JWT 无效" }, { status: 403 });
        }
        const data = await req.json();
        const { userId } = data;
        if (!userId) {
            return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
        }
        const userInfo = await prisma.user.findUnique ({
            where: { id: userId },
            select: {
                displayName: true,         
                email: true,                    
                avatar: true,        
                password: true,      
                gender: true,        
                age: true,           
                region: true,        
                birthday: true,      
                height: true,        
                weight: true        
            }
        })
        if (!userInfo) {
            return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }
        return NextResponse.json({ userInfo });
    } catch (err) {
        console.error("获取用户信息失败:", err);
        return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
    }
}