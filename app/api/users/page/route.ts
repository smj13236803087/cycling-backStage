import prisma from "@/app/lib/prisma";
import { NextResponse } from 'next/server';
import { Prisma, Gender } from '@prisma/client';
import dayjs from 'dayjs';

// 实现后端分页查询和模糊查询
export async function GET(req: Request) {
  const url = new URL(req.url);

  const page = parseInt(url.searchParams.get('page') || '1'); // 当前页码，默认值为 1
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10'); // 每页记录数，默认值为 10
  const name = url.searchParams.get('name'); // 获取模糊查询的内容
  const type = url.searchParams.get('type');
  const sort = url.searchParams.get('sort') || '';

  const userRoleMapping: any = {
    用户: 'USER',
    管理员: 'ADMIN',
    超级管理员: 'SUPER_ADMIN',
  };

  const getMatchingRole = (input: string) => {
    const matchingTypes = Object.keys(userRoleMapping).filter((role) =>
      role.includes(input)
    );
    return matchingTypes.map((role) => userRoleMapping[role]);
  };

  try {
    let whereCondition: Prisma.UserWhereInput = {};

    if (name && !type) {
      const orConditions: Prisma.UserWhereInput[] = [
        { displayName: { contains: name } },
        { email: { contains: name } },
        { region: { contains: name } },
        { status: { contains: name } },
      ];
      const parsedAge = parseFloat(name);
      if (!isNaN(parsedAge)) {
        orConditions.push({
          age: {
            equals: parsedAge,
          },
        });
      }
      const genderMatch = Object.values(Gender).find(g => g.toLowerCase().includes(name.toLowerCase()));
      if (genderMatch) {
        orConditions.push({ gender: genderMatch });
      }
      if (getMatchingRole(name).length > 0) {
        orConditions.push({ role: { in: getMatchingRole(name) } });
      }
      if (dayjs(name).isValid()) {
        orConditions.push({
          OR: [
            {
              createdTime: {
                gte: dayjs(name).startOf('day').toDate(),
                lte: dayjs(name).endOf('day').toDate(),
              },
            },
            {
              updatedAt: {
                gte: dayjs(name).startOf('day').toDate(),
                lte: dayjs(name).endOf('day').toDate(),
              },
            },
          ],
        });
      }

      whereCondition = {
        OR: orConditions,
      };
    } else if (name && type) {
      if (type === 'displayName') {
        whereCondition = {
          displayName: { contains: name },
        };
      } else if (type === 'gender') {
        const genderMatch = Object.values(Gender).find(g => g.toLowerCase() === name.toLowerCase());
        if (genderMatch) {
          whereCondition = {
            gender: genderMatch,
          };
        } else {
          return NextResponse.json({ users: [], totalCount: 0 });
        }
      } else if (type === 'status') {
        whereCondition = {
          status: { contains: name },
        };
      } else if (type === 'usermail') {
        whereCondition = {
          email: { contains: name },
        };
      } else if (type === 'age' && !isNaN(parseFloat(name))) {
        const parsedAge = parseFloat(name);
        whereCondition = {
          age: {
            equals: parsedAge,
          },
        };
      } else if (type === 'role') {
        if (getMatchingRole(name).length > 0) {
          whereCondition = { role: { in: getMatchingRole(name) } };
        } else {
          return NextResponse.json({ users: [], totalCount: 0 });
        }
      } else if (type === 'createdAt') {
        if (dayjs(name).isValid()){
          whereCondition = {
            createdTime: {
              gte: dayjs(name).startOf('day').toDate(),
              lte: dayjs(name).endOf('day').toDate(),
            },
          };
        } else {
          return NextResponse.json({ users: [], totalCount: 0 });
        }
      } else if (type === 'updatedAt') {
        if (dayjs(name).isValid()) {
          whereCondition = {
            updatedAt: {
              gte: dayjs(name).startOf('day').toDate(),
              lte: dayjs(name).endOf('day').toDate(),
            },
          };
        } else {
          return NextResponse.json({ users: [], totalCount: 0 });
        }
      }
    }
    if (type === 'age' && isNaN(parseFloat(name!)) && !!name) {
      return NextResponse.json({ users: [], totalCount: 0 });
    }
    // 设置排序条件，只有当sort非空时才添加排序
    let orderByCondition:
      | Prisma.UserOrderByWithRelationInput
      | Prisma.UserOrderByWithRelationInput[] = [];

    if (sort) {
      const sortFields = sort.split(','); // 可能有多个排序字段
      orderByCondition = sortFields.map((field) => {
        const [key, order] = field.split(':'); // 解析出字段名和排序方式
        return { [key]: order === 'asc' ? 'asc' : 'desc' };
      });
    }

    // 查询用户数据
    const users = await prisma.user.findMany({
      skip: (page - 1) * pageSize, // 计算跳过的记录数
      take: pageSize, // 每页记录数
      where: whereCondition, // 添加查询条件
      select: {
        id: true,
        displayName: true,
        email: true,
        age: true,
        gender: true,
        avatar: true,
        role: true,
        createdTime: true,
        updatedAt: true,
        status: true,
        manualCreatedRoutes: {
          select: {
            user: {
              select: {
                displayName: true,
                email: true,
                id: true,
              },
            },
          },
        },
        rideRecordRoutes: {
          select: {
            user: {
              select: {
                displayName: true,
                email: true,
                id: true,
              },
            },
          },
        },
      },
      orderBy: orderByCondition,
    });

    // 获取总记录数，带上查询条件
    const totalCount = await prisma.user.count({
      where: whereCondition,
    });

    return NextResponse.json({ users, totalCount }); // 返回用户列表和总记录数
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
