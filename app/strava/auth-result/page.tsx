"use client";

import React, { Suspense } from "react";
import { Result, Button } from "antd";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function AuthResultInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");

  const isSuccess = status === "success";
  const title = isSuccess ? "授权成功，请回到 App" : "授权失败";
  const subTitle = isSuccess
    ? "Strava 账号已成功授权。您可以返回 App 继续使用。"
    : reason
    ? `失败原因：${decodeURIComponent(reason)}`
    : "授权失败，请重试。";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Result
        status={isSuccess ? "success" : "error"}
        title={title}
        subTitle={subTitle}
        extra={[
          <Link key="back" href="/">
            <Button type="primary">回到 App</Button>
          </Link>,
        ]}
      />
    </div>
  );
}

export default function AuthResultPage() {
  return (
    <Suspense fallback={null}>
      <AuthResultInner />
    </Suspense>
  );
}

