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

export default function FollowsManagement() {
  const [follows, setFollows] = useState<Follow[]>([]);
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
    fetchFollows();
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
    { label: "关注者", value: "follower" },
    { label: "被关注者", value: "following" },
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
    </div>
  );
}

