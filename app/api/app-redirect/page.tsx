'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function AppRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    
    if (!redirect || typeof redirect !== 'string') return;

    // 在浏览器环境中获取 session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        console.log('✅ 获取到 Session:', session);
        
        if (!session?.user) {
          throw new Error('Session 为空');
        }

        // 把用户信息编码到 URL 中
        const callbackUrl = new URL(redirect);
        
        // 方式 1: 直接传递用户信息
        callbackUrl.searchParams.set('id', session.user.id || '');
        callbackUrl.searchParams.set('email', session.user.email || '');
        callbackUrl.searchParams.set('name', session.user.name || '');
        callbackUrl.searchParams.set('image', session.user.image || '');
        
        // 方式 2: 或者传递整个 session JSON
        // callbackUrl.searchParams.set('session', JSON.stringify(session));
        
        console.log('🚀 跳转到 App:', callbackUrl.href);
        window.location.href = callbackUrl.href;
      })
      .catch(err => {
        console.error('❌ 获取 Session 失败:', err);
        alert('登录失败，请重试');
      });
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