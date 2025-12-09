/**
 * GPX文件生成工具
 * 将骑行数据转换为GPX格式
 */

interface Coordinate {
  lat: number;
  lng: number;
  elevation?: number;
  time?: Date;
}

interface RideData {
  route?: Coordinate[] | null;
  startTime: Date | string;
  distance: number; // 单位：米
  duration: number; // 单位：秒
  elevation?: number | null;
  avgSpeed?: number | null;
}

/**
 * 生成GPX格式的XML字符串
 */
export function generateGPX(rideData: RideData, activityName?: string): string {
  const { route, startTime, distance, duration, elevation } = rideData;
  
  const startDate = startTime instanceof Date ? startTime : new Date(startTime);
  const name = activityName || `骑行活动 ${startDate.toLocaleString('zh-CN')}`;
  
  // GPX头部
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Cycling App" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXML(name)}</name>
    <time>${startDate.toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXML(name)}</name>
    <type>Ride</type>
    <trkseg>`;

  // 如果有路线数据，添加轨迹点
  if (route && Array.isArray(route) && route.length > 0) {
    const timeInterval = duration / route.length; // 每个点之间的时间间隔（秒）
    
    route.forEach((point, index) => {
      const pointTime = new Date(startDate.getTime() + index * timeInterval * 1000);
      const lat = point.lat;
      const lng = point.lng;
      const ele = point.elevation !== undefined ? point.elevation : (elevation || null);
      
      gpx += `
      <trkpt lat="${lat}" lon="${lng}">`;
      
      if (ele !== null && ele !== undefined) {
        gpx += `
        <ele>${ele}</ele>`;
      }
      
      gpx += `
        <time>${pointTime.toISOString()}</time>
      </trkpt>`;
    });
  } else {
    // 如果没有详细路线，至少添加起点和终点（从startCoordinate和endCoordinate推断）
    // 这里我们添加一个简单的点
    gpx += `
      <trkpt lat="0" lon="0">
        <time>${startDate.toISOString()}</time>
      </trkpt>`;
  }

  gpx += `
    </trkseg>
  </trk>
</gpx>`;

  return gpx;
}

/**
 * 转义XML特殊字符
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 从坐标字符串解析坐标
 * 格式: "lat,lng" 或 "{lat: number, lng: number}"
 */
export function parseCoordinate(coord: string | { lat: number; lng: number }): { lat: number; lng: number } | null {
  if (typeof coord === 'object' && coord !== null) {
    return { lat: coord.lat, lng: coord.lng };
  }
  
  if (typeof coord === 'string') {
    const parts = coord.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  
  return null;
}

