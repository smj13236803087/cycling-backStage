'use client';

import { Suspense, useEffect } from 'react';  // ← 加上 useEffect
import { useSearchParams } from 'next/navigation';

function AppRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    
    if (redirect && typeof redirect === 'string') {
      console.log('🚀 准备跳转到 App:', redirect);
      
      // 尝试跳转到 App
      window.location.href = redirect;
      
      // 3 秒后如果没跳转成功,显示提示
      setTimeout(() => {
        alert('请在 App 中打开此页面');
      }, 3000);
    }
  }, [searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui'
    }}>
      <h2>🎉 登录成功!</h2>
      <p>正在返回 App...</p>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
        如果没有自动跳转,请关闭此页面并返回 App
      </p>
    </div>
  );
}

export default function AppRedirect() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <AppRedirectContent />
    </Suspense>
  );
}