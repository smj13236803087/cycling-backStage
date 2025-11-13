'use client'

import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import styles from './ForgotPassword.module.css'

export default function ForgotPassword() {
    const onFinish = async (values: any) => {
        try {
            const response = await fetch('/api/background-auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })

            if (response.ok) {
                message.success('重置密码邮件已发送，请检查您的邮箱')
            } else {
                message.error('发送重置密码邮件失败，请重试')
            }
        } catch (error) {
            console.error('Forgot password error:', error)
            message.error('发送重置密码邮件过程中发生错误')
        }
    }

    return (
        <div className={styles.container}>
            <Card title="忘记密码" className={styles.card}>
                <Form name="forgot-password" onFinish={onFinish} className={styles.form}>
                    <Form.Item name="email" rules={[{ required: true, message: '请输入您的邮箱!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="邮箱" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className={styles.submitButton}>
                            发送重置密码邮件
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}