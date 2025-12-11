import { NextRequest, NextResponse } from "next/server";
import { getStravaAccessToken } from "@/app/lib/strava";
import { generateGPX, parseCoordinate } from "@/app/lib/gpx-generator";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helper";

/**
 * 从数据库记录上传骑行数据到Strava
 * POST /api/strava/upload/[id]
 * 
 * 支持两种类型的记录：
 * - RideRecordRoute: 使用 id 作为参数
 * - RideStatistics: 使用 id 作为参数
 * 
 * 查询参数：
 * - type: 'record' | 'statistics' (默认: 'record')
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const accessToken = await getStravaAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "未连接Strava账户,请先授权", requiresAuth: true },
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
      });
    } else {
      rideData = await prisma.rideRecordRoute.findUnique({
        where: { id: params.id },
      });
    }

    if (!rideData) {
      return NextResponse.json(
        { error: "未找到骑行记录" },
        { status: 404 }
      );
    }

    // 验证记录是否属于当前用户
    if (rideData.userId !== user.id) {
      return NextResponse.json(
        { error: "无权访问此记录" },
        { status: 403 }
      );
    }

    // 准备数据
    const route = rideData.route as Array<{ lat: number; lng: number; elevation?: number }> | null;
    const startCoord = parseCoordinate(rideData.startCoordinate);
    const endCoord = parseCoordinate(rideData.endCoordinate);
    const startDate = rideData.createdTime;

    // 生成活动名称
    const activityName = `骑行活动 ${startDate.toLocaleString('zh-CN')}`;

    // 准备路线数据
    let finalRoute = route;
    if (!finalRoute || finalRoute.length === 0) {
      // 如果没有详细路线，使用起点和终点
      finalRoute = [];
      if (startCoord) {
        finalRoute.push(startCoord);
      }
      if (endCoord && endCoord.lat !== startCoord?.lat && endCoord.lng !== startCoord?.lng) {
        finalRoute.push(endCoord);
      }
    }

    if (finalRoute.length === 0) {
      return NextResponse.json(
        { error: "缺少路线数据，无法上传" },
        { status: 400 }
      );
    }

    // 生成GPX
    const gpxContent = generateGPX({
      route: finalRoute,
      startTime: startDate,
      distance: rideData.distance,
      duration: rideData.duration,
      elevation: rideData.elevation || null,
      avgSpeed: rideData.avgSpeed || null,
    }, activityName);

    // 上传到Strava
    try {
      const formData = new FormData();
      const gpxBuffer = Buffer.from(gpxContent, 'utf-8');
      const gpxBlob = new Blob([gpxBuffer], { type: 'application/gpx+xml' });
      formData.append('file', gpxBlob, 'activity.gpx');
      formData.append('name', activityName);
      formData.append('data_type', 'gpx');
      formData.append('sport_type', 'Ride');

      console.log('发送上传请求到Strava...');
      const uploadResponse = await fetch('https://www.strava.com/api/v3/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });
      
      console.log('Strava响应状态:', uploadResponse.status, uploadResponse.statusText);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        console.error('Strava上传失败:', errorData);
        
        let errorMessage = '上传失败';
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorData || errorMessage;
        }

        return NextResponse.json(
          { error: errorMessage, details: errorData },
          { status: uploadResponse.status }
        );
      }

      let uploadResult = await uploadResponse.json();
      
      // 如果没有立即获得activityId，尝试轮询获取
      const uploadId = uploadResult.id || uploadResult.id_str;
      if (!uploadResult.activity_id && uploadId) {
        console.log('开始轮询上传状态,uploadId:', uploadId);
        const maxAttempts = 5; // 最多轮询5次
        const pollInterval = 2000; // 每次间隔2秒
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          console.log(`轮询第 ${attempt}/${maxAttempts} 次...`);
          
          // 等待间隔
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          
          // 查询上传状态
          try {
            const statusResponse = await fetch(`https://www.strava.com/api/v3/uploads/${uploadId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
            
            if (statusResponse.ok) {
              uploadResult = await statusResponse.json();
              console.log(`轮询结果 (第${attempt}次):`, JSON.stringify(uploadResult, null, 2));
              
              if (uploadResult.activity_id) {
                console.log('轮询成功获得activityId:', uploadResult.activity_id);
                break;
              }
              
              // 如果状态是错误，停止轮询
              if (uploadResult.error) {
                console.error('上传处理出错:', uploadResult.error);
                break;
              }
            } else {
              console.error(`查询状态失败 (第${attempt}次):`, statusResponse.status, statusResponse.statusText);
            }
          } catch (pollError) {
            console.error(`轮询过程出错 (第${attempt}次):`, pollError);
          }
        }
        
        if (!uploadResult.activity_id) {
          console.log('轮询超时，未获得activityId，前端需要继续轮询');
        }
      }
      
      // 如果上传成功且有activityId，保存到数据库
      if (uploadResult.activity_id) {
        console.log(`准备保存activityId到数据库: ${uploadResult.activity_id}, 类型: ${type}, 记录ID: ${params.id}`);
        try {
          if (type === 'statistics') {
            const updateResult = await prisma.rideStatistics.update({
              where: { id: params.id },
              data: { stravaActivityId: String(uploadResult.activity_id) },
            });
            console.log('成功保存到RideStatistics:', updateResult.id, 'stravaActivityId:', updateResult.stravaActivityId);
          } else {
            const updateResult = await prisma.rideRecordRoute.update({
              where: { id: params.id },
              data: { stravaActivityId: String(uploadResult.activity_id) },
            });
            console.log('成功保存到RideRecordRoute:', updateResult.id, 'stravaActivityId:', updateResult.stravaActivityId);
          }
        } catch (dbError) {
          console.error('保存Strava活动ID到数据库失败:', dbError);
          console.error('错误详情:', dbError instanceof Error ? dbError.message : String(dbError));
          // 即使保存失败，也返回成功，因为上传已经成功
        }
      } else {
        console.log('上传响应中没有activityId,可能正在处理中');
      }
      
      const responseData = {
        success: true,
        uploadId: uploadResult.id,
        activityId: uploadResult.activity_id,
        status: uploadResult.status,
        message: uploadResult.activity_id 
          ? '活动已成功上传' 
          : '活动正在处理中，请稍后查看',
      };
      
      console.log('返回给前端的响应:', JSON.stringify(responseData, null, 2));
      
      return NextResponse.json(responseData);
    } catch (error) {
      console.error('上传过程出错:', error);
      return NextResponse.json(
        { error: '上传失败', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Strava上传接口错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

