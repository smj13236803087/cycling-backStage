import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import prisma from "@/app/lib/prisma";

/**
 * 检查某条骑行数据是否已上传到Strava
 * GET /api/strava/check-upload/[id]
 * 
 * 查询参数：
 * - type: 'record' | 'statistics' (默认: 'record')
 * 
 * 返回：
 * {
 *   uploaded: boolean,        // 是否已上传
 *   activityId?: string,      // Strava活动ID（如果已上传）
 *   message: string           // 状态消息
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'record';

    let rideData: any;

    // 根据类型获取数据
    if (type === 'statistics') {
      rideData = await prisma.rideStatistics.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          userId: true,
          stravaActivityId: true,
          createdTime: true,
          distance: true,
        },
      });
    } else {
      rideData = await prisma.rideRecordRoute.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          userId: true,
          stravaActivityId: true,
          createdTime: true,
          distance: true,
        },
      });
    }

    if (!rideData) {
      return NextResponse.json(
        { error: "未找到骑行记录" },
        { status: 404 }
      );
    }

    // 验证记录是否属于当前用户
    if (rideData.userId !== session.user.id) {
      return NextResponse.json(
        { error: "无权访问此记录" },
        { status: 403 }
      );
    }

    // 检查是否已上传（有stravaActivityId表示已上传）
    const uploaded = !!rideData.stravaActivityId;

    return NextResponse.json({
      uploaded,
      activityId: rideData.stravaActivityId || undefined,
      message: uploaded 
        ? '该骑行数据已上传到Strava' 
        : '该骑行数据尚未上传到Strava',
    });
  } catch (error) {
    console.error('检查Strava上传状态错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

