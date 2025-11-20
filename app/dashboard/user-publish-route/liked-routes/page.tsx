"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  message,
  Checkbox,
  Select,
  Input,
} from "antd";
import {
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

export default function LikedRoutesManagement() {
  const [likedRoutes, setLikedRoutes] = useState<LikedRoute[]>([]);
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
    fetchLikedRoutes();
  }, []);

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

  const searchOptions = [
    { label: "综合", value: "" },
    { label: "点赞用户", value: "user" },
    { label: "路线创建者", value: "routeCreator" },
    { label: "起点", value: "startName" },
    { label: "终点", value: "endName" },
  ];

  return (
    <div>
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
    </div>
  );
}

