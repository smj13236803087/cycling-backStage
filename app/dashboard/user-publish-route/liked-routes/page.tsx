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

interface LikedRoute {
  id: string;
  userId: string;
  routeId: string;
  createdAt: string;
  route: {
    id: string;
    startName: string;
    endName: string;
    distance: number;
    duration: string;
    createdTime: string;
    user: {
      id: string;
      displayName: string;
      email: string;
    };
  };
  user: {
    id: string;
    displayName: string;
    email: string;
  };
}

interface User {
  id: string;
  displayName: string;
  email: string;
}

interface Route {
  id: string;
  startName: string;
  endName: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
}

export default function LikedRoutesManagement() {
  const [likedRoutes, setLikedRoutes] = useState<LikedRoute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingLike, setEditingLike] = useState<LikedRoute | null>(null);
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
    fetchRoutes();
    fetchLikedRoutes();
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

  const fetchRoutes = async () => {
    try {
      const response = await fetchWithAuth("/api/user-publish-routes");
      if (!response.ok) throw new Error("Failed to fetch routes");
      const routeList = await response.json();
      setRoutes(routeList);
    } catch (error) {
      console.error("Error fetching routes:", error);
      message.error("获取路线列表失败");
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
      await fetchLikedRoutes(
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
        await fetchLikedRoutes(
          1,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchLikedRoutes(
          1,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
    }
  };

  const fetchLikedRoutes = async (
    page: number = 1,
    pageSize: number = 10,
    keyword: string = "",
    type: string = "",
    sort: string = ""
  ) => {
    try {
      setWait(true);
      const response = await fetchWithAuth(
        `/api/route-likes/page?page=${page}&pageSize=${pageSize}&keyword=${keyword}&type=${type}&sort=${sort}`
      );
      setWait(false);
      if (!response.ok) throw new Error("Failed to fetch liked routes");
      const { likedRoutes, totalCount } = await response.json();
      setLikedRoutes(likedRoutes);
      setPagination((prev) => ({
        ...prev,
        total: totalCount,
        current: page,
        pageSize,
      }));
    } catch (error) {
      setWait(false);
      console.error("Error fetching liked routes:", error);
      message.error("获取点赞列表失败");
    }
  };

  const handleTableChange = async (paginationConfig: any) => {
    const sortParam = sortConfig.key
      ? `${sortConfig.key}:${sortConfig.order}`
      : "";
    if (hasSearch) {
      await fetchLikedRoutes(
        paginationConfig.current,
        paginationConfig.pageSize,
        newSearchValue,
        newSearchType,
        sortParam
      );
    } else {
      await fetchLikedRoutes(
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
    ...[
      "createdAt",
      "startName",
      "endName",
      "distance",
      "duration",
      "routeCreatedTime",
    ].map((field) => ({
      title: (
        <span
          style={{
            cursor: "pointer",
            fontWeight: sortConfig.key === field ? "bold" : "normal",
            color: sortConfig.key === field ? "#1890ff" : "inherit",
          }}
          onClick={() => handleSort(field)}
        >
          {field === "createdAt"
            ? "点赞时间"
            : field === "startName"
            ? "起点"
            : field === "endName"
            ? "终点"
            : field === "distance"
            ? "距离(公里)"
            : field === "duration"
            ? "时长"
            : "路线创建时间"}
          {sortConfig.key === field ? (
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
      dataIndex: field,
      key: field,
      render: (text: string, record: LikedRoute) => {
        if (field === "createdAt" && text) {
          return dayjs(text).format("YYYY-MM-DD HH:mm:ss");
        }
        if (field === "routeCreatedTime" && record.route?.createdTime) {
          return dayjs(record.route.createdTime).format("YYYY-MM-DD HH:mm:ss");
        }
        if (field === "startName") {
          return record.route?.startName || "";
        }
        if (field === "endName") {
          return record.route?.endName || "";
        }
        if (field === "distance") {
          return record.route?.distance ? `${(record.route.distance / 1000).toFixed(2)}` : "";
        }
        if (field === "duration") {
          return record.route?.duration || "";
        }
        return text || "";
      },
    })),
    {
      title: "点赞用户",
      key: "user",
      render: (_: any, record: LikedRoute) => (
        <div>
          <div>{record.user?.displayName || ""}</div>
          <div style={{ color: "#999", fontSize: "12px" }}>
            {record.user?.email || ""}
          </div>
        </div>
      ),
    },
    {
      title: "路线创建者",
      key: "routeCreator",
      render: (_: any, record: LikedRoute) => (
        <div>
          <div>{record.route?.user?.displayName || ""}</div>
          <div style={{ color: "#999", fontSize: "12px" }}>
            {record.route?.user?.email || ""}
          </div>
        </div>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: LikedRoute) => (
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

  const handleEdit = (like: LikedRoute) => {
    setEditingLike(like);
    form.setFieldsValue({
      userId: like.userId,
      routeId: like.routeId,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "您确定要删除该点赞记录吗？",
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        setWait(true);
        try {
          const response = await fetchWithAuth(`/api/route-likes/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete like");

          const sortParam = sortConfig.key
            ? `${sortConfig.key}:${sortConfig.order}`
            : "";
          if (hasSearch) {
            await fetchLikedRoutes(
              pagination.current,
              pagination.pageSize,
              newSearchValue,
              newSearchType,
              sortParam
            );
          } else {
            await fetchLikedRoutes(
              pagination.current,
              pagination.pageSize,
              oldSearchValue,
              oldSearchType,
              sortParam
            );
          }
          message.success("点赞记录删除成功");
        } catch (error) {
          console.error("Error deleting like:", error);
          message.error("删除点赞记录失败");
        }
      },
    });
  };

  const handleOk = async () => {
    try {
      setIsModalVisible(false);
      setWait(true);
      const values = await form.validateFields();

      const response = editingLike
        ? await fetchWithAuth(`/api/route-likes/${editingLike.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          })
        : await fetchWithAuth("/api/route-likes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          });

      if (!response.ok) {
        setWait(false);
        throw new Error(
          editingLike ? "Failed to update like" : "Failed to create like"
        );
      }

      form.resetFields();
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : "";
      if (hasSearch) {
        await fetchLikedRoutes(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchLikedRoutes(
          pagination.current,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
      message.success(editingLike ? "点赞记录更新成功" : "点赞记录添加成功");
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("保存点赞记录失败");
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
      const response = await fetchWithAuth(`/api/route-likes/batch-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedRowKeys }),
      });
      if (!response.ok) throw new Error("Failed to delete likes");
      setSelectedRowKeys([]);
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : "";
      if (hasSearch) {
        await fetchLikedRoutes(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchLikedRoutes(
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
      console.error("Error deleting likes:", error);
      message.error("批量删除失败");
    }
  };

  const searchOptions = [
    { label: "综合", value: "" },
    { label: "点赞用户", value: "user" },
    { label: "路线创建者", value: "routeCreator" },
    { label: "起点", value: "startName" },
    { label: "终点", value: "endName" },
  ];

  return (
    <div>
      <Button
        onClick={() => {
          setEditingLike(null);
          form.resetFields();
          setIsModalVisible(true);
        }}
        type="primary"
        style={{ marginBottom: 16 }}
      >
        添加点赞记录
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
        dataSource={likedRoutes}
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
        title={editingLike ? "编辑点赞记录" : "添加点赞记录"}
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
            name="userId"
            label="点赞用户"
            rules={[{ required: true, message: "请选择用户" }]}
          >
            <Select placeholder="选择用户">
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.displayName} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="routeId"
            label="路线"
            rules={[{ required: true, message: "请选择路线" }]}
          >
            <Select placeholder="选择路线">
              {routes.map((route) => (
                <Select.Option key={route.id} value={route.id}>
                  {route.startName} → {route.endName} ({route.user.displayName})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

