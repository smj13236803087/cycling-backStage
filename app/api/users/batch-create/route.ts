import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/lib/prisma";
import bcrypt from 'bcryptjs';
// 生成用户数据的函数
const generateRandomUser = async (id: number) => {
  const password_first = `123456_${id}`;
  const hashedPassword = await bcrypt.hash(password_first, 10);
  return {
    displayName: `test_u${id}`,
    email: `test_u${id}@123.com`,
    password: hashedPassword,
    createdTime: new Date(),
    age: Number(id),
    gender: 'male',
  };
};

export async function POST(req: NextRequest) {
  try {
    // 获取所有用户的email
    const existingEmails = await prisma.user.findMany({
      select: { email: true },
    });
    const emailsSet = new Set(existingEmails.map((user) => user.email));

    const { startId, endId } = await req.json();

    // 创建用户数据并过滤掉已存在的邮箱
    let usersToCreate = [];
    let existingEmailCount = 0;
    for (let i = startId; i <= endId; i++) {
      const user = await generateRandomUser(i);
      if (!emailsSet.has(user.email)) {
        usersToCreate.push(user);
      } else {
        existingEmailCount++;
      }
    }

    if (usersToCreate.length === 0) {
      return NextResponse.json(
        { message: '所有邮箱都已存在', existingEmailCount },
        { status: 200 }
      );
    }

    const createdUsers = await prisma.user.createMany({
      data: usersToCreate,
      skipDuplicates: true, // 跳过重复记录（如果有唯一约束）
    });

    return NextResponse.json(
      {
        message: `${createdUsers.count}个邮箱成功创建，${existingEmailCount}个邮箱已经存在`,
        createdEmailCount: createdUsers.count,
        existingEmailCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating users:', error);
    return NextResponse.json(
      { error: '创建用户失败，请稍后再试' },
      { status: 500 }
    );
  }
}