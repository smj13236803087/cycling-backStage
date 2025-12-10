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
  const title = isSuccess ? "Authorization successful, please return to App" : "Authorization failed";
  const subTitle = isSuccess
    ? "Strava account has been successfully authorized. You can return to App to continue using."
    : reason
    ? `Failure reason: ${decodeURIComponent(reason)}`
    : "Authorization failed, please try again.";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Result
        status={isSuccess ? "success" : "error"}
        title={title}
        subTitle={subTitle}
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

