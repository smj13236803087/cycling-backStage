// import { NextResponse } from "next/server";
// import { compare } from "bcryptjs";
// import prisma from "@/app/lib/prisma";
// import { requireAuth } from "@/app/lib/auth-helper";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { email, password, loginType, displayName ,userId} = body;
//     if (loginType == "googleLogin") {
//       const user = await prisma.user.findUnique({ where: { email } });
//       if (!user) {
//         const userCreate = await prisma.user.create({
//           data: { id: userId,email, displayName: displayName },
//         });
//         if (!userCreate) return NextResponse.json({ error: "用户创建失败" }, { status: 500 });
//         const user = await prisma.user.findUnique({ where: { email } });
//         if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 400 });
//         const token = jwt.sign(
//           { id: user.id, email: user.email, name: user.displayName || "" },
//           JWT_SECRET,
//           { expiresIn: "7d" }
//         );
//         return NextResponse.json({
//           message: "登录成功",
//           token,
//           user: {
//             id: user.id,
//             email: user.email ?? "新用户",
//             displayName: user.displayName,
//             avatar: user.avatar,
//             gender: user.gender,
//             birthday: user.birthday,
//             region: user.region,
//             height: user.height,
//             weight: user.weight,
//           },
//         });
//       } else {
//         const token = jwt.sign(
//           { id: user.id, email: user.email, name: user.displayName || "" },
//           JWT_SECRET,
//           { expiresIn: "7d" }
//         );
//         return NextResponse.json({
//           message: "登录成功",
//           token,
//           user: {
//             id: user.id,
//             email: user.email ?? "新用户",
//             displayName: user.displayName,
//             avatar: user.avatar,
//             gender: user.gender,
//             birthday: user.birthday,
//             region: user.region,
//             height: user.height,
//             weight: user.weight,
//           },
//         });
//       }
//     }
//     if (!email || !password) {
//       return NextResponse.json({ error: "邮箱或密码不能为空" }, { status: 400 });
//     }

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       return NextResponse.json({ error: "邮箱未注册" }, { status: 400 });
//     }

//     if (!user.password) {
//       return NextResponse.json({ error: "密码未设置，请重置密码" }, { status: 400 });
//     }

//     const isValid = await compare(password, user.password);
//     if (!isValid) {
//       return NextResponse.json({ error: "密码错误" }, { status: 400 });
//     }

//     const token = jwt.sign(
//       { id: user.id, email: user.email, name: user.displayName || "" },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return NextResponse.json({
//       message: "登录成功",
//       token,
//       user: {
//         id: user.id,
//         email: user.email,
//         displayName: user.displayName,
//         avatar: user.avatar,
//         gender: user.gender,
//         birthday: user.birthday,
//         region: user.region,
//         height: user.height,
//         weight: user.weight,
//       },
//     });
//   } catch (err) {
//     console.error("登录接口出错:", err);
//     return NextResponse.json({ error: "服务器错误" }, { status: 500 });
//   }
// }
