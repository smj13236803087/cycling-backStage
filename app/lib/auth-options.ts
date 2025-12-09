import { AuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/app/lib/prisma";
import AppleProvider from "next-auth/providers/apple";
import TwitterProvider from "next-auth/providers/twitter";

const isProd = process.env.NODE_ENV === "production";
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
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
      authorization: {
        url: "https://appleid.apple.com/auth/authorize",
        params: {
          response_mode: "form_post",
          response_type: "code",
          scope: "name email",
        },
      },
    }),
    // Twitter 登录
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // 使用 OAuth 2.0
    }),
  ],

  callbacks: {
    // OAuth 登录处理数据库同步
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "apple" || account?.provider === "twitter") {
        console.log(`\n========== ${account?.provider.toUpperCase()} 登录回调 ==========`);
        
        // Twitter 登录时打印所有详细信息
        if (account?.provider === "twitter") {
          console.log("\n🐦 Twitter 登录 - 完整信息输出:");
          console.log("\n--- User 对象 (NextAuth 处理后的用户信息) ---");
          console.log(JSON.stringify(user, null, 2));
          console.log("\n--- Account 对象 (OAuth 账户信息) ---");
          console.log(JSON.stringify(account, null, 2));
          console.log("\n--- Profile 对象 (Twitter 原始返回的用户信息) ---");
          console.log(JSON.stringify(profile, null, 2));
          
          // 打印各个字段的详细信息
          console.log("\n--- 字段详情 ---");
          console.log("User ID:", user.id);
          console.log("User Name:", user.name);
          console.log("User Email:", user.email);
          console.log("User Image:", user.image);
          console.log("Account Provider:", account.provider);
          console.log("Account Type:", account.type);
          console.log("Account Provider Account ID:", account.providerAccountId);
          console.log("Account Access Token:", account.access_token ? "存在 (已隐藏)" : "不存在");
          console.log("Account Refresh Token:", account.refresh_token ? "存在 (已隐藏)" : "不存在");
          console.log("Account Expires At:", account.expires_at ? new Date(account.expires_at * 1000).toISOString() : "不存在");
          console.log("Account Scope:", account.scope);
          console.log("Account Token Type:", account.token_type);
          
          if (profile) {
            console.log("\n--- Profile 字段详情 ---");
            Object.keys(profile).forEach(key => {
              console.log(`${key}:`, (profile as any)[key]);
            });
          }
        } else {
          console.log(`${account?.provider} 登录回调:`);
          console.log("user:", JSON.stringify(user, null, 2));
          console.log("account:", JSON.stringify(account, null, 2));
        }
        
        // Twitter 可能不返回 email，需要特殊处理
        let email = user.email;
        if (account?.provider === "twitter" && !email) {
          console.log("\n⚠️ Twitter 未返回 email，使用占位邮箱");
          // Twitter OAuth 2.0 需要 users.read 权限才能获取 email
          // 如果没有 email，使用 Twitter ID 生成一个占位邮箱
          email = `twitter_${user.id}@twitter.placeholder`;
        }
        
        console.log("\n提取的邮箱:", email);
        if (!email) {
          console.log("❌ 邮箱为空，登录失败");
          return false;
        }

        const displayName =
          user.name || email.split("@")[0] || `${account?.provider}用户`;

        let dbUser = await prisma.user.findUnique({ where: { email } });

        if (!dbUser) {
          // OAuth 登录用户无需真实密码，这里用邮箱生成一个哈希占位
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
        user.email = dbUser.email; // 重要：确保 email 被正确传递（包括 Twitter 占位邮箱）
        user.displayName = dbUser.displayName;
        user.avatar = dbUser.avatar;
        user.gender = dbUser.gender;
        user.birthday = dbUser.birthday as Date | null;
        user.region = dbUser.region;
        user.height = dbUser.height;
        user.weight = dbUser.weight;
        
        if (account?.provider === "twitter") {
          console.log("\n✅ 更新后的 User 对象:");
          console.log("Email:", user.email);
          console.log("DisplayName:", user.displayName);
        }
      }
      return true;
    },

    // jwt 回调
    async jwt({ token, user, account }) {
      if (user) {
        // Twitter 登录时打印 JWT token 信息
        if (account?.provider === "twitter") {
          console.log("\n🔐 Twitter JWT 回调:");
          console.log("User 对象:", JSON.stringify(user, null, 2));
          console.log("Token 对象 (更新前):", JSON.stringify(token, null, 2));
        }
        
        token.id = user.id;
        token.email = user.email;
        token.displayName = user.displayName;
        token.avatar = user.avatar;
        token.gender = user.gender;
        token.birthday = user.birthday;
        token.region = user.region;
        token.height = user.height;
        token.weight = user.weight;
        
        if (account?.provider === "twitter") {
          console.log("Token 对象 (更新后):", JSON.stringify(token, null, 2));
        }
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
        // 新增 redirect 回调，处理 App scheme
        // async redirect({ url, baseUrl }) {
        //   console.log("🔄 NextAuth redirect:", url);
          
        //   // NextAuth 会自动跳转到 callbackUrl (也就是/app-redirect 页面)
        //   // 不需要特殊处理,保持默认行为即可
          
        //   if (url.startsWith("/")) return `${baseUrl}${url}`;
        //   else if (new URL(url).origin === baseUrl) return url;
        //   return baseUrl;
        // }
  },

  session: { strategy: "jwt" },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    // Apple Provider 默认使用 form_post 回调（跨站 POST），SameSite=Lax 不会携带 Cookie
    pkceCodeVerifier: {
      name: "__Secure-next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        secure: isProd,
      },
    },
    state: {
      name: "__Secure-next-auth.state",
      options: {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        secure: isProd,
      },
    },
    callbackUrl: {
      name: "__Secure-next-auth.callback-url",
      options: {
        httpOnly: false,           // 这里通常需要 false，前端可读
        sameSite: isProd ? "none" : "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
