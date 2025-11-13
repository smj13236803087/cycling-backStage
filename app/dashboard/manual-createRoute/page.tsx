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
  message,
  Checkbox,
  Select,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { fetchWithAuth } from "@/app/lib/api";
import dayjs from "dayjs";

interface Route {
  id: string;
  startName: string;
  startCoord: string;
  endName: string;
  endCoord: string;
  distance: number;
  duration: string;
  heatConsumption?: number;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  createdTime: string;
}

interface User {
  id: string;
  displayName: string;
  email: string;
}

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
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
      await fetchRoutes(
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
        await fetchRoutes(
          1,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchRoutes(
          1,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
    }
  };

  const fetchRoutes = async (
    page: number = 1,
    pageSize: number = 10,
    keyword: string = "",
    type: string = "",
    sort: string = ""
  ) => {
    try {
      setWait(true);
      const response = await fetchWithAuth(
        `/api/manual-createRoutes/page?page=${page}&pageSize=${pageSize}&keyword=${keyword}&type=${type}&sort=${sort}`
      );
      setWait(false);
      if (!response.ok) throw new Error("Failed to fetch routes");
      const { routes, totalCount } = await response.json();
      setRoutes(routes);
      setPagination((prev) => ({
        ...prev,
        total: totalCount,
        current: page,
        pageSize,
      }));
    } catch (error) {
      setWait(false);
      console.error("Error fetching routes:", error);
      message.error("获取路线列表失败");
    }
  };

  const handleTableChange = async (paginationConfig: any) => {
    const sortParam = sortConfig.key
      ? `${sortConfig.key}:${sortConfig.order}`
      : "";
    if (hasSearch) {
      await fetchRoutes(
        paginationConfig.current,
        paginationConfig.pageSize,
        newSearchValue,
        newSearchType,
        sortParam
      );
    } else {
      await fetchRoutes(
        paginationConfig.current,
        paginationConfig.pageSize,
        oldSearchValue,
        oldSearchType,
        sortParam
      );
    }
    setPagination(paginationConfig);
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    form.setFieldsValue({
      startName: route.startName,
      startCoord: route.startCoord,
      endName: route.endName,
      endCoord: route.endCoord,
      distance: route.distance,
      duration: route.duration,
      heatConsumption: route.heatConsumption,
      userId: route.user.id,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "您确定要删除该路线吗？",
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        setWait(true);
        try {
          const response = await fetchWithAuth(`/api/manual-createRoutes/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete route");

          const sortParam = sortConfig.key
            ? `${sortConfig.key}:${sortConfig.order}`
            : "";
          if (hasSearch) {
            await fetchRoutes(
              pagination.current,
              pagination.pageSize,
              newSearchValue,
              newSearchType,
              sortParam
            );
          } else {
            await fetchRoutes(
              pagination.current,
              pagination.pageSize,
              oldSearchValue,
              oldSearchType,
              sortParam
            );
          }
          message.success("路线删除成功");
        } catch (error) {
          console.error("Error deleting route:", error);
          message.error("删除路线失败");
        }
      },
    });
  };

  const handleOk = async () => {
    try {
      setIsModalVisible(false);
      setWait(true);
      const values = await form.validateFields();

      const response = editingRoute
        ? await fetchWithAuth(`/api/manual-createRoutes/${editingRoute.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          })
        : await fetchWithAuth("/api/manual-createRoutes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          });

      if (!response.ok) {
        setWait(false);
        throw new Error(
          editingRoute ? "Failed to update route" : "Failed to create route"
        );
      }

      form.resetFields();
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : "";
      if (hasSearch) {
        await fetchRoutes(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchRoutes(
          pagination.current,
          pagination.pageSize,
          oldSearchValue,
          oldSearchType,
          sortParam
        );
      }
      message.success(editingRoute ? "路线更新成功" : "路线添加成功");
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("保存路线失败");
    }
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
      "startName",
      "endName",
      "distance",
      "duration",
      "heatConsumption",
      "createdTime",
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
          {field === "startName"
            ? "起点"
            : field === "endName"
            ? "终点"
            : field === "distance"
            ? "距离(米)"
            : field === "duration"
            ? "时长"
            : field === "heatConsumption"
            ? "热量消耗(kcal)"
            : "创建时间"}
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
      render: (text: string) => {
        if (field === "createdTime" && text) {
          return dayjs(text).format("YYYY-MM-DD HH:mm:ss");
        }
        return text || "";
      },
    })),
    {
      title: "创建者",
      dataIndex: ["user", "displayName"],
      key: "creator",
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Route) => (
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
      const response = await fetchWithAuth(`/api/manual-createRoutes/batch-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedRowKeys }),
      });
      if (!response.ok) throw new Error("Failed to delete routes");
      setSelectedRowKeys([]);
      const sortParam = sortConfig.key
        ? `${sortConfig.key}:${sortConfig.order}`
        : "";
      if (hasSearch) {
        await fetchRoutes(
          pagination.current,
          pagination.pageSize,
          newSearchValue,
          newSearchType,
          sortParam
        );
      } else {
        await fetchRoutes(
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
      console.error("Error deleting routes:", error);
      message.error("批量删除失败");
    }
  };

  const searchOptions = [
    { label: "综合", value: "" },
    { label: "起点", value: "startName" },
    { label: "终点", value: "endName" },
    { label: "创建者", value: "creator" },
  ];

  return (
    <div>
      <Button
        onClick={() => {
          setEditingRoute(null);
          form.resetFields();
          setIsModalVisible(true);
        }}
        type="primary"
        style={{ marginBottom: 16 }}
      >
        添加路线
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
        dataSource={routes}
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
        title={editingRoute ? "编辑路线" : "添加路线"}
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
            label="指定用户"
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
            name="startName"
            label="起点名称"
            rules={[{ required: true, message: "请输入起点名称" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="startCoord"
            label="起点坐标"
            rules={[{ required: true, message: "请输入起点坐标（lat,lng）" }]}
          >
            <Input placeholder="例如: 39.9042,116.4074" />
          </Form.Item>
          <Form.Item
            name="endName"
            label="终点名称"
            rules={[{ required: true, message: "请输入终点名称" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="endCoord"
            label="终点坐标"
            rules={[{ required: true, message: "请输入终点坐标（lat,lng）" }]}
          >
            <Input placeholder="例如: 39.9042,116.4074" />
          </Form.Item>
          <Form.Item
            name="distance"
            label="距离(米)"
            rules={[{ required: true, message: "请输入距离" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="duration"
            label="时长"
            rules={[{ required: true, message: "请输入时长" }]}
          >
            <Input placeholder="例如: 01:30:00" />
          </Form.Item>
          <Form.Item name="heatConsumption" label="热量消耗(kcal)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
