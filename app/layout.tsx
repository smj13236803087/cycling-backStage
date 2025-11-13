import StyledComponentsRegistry from "@/app/lib/AntdRegistry";
import "./styles/globals.css"; // 我们将创建这个文件来设置全局样式
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import React from "react";
export const metadata = {
  title: "管理系统",
  description: "使用 Next.js 和 Ant Design 构建的管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
