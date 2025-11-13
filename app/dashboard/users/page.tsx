"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  GetProp,
  Checkbox,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { UploadProps } from "antd/es/upload/interface";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { fetchWithAuth } from "@/app/lib/api";
import dayjs from "dayjs";

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  nickname: string;
  phone: string;
  status: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (img: FileType, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result as string));
  reader.readAsDataURL(img);
};
const userRole = [
  { label: '超级管理员', value: 'SUPER_ADMIN' },
  { label: '管理员', value: 'ADMIN' },
  { label: '用户', value: 'USER' },
]; 
export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [wait, setWait] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSort, setIsSort] = useState(false);
  const [newSearchType, setNewSearchType] = useState('');
  const [oldSearchType, setOldSearchType] = useState('');
  const [newSearchValue, setNewSearchValue] = useState('');
  const [oldSearchValue, setOldSearchValue] = useState('');
  const [hasSearch, setHasSearch] = useState(false); 
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    order: 'asc' | 'desc' | null;
  }>({
    key: '',
    order: null,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const [batchCreateModalVisible, setBatchCreateModalVisible] = useState(false); // 控制批量创建用户模态框
  const [startId, setStartId] = useState<string>(''); // 起始编号
  const [endId, setEndId] = useState<string>(''); // 结束编号

  useEffect(() => {
    if (isSort) {
      handleSearch();
      setIsSort(false); // 执行查询后重置状态
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSort]);
  useEffect(() => {
    if (hasSearch) {
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSearch]);

  useEffect(() => {
    fetchUsers();
  }, []);
  // 处理排序逻辑
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // 已经排序，切换顺序
        return { key, order: prev.order === 'desc' ? 'asc' : 'desc' };
      } else {
        // 选择新的排序字段，默认降序
        return { key, order: 'desc' };
      }
    });
    setIsSort(true);
  };
  // 批量创建用户请求函数
  const handlBatchCreateUsers = async () => {
    setBatchCreateModalVisible(false);
    // 检查是否为纯数字
    if (isNaN(Number(startId)) || isNaN(Number(endId))) {
      message.error('请输入有效的数字编号', 3); // 显示错误信息并在3秒后自动消失
      return;
    }

    if (endId && startId) {
      if (Number(endId) <= Number(startId)) {
        message.error('结束编号必须大于起始编号！', 3);
        return;
      }
    } else if (endId && !startId) {
      message.error('请输入起始编号', 3);
      return;
    } else if (!endId && startId) {
      message.error('请输入结束编号', 3);
      return;
    } else {
      message.error('请输入编号', 3);
      return;
    }
    try {
      // 向后端 API 发送请求，批量创建用户
      setWait(true);
      const response = await fetchWithAuth('/api/users/batch-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startId, endId }), // 将起始编号和结束编号作为请求体传递
      });
      if (!response.ok) 
        {
          setWait(false);
          throw new Error('批量创建用户失败');
        }
      const data = await response.json();
      // message.success(`成功创建了 ${data.createdUsers.count} 个用户`);
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : '';
        if (hasSearch) {
          await fetchUsers(
            1,
            pagination.pageSize,
            newSearchValue,
            newSearchType,
            sortParam
          );
        } else {
          await fetchUsers(
            1,
            pagination.pageSize,
            oldSearchValue,
            oldSearchType,
            sortParam
          );
        }
      message.success(data.message || '批量创建用户成功');
    } catch (error) {
      setWait(false);
      console.error('批量创建用户失败:', error);
      message.error('批量创建用户失败，请稍后重试');
    }

    // 关闭模态框
    setStartId('');
    setEndId('');
  };
  const handleSearch = async () => {
    if(!isSort){
      setSortConfig({ key: '', order: null});
      await fetchUsers(1, pagination.pageSize, newSearchValue, newSearchType, '');
    } else {
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : '';
      if(hasSearch){
        await fetchUsers(1, pagination.pageSize, newSearchValue, newSearchType, sortParam);
      } else {
        await fetchUsers(1, pagination.pageSize, oldSearchValue, oldSearchType, sortParam);
      }
    }
  };
  // 新增的分页状态
  const [pagination, setPagination] = useState({
    current: 1, // 当前页
    pageSize: 10, // 每页显示的记录数
    total: 0, // 总记录数
  });
  const fetchUsers = async (
    page: number = 1,
    pageSize: number = 10,
    name: string = "",
    type: string = "",
    sort: string = ''
  ) => {
    try {
      setWait(true);
      const response = await fetchWithAuth(
        `/api/users/page?page=${page}&pageSize=${pageSize}&name=${name}&type=${type}&sort=${sort}`
      );
      setWait(false);
      if (!response.ok) throw new Error("Failed to fetch users");
      const { users, totalCount } = await response.json();
      setUsers(users);
      setPagination((prev) => ({
        ...prev,
        total: totalCount, // 设置总记录数
        current: page,
        pageSize,
      }));
    } catch (error) {
      setWait(false);
      console.error("Error fetching users:", error);
      message.error("获取用户列表失败");
    }
  };

  const handleTableChange: any = async (pagination: any) => {
    const sortParam = sortConfig.key
      ? `${sortConfig.key}:${sortConfig.order}`
      : '';
      if (hasSearch) {
        await fetchUsers(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchUsers(
          pagination.current,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
    setPagination(pagination); // 保存分页状态
  };
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除该用户吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setWait(true);
        try {
          const response = await fetchWithAuth(`/api/users/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete user');

          const sortParam = sortConfig.key
            ? `${sortConfig.key}:${sortConfig.order}`
            : '';
          if (hasSearch) {
            await fetchUsers(
              pagination.current,
              pagination.pageSize,
              newSearchValue,
              newSearchType,
              sortParam
            );
          } else {
            await fetchUsers(
              pagination.current,
              pagination.pageSize,
              oldSearchValue,
              oldSearchType,
              sortParam
            );
          }
          message.success('用户删除成功');
        } catch (error) {
          console.error('Error deleting user:', error);
          message.error('删除用户失败');
        }
      },
    });
  };

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj as FileType, (url) => {
        setLoading(false);
      });
    }
  };

  const handleOk = async () => {
    try {
      setIsModalVisible(false);
      setWait(true);
      const values = await form.validateFields();

      const userData: any = {
        ...values,
      };

      if (avatarFileName) {
        userData.avatarUrl = avatarFileName;
      }

      const response = editingUser
        ? await fetchWithAuth(`/api/users/${editingUser.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          })
        : await fetchWithAuth("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          });

      if (!response.ok){
        setWait(false);
        throw new Error(
          editingUser ? "Failed to update user" : "Failed to create user"
        );
      }

      form.resetFields();
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : '';
      if (hasSearch) {
        await fetchUsers(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchUsers(
          pagination.current,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
      message.success(editingUser ? "用户更新成功" : "用户添加成功");
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("保存用户失败");
    }
  };

  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 80,
    },
    {
      title: '选择',
      dataIndex: 'id',
      key: 'id',
      render: (_: any, record: { id: string }) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) =>
            setSelectedRowKeys((prev) =>
              e.target.checked
                ? [...prev, record.id]
                : prev.filter((id) => id !== record.id)
            )
          }
        />
      ),
    },
    ...[
      'displayName',
      'email',
      'age',
      'gender',
      'status',
      'role',
      'createdTime',
      'updatedAt',
    ].map((field) => ({
      title: (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: sortConfig.key === field ? 'bold' : 'normal',
            color: sortConfig.key === field ? '#1890ff' : 'inherit',
          }}
          onClick={() => handleSort(field)}
        >
          {field === 'createdTime'
            ? '创建时间'
            : field === 'updatedAt'
            ? '更新时间'
            : field === 'displayName'
            ? '姓名'
            : field === 'email'
            ? '邮箱'
            : field === 'age'
            ? '年龄'
            : field === 'gender'
            ? '性别'
            : field === 'status'
            ? '状态'
            : '角色'}
          {sortConfig.key === field ? (
            sortConfig.order === 'desc' ? (
              <ArrowDownOutlined
                style={{ marginLeft: 5, color: '#1890ff', fontSize: '12px' }}
              />
            ) : (
              <ArrowUpOutlined
                style={{ marginLeft: 5, color: '#1890ff', fontSize: '12px' }}
              />
            )
          ) : (
            <ArrowDownOutlined
              style={{ marginLeft: 5, color: '#666', fontSize: '12px' }}
            />
          )}
        </span>
      ),
      dataIndex: field,
      key: field,
      render: (text: string) => {
        if (
          (field === 'createdAt' ||
          field === 'updatedAt') && text
        ) {
          return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
        }
        if (field === 'role' && text) {
          const status = userRole.find(
            (status) => status.value === text
          );
          return status ? status.label : text;
        }
        return text || '';
      }
    })),
    // {
    //   title: '头像',
    //   dataIndex: 'avatar',
    //   key: 'avatar',
    //   render: (avatar: string) =>
    //     avatar ? (
    //       <Image
    //         src={`https://${process.env.NEXT_PUBLIC_ENDPOINT}/${avatar}`}
    //         alt="avatar"
    //         width={50}
    //         height={50}
    //         style={{ objectFit: 'cover', borderRadius: '50%' }}
    //       />
    //     ) : (
    //       '无'
    //     ),
    // },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            danger
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];
  const triggerSearch = () => {
    setOldSearchValue(newSearchValue);
    setOldSearchType(newSearchType);
    if(hasSearch){
      handleSearch();
    }else {
      setHasSearch(true);
    }
  };

  const handleKeyDown = (event: { key: string }) => {
    if (event.key === 'Enter') {
      triggerSearch();
    }
  };
  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const handleDeleteButtonClick = () => {
    if (selectedRowKeys.length > 0) {
      Modal.confirm({
        title: "确认删除",
        content: "您确定要删除选中的行吗？",
        okText: "确认",
        cancelText: "取消",
        onOk: () => handleBatchDelete(),
      });
    } else {
      message.warning("请选择要删除的行");
    }
  };
  const handleBatchDelete = async () => {
    try {
      setWait(true);
      const response = await fetchWithAuth(`/api/users/batch-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedRowKeys }),
      });
      if (!response.ok) throw new Error("Failed to delete users");
      setSelectedRowKeys([]);
      const sortParam = sortConfig.key
      ? `${sortConfig.key}:${sortConfig.order}`
      : '';
      if (hasSearch) {
        await fetchUsers(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchUsers(
          pagination.current,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
      message.success('批量删除成功');
    } catch (error) {
      setWait(false);
      console.error('Error deleting users:', error);
      message.error('批量删除失败');
    }
  };
  const searchOptions = [
    { label: '综合', value: '' },
    { label: '用户名', value: 'displayName' },
    { label: '邮箱', value: 'usermail' },
    { label: '角色', value: 'role' },
    { label: '状态', value: 'status' },
    { label: '年龄', value: 'age' },
    { label: '创建时间', value: 'createdAt' },
    { label: '更新时间', value: 'updatedAt' },
  ];  
  return (
    <div>
      <Button
        onClick={() => {
          setEditingUser(null);
          form.resetFields();
          setAvatarFileName(null);
          setIsModalVisible(true);
        }}
        type="primary"
        style={{ marginBottom: 16 }}
      >
        添加用户
      </Button>
      <Button
        onClick={handleDeleteButtonClick}
        type="primary"
        danger
        style={{ marginBottom: 16, marginLeft: 10 }}
      >
        批量删除
      </Button>
      <Button
        onClick={() => setBatchCreateModalVisible(true)}
        type="primary"
        style={{ left: '10px', marginBottom: 16 }}
      >
        批量创建用户
      </Button>
      <div>
        <Space.Compact style={{ width: 400 }}>
          <Select
            value={newSearchType}
            onChange={setNewSearchType}
            style={{ width: 120 }}
            options={searchOptions}
          />
          <Input
            type="text"
            placeholder="请输入关键词"
            value={newSearchValue}
            onChange={(e) => {
              setNewSearchValue(e.target.value);
              setHasSearch(false);
            }}
            onKeyDown={(event) => {
              handleKeyDown(event);
            }}
            style={{ flex: 1 }}
          />
          <Button type="primary" onClick={triggerSearch}>
            搜索
          </Button>
        </Space.Compact>
      </div>
      {/* 批量创建用户模态框 */}
      <Modal
        title="批量创建用户"
        open={batchCreateModalVisible}
        onOk={handlBatchCreateUsers}
        onCancel={() => {
          setBatchCreateModalVisible(false);
          form.resetFields();
          setEndId('');
          setStartId('');
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="起始编号" required>
            <Input
              type="text"
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="结束编号" required>
            <Input
              type="text"
              value={endId}
              onChange={(e) => setEndId(e.target.value)}
              // min={startId ? startId + 1 : 2} // 确保结束编号大于起始编号
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total) => `总计${total}条数据`,
        }}
        onChange={handleTableChange} // 处理分页变化
        scroll={{ x: 'max-content' }}
        loading={{ spinning: wait, tip: '加载中...', size: 'large' }}
      />
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="age"
            label="年龄"
            rules={[
              { required: true, message: '请输入年龄' },
              {
                type: 'number',
                min: 0,
                max: 150,
                message: '年龄必须在 0 到 150 之间',
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="选择性别">
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="displayName" label="昵称">
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Select.Option value="active">激活</Select.Option>
              <Select.Option value="inactive">未激活</Select.Option>
              <Select.Option value="suspended">已暂停</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              <Select.Option value="USER">用户</Select.Option>
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="SUPER_ADMIN">超级管理员</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
