import { AuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/app/lib/prisma";

// 扩展 NextAuth 的 User/Session 类型以包含额外的用户数据
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

// 扩展 JWT Token 类型
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

// 明确指定 authOptions 的类型为 AuthOptions
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

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
  ],
  
  callbacks: {
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
  },
  
  session: {
    strategy: "jwt",
  },
  
  // 🔑 关键：配置 Cookie
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // 开发环境设为 false
      },
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};

