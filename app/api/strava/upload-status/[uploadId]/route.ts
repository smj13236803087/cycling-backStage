import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { getStravaAccessToken } from "@/app/lib/strava";

/**
 * 检查Strava上传状态
 * GET /api/strava/upload-status/[uploadId]
 * 
 * 用于轮询检查上传是否完成，获取activityId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      );
    }

    const accessToken = await getStravaAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "未连接Strava账户，请先授权", requiresAuth: true },
        { status: 401 }
      );
    }

    const uploadId = params.uploadId;
    console.log('🔍 查询上传状态，uploadId:', uploadId);

    // 查询上传状态
    const statusResponse = await fetch(`https://www.strava.com/api/v3/uploads/${uploadId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.text();
      console.error('查询上传状态失败:', statusResponse.status, errorData);
      
      return NextResponse.json(
        { error: '查询上传状态失败', details: errorData },
        { status: statusResponse.status }
      );
    }

    const statusResult = await statusResponse.json();
    
    console.log('📊 上传状态查询结果:', JSON.stringify(statusResult, null, 2));

    return NextResponse.json({
      uploadId: statusResult.id || statusResult.id_str || uploadId,
      activityId: statusResult.activity_id || null,
      status: statusResult.status || null,
      error: statusResult.error || null,
      completed: !!statusResult.activity_id,
      message: statusResult.activity_id 
        ? '活动已处理完成' 
        : statusResult.error
        ? `处理出错: ${statusResult.error}`
        : '活动正在处理中',
    });
  } catch (error) {
    console.error('查询上传状态错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

