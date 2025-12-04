'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function AppRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    
    if (!redirect || typeof redirect !== 'string') return;

    // 获取 session 并生成 token
    fetch('/api/app-token', {
      method: 'POST',
      credentials: 'include', // 重要:携带 Cookie
    })
      .then(res => res.json())
      .then(data => {
        console.log('✅ 获取到 Token:', data);
        
        if (!data.token || !data.user) {
          throw new Error('Token 为空');
        }

        // 把 token 和用户信息传给 App
        const callbackUrl = new URL(redirect);
        
        // ⭐ 传递 token
        callbackUrl.searchParams.set('token', data.token);
        
        // 传递用户信息
        callbackUrl.searchParams.set('id', data.user.id);
        callbackUrl.searchParams.set('email', data.user.email || '');
        callbackUrl.searchParams.set('displayName', data.user.displayName || '');
        callbackUrl.searchParams.set('avatar', data.user.avatar || '');
        callbackUrl.searchParams.set('gender', data.user.gender || '');
        callbackUrl.searchParams.set('birthday', data.user.birthday || '');
        callbackUrl.searchParams.set('region', data.user.region || '');
        callbackUrl.searchParams.set('height', data.user.height?.toString() || '');
        callbackUrl.searchParams.set('weight', data.user.weight?.toString() || '');
        
        console.log('🚀 跳转到 App:', callbackUrl.href);
        window.location.href = callbackUrl.href;
      })
      .catch(err => {
        console.error('❌ 获取 Token 失败:', err);
        alert('登录失败,请重试');
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