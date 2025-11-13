'use client'

import React, { useState, useEffect } from 'react'
import { Layout, Menu, MenuProps } from 'antd'
import {
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const { Sider, Content } = Layout
const { SubMenu } = Menu

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedKey, setSelectedKey] = useState<string>('1'); // 存储当前选中的菜单项
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = useState<string[]>([]); // 存储展开的菜单项
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
    if (pathname?.includes('/dashboard/users')) {
      setSelectedKey('2');
      setOpenKeys(['sub1']);
    } else if (pathname?.includes('/dashboard/devices')) {
      setSelectedKey('3');
      setOpenKeys(['sub2']);
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

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: '登出',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

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
          defaultOpenKeys={openKeys}
          items={[
            {
              key: '1',
              icon: <DashboardOutlined />,
              label: <Link href="/dashboard">仪表板</Link>,
            },
            {
              key: 'sub1',
              icon: <TeamOutlined />,
              label: '用户管理',
              children: [
                {
                  key: '2',
                  icon: <UserOutlined />,
                  label: <Link href="/dashboard/users">用户列表</Link>,
                },
              ],
            },
            {
              key: 'sub2',
              icon: <TeamOutlined />,
              label: '手动创建路线管理',
              children: [
                {
                  key: '3',
                  icon: <UserOutlined />,
                  label: <Link href="/dashboard/manual-createRoute">手动创建路线列表</Link>,
                },
              ],
            },
            {
              key: 'sub3',
              icon: <TeamOutlined />,
              label: '骑行记录路线管理',
              children: [
                {
                  key: '4',
                  icon: <UserOutlined />,
                  label: <Link href="/dashboard/ride-recordRoute">骑行记录路线列表</Link>,
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
