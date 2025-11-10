import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { generateJwt } from "@/app/lib/jwt";

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

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

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "缺少授权头" }, { status: 401 });
    }

    const firebaseToken = authHeader.split(" ")[1];

    const { admin } = await import("@/app/lib/firebaseAdmin");
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken, false);
      if (decodedToken.uid !== id) {
        return NextResponse.json({ error: "用户身份不匹配" }, { status: 403 });
      }
    } catch (err: any) {
      return NextResponse.json({ error: "Token 验证失败", details: err.message }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { id } });

    if (user) {
      const token = await generateJwt({ userId: user.id.toString() });
      return NextResponse.json({ token });
    } else {
      const randomName = Math.floor(Math.random() * 10000);

      // 确保 gender 是有效枚举值，否则使用默认 OTHER
      const validGenders = Object.values(Gender);
      const finalGender = validGenders.includes(gender as Gender) ? (gender as Gender) : Gender.OTHER;

      user = await prisma.user.create({
        data: {
          id,
          displayName: displayName || `用户_${randomName}`,
          email: email || `newuser_${randomName}@cycling_temp.com`,
          avatar: avatar || null,
          password: bcrypt.hashSync("defaultPassword", 10),
          gender: finalGender,
          age: age || 0,
          region: region || "",
          birthday: birthday || "",
          height: height || 0,
          weight: weight || 0,
        },
      });

      const token = await generateJwt({ userId: user.id.toString() });
      return NextResponse.json({ token });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "登录失败", details: error.message }, { status: 500 });
  }
}
