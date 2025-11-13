import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { Gender } from "@prisma/client";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        age: true,
        gender: true,
        displayName: true,
        avatar: true,
        role: true,
        createdTime: true,
        updatedAt: true,
        status: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      email,
      password,
      age,
      gender,
      displayName,
      role,
      avatar,
    } = await req.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    // 转换 gender 为大写
    const normalizedGender = gender ? (gender.toUpperCase() as Gender) : null;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        age,
        gender: normalizedGender,
        displayName,
        role,
        avatar: avatar || undefined,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        age: true,
        gender: true,
        avatar: true,
        role: true,
        createdTime: true,
        updatedAt: true,
        status: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
