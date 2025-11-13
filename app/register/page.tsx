'use client'

import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './Register.module.css'

export default function Register() {
    const router = useRouter()

    const onFinish = async (values: any) => {
        try {
            const response = await fetch('/api/background-auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })

            if (response.ok) {
                console.log('Registration successful')
                message.success('注册成功，请检查您的邮箱以验证账户')
                router.push('/login')
            } else {
                message.error('注册失败，请重试')
            }
        } catch (error) {
            console.error('Register error:', error)
            message.error('注册过程中发生错误')
        }
    }

    return (
        <div className={styles.container}>
            <Card title="注册" className={styles.card}>
                <Form name="register" onFinish={onFinish} className={styles.form}>
                    <Form.Item name="name" rules={[{ required: true, message: '请输入您的姓名!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="姓名" />
                    </Form.Item>
                    <Form.Item name="email" rules={[{ required: true, message: '请输入您的邮箱!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="邮箱" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入您的密码!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className={styles.submitButton}>
                            注册
                        </Button>
                        或者 <Link href="/login">现在登录!</Link>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}