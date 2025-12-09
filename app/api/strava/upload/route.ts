import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { getStravaAccessToken } from "@/app/lib/strava";
import { generateGPX, parseCoordinate } from "@/app/lib/gpx-generator";

/**
 * 上传骑行数据到Strava
 * POST /api/strava/upload
 * 
 * 请求体格式：
 * {
 *   route?: Array<{lat: number, lng: number, elevation?: number}> | null,  // 路线坐标点数组
 *   startCoordinate?: string,  // 起点坐标 "lat,lng"
 *   endCoordinate?: string,    // 终点坐标 "lat,lng"
 *   startTime: string,         // ISO格式的开始时间
 *   distance: number,          // 距离（米）
 *   duration: number,          // 持续时间（秒）
 *   elevation?: number,        // 总爬升（米）
 *   avgSpeed?: number,         // 平均速度（米/秒）
 *   name?: string,            // 活动名称（可选）
 *   description?: string,     // 活动描述（可选）
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      );
    }

    // 获取有效的Strava access token
    const accessToken = await getStravaAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "未连接Strava账户，请先授权", requiresAuth: true },
        { status: 401 }
      );
    }

    // 解析请求数据
    const body = await request.json();
    const {
      route,
      startCoordinate,
      endCoordinate,
      startTime,
      distance,
      duration,
      elevation,
      avgSpeed,
      name,
      description,
    } = body;

    // 验证必需字段
    if (!startTime || distance === undefined || duration === undefined) {
      return NextResponse.json(
        { error: "缺少必需字段：startTime, distance, duration" },
        { status: 400 }
      );
    }

    // 准备开始时间
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: "无效的开始时间格式" },
        { status: 400 }
      );
    }

    // 活动名称
    const activityName = name || `骑行活动 ${startDate.toLocaleString('zh-CN')}`;

    // 如果有详细的路线数据，使用GPX文件上传
    if (route && Array.isArray(route) && route.length > 0) {
      try {
        // 生成GPX文件
        const gpxContent = generateGPX({
          route,
          startTime: startDate,
          distance,
          duration,
          elevation: elevation || null,
          avgSpeed: avgSpeed || null,
        }, activityName);

        // 创建FormData上传GPX文件
        // 在Node.js环境中，使用Buffer创建文件内容
        const formData = new FormData();
        const gpxBuffer = Buffer.from(gpxContent, 'utf-8');
        const gpxBlob = new Blob([gpxBuffer], { type: 'application/gpx+xml' });
        formData.append('file', gpxBlob, 'activity.gpx');
        formData.append('name', activityName);
        formData.append('data_type', 'gpx');
        formData.append('sport_type', 'Ride');
        if (description) {
          formData.append('description', description);
        }

        // 调用Strava上传API
        const uploadResponse = await fetch('https://www.strava.com/api/v3/uploads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.text();
          console.error('Strava上传失败:', errorData);
          
          // 尝试解析错误信息
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

        const uploadResult = await uploadResponse.json();
        
        return NextResponse.json({
          success: true,
          uploadId: uploadResult.id,
          activityId: uploadResult.activity_id,
          status: uploadResult.status,
          message: uploadResult.activity_id 
            ? '活动已成功上传' 
            : '活动正在处理中，请稍后查看',
        });
      } catch (error) {
        console.error('GPX上传过程出错:', error);
        return NextResponse.json(
          { error: '生成或上传GPX文件失败', details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    } else {
      // 如果没有详细路线，使用参数方式上传
      // 注意：Strava的参数上传需要至少有一个GPS点，所以我们使用起点和终点
      const startCoord = startCoordinate ? parseCoordinate(startCoordinate) : null;
      const endCoord = endCoordinate ? parseCoordinate(endCoordinate) : null;

      if (!startCoord) {
        return NextResponse.json(
          { error: '缺少起点坐标信息，无法上传' },
          { status: 400 }
        );
      }

      // 如果没有详细路线但有起点和终点，创建一个简单的GPX
      const simpleRoute = [startCoord];
      if (endCoord) {
        simpleRoute.push(endCoord);
      }

      const gpxContent = generateGPX({
        route: simpleRoute,
        startTime: startDate,
        distance,
        duration,
        elevation: elevation || null,
        avgSpeed: avgSpeed || null,
      }, activityName);

      try {
        const formData = new FormData();
        const gpxBuffer = Buffer.from(gpxContent, 'utf-8');
        const gpxBlob = new Blob([gpxBuffer], { type: 'application/gpx+xml' });
        formData.append('file', gpxBlob, 'activity.gpx');
        formData.append('name', activityName);
        formData.append('data_type', 'gpx');
        formData.append('sport_type', 'Ride');
        if (description) {
          formData.append('description', description);
        }

        const uploadResponse = await fetch('https://www.strava.com/api/v3/uploads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

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

        const uploadResult = await uploadResponse.json();
        
        return NextResponse.json({
          success: true,
          uploadId: uploadResult.id,
          activityId: uploadResult.activity_id,
          status: uploadResult.status,
          message: uploadResult.activity_id 
            ? '活动已成功上传' 
            : '活动正在处理中，请稍后查看',
        });
      } catch (error) {
        console.error('上传过程出错:', error);
        return NextResponse.json(
          { error: '上传失败', details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Strava上传接口错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

