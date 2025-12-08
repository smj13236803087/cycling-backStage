'use client'

import React, { useState, useEffect } from 'react'
import { Layout, Menu, MenuProps } from 'antd'
import {
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
  FileTextOutlined,
  HeatMapOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const { Sider, Content } = Layout

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedKey, setSelectedKey] = useState<string>('dashboard');
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/background-auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.role === 'USER') {
            router.push('/');
          } else {
            setUser(userData);
          }
        } else {
          throw new Error('身份验证失败');
        }
      } catch (error) {
        console.error('身份验证错误:', error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // 根据当前路由更新选中的菜单项和展开的菜单项
    if (pathname?.includes('/dashboard/users/follows')) {
      setSelectedKey('follows');
      setOpenKeys(['users-submenu']);
    } else if (pathname?.includes('/dashboard/users')) {
      setSelectedKey('users');
      setOpenKeys(['users-submenu']);
    } else if (pathname?.includes('/dashboard/manual-createRoute')) {
      setSelectedKey('manual-routes');
      setOpenKeys(['manual-routes-submenu']);
    } else if (pathname?.includes('/dashboard/ride-statistics')) {
      setSelectedKey('ride-statistics');
      setOpenKeys(['ride-routes-submenu']);
    } else if (pathname?.includes('/dashboard/ride-recordRoute')) {
      setSelectedKey('ride-routes');
      setOpenKeys(['ride-routes-submenu']);
    } else if (pathname?.includes('/dashboard/user-publish-route/liked-routes')) {
      setSelectedKey('liked-routes');
      setOpenKeys(['publish-routes-submenu']);
    } else if (pathname?.includes('/dashboard/user-publish-route')) {
      setSelectedKey('publish-routes');
      setOpenKeys(['publish-routes-submenu']);
    } else {
      setSelectedKey('dashboard');
      setOpenKeys([]);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/background-auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        throw new Error('登出失败');
      }
    } catch (error) {
      console.error('登出错误:', error);
    }
  };

  if (!user) return null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={225}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        {/* 左侧菜单 */}
        <div
          className="logo"
          style={{
            height: '32px',
            margin: '16px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src="/background-Logo.png"
            alt="Logo"
            width={32}
            height={32}
            style={{
              height: '32px',
              maxWidth: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
            }}
          />
          {!collapsed && (
            <span
              style={{
                fontFamily: 'dprofy',
                fontSize: '24px',
                color: 'white',
                marginLeft: '8px',
                lineHeight: '32px',
              }}
            >
              cycling
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: <Link href="/dashboard">仪表板</Link>,
            },
            {
              key: 'users-submenu',
              icon: <TeamOutlined />,
              label: '用户管理',
              children: [
                {
                  key: 'users',
                  icon: <UserOutlined />,
                  label: <Link href="/dashboard/users">用户列表</Link>,
                },
                {
                  key: 'follows',
                  icon: <TeamOutlined />,
                  label: <Link href="/dashboard/users/follows">关注列表</Link>,
                },
              ],
            },
            {
              key: 'manual-routes-submenu',
              icon: <FileTextOutlined />,
              label: '手动创建路线管理',
              children: [
                {
                  key: 'manual-routes',
                  icon: <FileTextOutlined />,
                  label: <Link href="/dashboard/manual-createRoute">手动创建路线列表</Link>,
                },
              ],
            },
            {
              key: 'ride-routes-submenu',
              icon: <HeatMapOutlined />,
              label: '骑行记录路线管理',
              children: [
                {
                  key: 'ride-routes',
                  icon: <HeatMapOutlined />,
                  label: <Link href="/dashboard/ride-recordRoute">骑行记录路线列表</Link>,
                },
                {
                  key: 'ride-statistics',
                  icon: <HeatMapOutlined />,
                  label: <Link href="/dashboard/ride-statistics">骑行统计列表</Link>,
                },
              ],
            },
            {
              key: 'publish-routes-submenu',
              icon: <ShareAltOutlined />,
              label: '发布路线管理',
              children: [
                {
                  key: 'publish-routes',
                  icon: <ShareAltOutlined />,
                  label: <Link href="/dashboard/user-publish-route">发布路线列表</Link>,
                },
                {
                  key: 'liked-routes',
                  icon: <ShareAltOutlined />,
                  label: <Link href="/dashboard/user-publish-route/liked-routes">路线点赞列表</Link>,
                },
              ],
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '登出',
              onClick: handleLogout,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: '24px', background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
