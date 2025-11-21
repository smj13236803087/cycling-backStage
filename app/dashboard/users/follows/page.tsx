"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  Modal,
  Form,
  Select,
  message,
  Checkbox,
  Input,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { fetchWithAuth } from "@/app/lib/api";
import dayjs from "dayjs";

interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  follower: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
  };
  following: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
  };
}

interface User {
  id: string;
  displayName: string;
  email: string;
}

export default function FollowsManagement() {
  const [follows, setFollows] = useState<Follow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingFollow, setEditingFollow] = useState<Follow | null>(null);
  const [wait, setWait] = useState(false);
  const [isSort, setIsSort] = useState(false);
  const [newSearchType, setNewSearchType] = useState("");
  const [oldSearchType, setOldSearchType] = useState("");
  const [newSearchValue, setNewSearchValue] = useState("");
  const [oldSearchValue, setOldSearchValue] = useState("");
  const [hasSearch, setHasSearch] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    order: "asc" | "desc" | null;
  }>({
    key: "",
    order: null,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    if (isSort) {
      handleSearch();
      setIsSort(false);
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
    fetchFollows();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const userList = await response.json();
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("获取用户列表失败");
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, order: prev.order === "desc" ? "asc" : "desc" };
      } else {
        return { key, order: "desc" };
      }
    });
    setIsSort(true);
  };

  const handleSearch = async () => {
    if (!isSort) {
      setSortConfig({ key: "", order: null });
      await fetchFollows(
        1,
        pagination.pageSize,
        newSearchValue,
        newSearchType,
        ""
      );
    } else {
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : "";
      if (hasSearch) {
        await fetchFollows(
          1,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchFollows(
          1,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
    }
  };

  const fetchFollows = async (
    page: number = 1,
    pageSize: number = 10,
    keyword: string = "",
    type: string = "",
    sort: string = ""
  ) => {
    try {
      setWait(true);
      const response = await fetchWithAuth(
        `/api/users/follows?page=${page}&pageSize=${pageSize}&keyword=${keyword}&type=${type}&sort=${sort}`
      );
      setWait(false);
      if (!response.ok) throw new Error("Failed to fetch follows");
      const { follows, totalCount } = await response.json();
      setFollows(follows);
      setPagination((prev) => ({
        ...prev,
        total: totalCount,
        current: page,
        pageSize,
      }));
    } catch (error) {
      setWait(false);
      console.error("Error fetching follows:", error);
      message.error("获取关注列表失败");
    }
  };

  const handleTableChange = async (paginationConfig: any) => {
    const sortParam = sortConfig.key
      ? `${sortConfig.key}:${sortConfig.order}`
      : "";
    if (hasSearch) {
      await fetchFollows(
        paginationConfig.current,
        paginationConfig.pageSize,
        newSearchValue,
        newSearchType,
        sortParam
      );
    } else {
      await fetchFollows(
        paginationConfig.current,
        paginationConfig.pageSize,
        oldSearchValue,
        oldSearchType,
        sortParam
      );
    }
    setPagination(paginationConfig);
  };

  const columns = [
    {
      title: "序号",
      dataIndex: "index",
      key: "index",
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 80,
    },
    {
      title: "选择",
      dataIndex: "id",
      key: "id",
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
    {
      title: (
        <span
          style={{
            cursor: "pointer",
            fontWeight: sortConfig.key === "createdAt" ? "bold" : "normal",
            color: sortConfig.key === "createdAt" ? "#1890ff" : "inherit",
          }}
          onClick={() => handleSort("createdAt")}
        >
          关注时间
          {sortConfig.key === "createdAt" ? (
            sortConfig.order === "desc" ? (
              <ArrowDownOutlined
                style={{ marginLeft: 5, color: "#1890ff", fontSize: "12px" }}
              />
            ) : (
              <ArrowUpOutlined
                style={{ marginLeft: 5, color: "#1890ff", fontSize: "12px" }}
              />
            )
          ) : (
            <ArrowDownOutlined
              style={{ marginLeft: 5, color: "#666", fontSize: "12px" }}
            />
          )}
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => {
        if (text) {
          return dayjs(text).format("YYYY-MM-DD HH:mm:ss");
        }
        return "";
      },
    },
    {
      title: "关注者",
      key: "follower",
      render: (_: any, record: Follow) => (
        <div>
          <div>{record.follower.displayName}</div>
          <div style={{ color: "#999", fontSize: "12px" }}>
            {record.follower.email}
          </div>
        </div>
      ),
    },
    {
      title: "被关注者",
      key: "following",
      render: (_: any, record: Follow) => (
        <div>
          <div>{record.following.displayName}</div>
          <div style={{ color: "#999", fontSize: "12px" }}>
            {record.following.email}
          </div>
        </div>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Follow) => (
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
    if (hasSearch) {
      handleSearch();
    } else {
      setHasSearch(true);
    }
  };

  const handleKeyDown = (event: { key: string }) => {
    if (event.key === "Enter") {
      triggerSearch();
    }
  };

  const handleEdit = (follow: Follow) => {
    setEditingFollow(follow);
    form.setFieldsValue({
      followerId: follow.followerId,
      followingId: follow.followingId,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "您确定要删除该关注关系吗？",
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        setWait(true);
        try {
          const response = await fetchWithAuth(`/api/users/follows/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete follow");

          const sortParam = sortConfig.key
            ? `${sortConfig.key}:${sortConfig.order}`
            : "";
          if (hasSearch) {
            await fetchFollows(
              pagination.current,
              pagination.pageSize,
              newSearchValue,
              newSearchType,
              sortParam
            );
          } else {
            await fetchFollows(
              pagination.current,
              pagination.pageSize,
              oldSearchValue,
              oldSearchType,
              sortParam
            );
          }
          message.success("关注关系删除成功");
        } catch (error) {
          console.error("Error deleting follow:", error);
          message.error("删除关注关系失败");
        }
      },
    });
  };

  const handleOk = async () => {
    try {
      setIsModalVisible(false);
      setWait(true);
      const values = await form.validateFields();

      const response = editingFollow
        ? await fetchWithAuth(`/api/users/follows/${editingFollow.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          })
        : await fetchWithAuth("/api/users/follows", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          });

      if (!response.ok) {
        setWait(false);
        throw new Error(
          editingFollow ? "Failed to update follow" : "Failed to create follow"
        );
      }

      form.resetFields();
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : "";
      if (hasSearch) {
        await fetchFollows(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchFollows(
          pagination.current,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
      message.success(editingFollow ? "关注关系更新成功" : "关注关系添加成功");
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("保存关注关系失败");
    }
  };

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
      const response = await fetchWithAuth(`/api/users/follows/batch-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedRowKeys }),
      });
      if (!response.ok) throw new Error("Failed to delete follows");
      setSelectedRowKeys([]);
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : "";
      if (hasSearch) {
        await fetchFollows(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchFollows(
          pagination.current,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
      message.success("批量删除成功");
    } catch (error) {
      setWait(false);
      console.error("Error deleting follows:", error);
      message.error("批量删除失败");
    }
  };

  const searchOptions = [
    { label: "综合", value: "" },
    { label: "关注者", value: "follower" },
    { label: "被关注者", value: "following" },
  ];

  return (
    <div>
      <Button
        onClick={() => {
          setEditingFollow(null);
          form.resetFields();
          setIsModalVisible(true);
        }}
        type="primary"
        style={{ marginBottom: 16 }}
      >
        添加关注关系
      </Button>
      <Button
        onClick={handleDeleteButtonClick}
        type="primary"
        danger
        style={{ marginBottom: 16, marginLeft: 10 }}
      >
        批量删除
      </Button>
      <div style={{ marginBottom: 16 }}>
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
      <Table
        columns={columns}
        dataSource={follows}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total) => `总计${total}条数据`,
        }}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        loading={{ spinning: wait, tip: "加载中...", size: "large" }}
      />
      <Modal
        title={editingFollow ? "编辑关注关系" : "添加关注关系"}
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
            name="followerId"
            label="关注者"
            rules={[{ required: true, message: "请选择关注者" }]}
          >
            <Select placeholder="选择关注者">
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.displayName} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="followingId"
            label="被关注者"
            rules={[{ required: true, message: "请选择被关注者" }]}
          >
            <Select placeholder="选择被关注者">
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.displayName} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

