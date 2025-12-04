import { AuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/app/lib/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    displayName: string | null;
    avatar: string | null;
    gender: string | null;
    birthday: Date | null;
    region: string | null;
    height: number | null;
    weight: number | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      displayName: string | null;
      avatar: string | null;
      gender: string | null;
      birthday: Date | null;
      region: string | null;
      height: number | null;
      weight: number | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    displayName: string | null;
    avatar: string | null;
    gender: string | null;
    birthday: Date | null;
    region: string | null;
    height: number | null;
    weight: number | null;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    // Credentials 登录
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          gender: user.gender as string | null,
          birthday: user.birthday,
          region: user.region,
          height: user.height,
          weight: user.weight,
        } as User;
      },
    }),

    // Google 登录
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Google 登录处理数据库同步
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const displayName =
          user.name || email.split("@")[0] || "Google用户";

        let dbUser = await prisma.user.findUnique({ where: { email } });

        if (!dbUser) {
          // Google 登录用户无需真实密码，这里用邮箱生成一个哈希占位
          const hashedPassword = await bcrypt.hash(email, 10);

          dbUser = await prisma.user.create({
            data: {
              email,
              displayName,
              avatar: user.image || null,
              gender: null,
              birthday: null,
              region: null,
              height: null,
              weight: null,
              password: hashedPassword,
            },
          });
        }

        // 覆盖 user 对象，保证 jwt/session 使用数据库信息
        user.id = dbUser.id;
        user.displayName = dbUser.displayName;
        user.avatar = dbUser.avatar;
        user.gender = dbUser.gender;
        user.birthday = dbUser.birthday as Date | null;
        user.region = dbUser.region;
        user.height = dbUser.height;
        user.weight = dbUser.weight;
      }
      return true;
    },

    // jwt 回调
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.displayName = user.displayName;
        token.avatar = user.avatar;
        token.gender = user.gender;
        token.birthday = user.birthday;
        token.region = user.region;
        token.height = user.height;
        token.weight = user.weight;
      }
      return token;
    },

    // session 回调
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          displayName: token.displayName,
          avatar: token.avatar,
          gender: token.gender,
          birthday: token.birthday,
          region: token.region,
          height: token.height,
          weight: token.weight,
        };
      }
      return session;
    },
        // ✅ 新增 redirect 回调，处理 App scheme
        async redirect({ url, baseUrl }) {
          console.log("--- NextAuth Redirect 回调 ---");
          console.log("url:", url);
          console.log("baseUrl:", baseUrl);
          
          try {
            const redirectUrl = new URL(url, baseUrl);
            console.log("完整 URL:", redirectUrl.href);
            console.log("所有参数:", Object.fromEntries(redirectUrl.searchParams));
            
            const appRedirect = redirectUrl.searchParams.get("callbackUrl");
            if (appRedirect) {
              console.log("✅ 找到 callbackUrl,准备跳转到:", appRedirect);
              return appRedirect;
            }
          } catch (error) {
            console.error("❌ 解析失败:", error);
          }
          
          console.log("🏠 使用默认跳转:", baseUrl);
          return baseUrl;
        }
  },

  session: { strategy: "jwt" },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
