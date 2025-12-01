import { NextResponse } from "next/server";
import { listObjectsByPrefix, getObjectMetadata, getCdnBaseUrl } from "@/app/lib/r2";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const prefix = `animations/${userId}/`;

    const result = await listObjectsByPrefix(prefix);
    const contents = (result.Contents || []).filter((obj) => !!obj.Key);
    if (contents.length === 0) {
      return NextResponse.json({ animations: [] }, { status: 200 });
    }

    const [latest] = contents.sort((a, b) => {
      const aTime = a.LastModified ? new Date(a.LastModified).getTime() : 0;
      const bTime = b.LastModified ? new Date(b.LastModified).getTime() : 0;
      return bTime - aTime;
    });

    const key = latest.Key as string;

    let speed = 1;
    try {
      const metadata = await getObjectMetadata(key);
      const storedSpeed = metadata.Metadata?.speed;
      if (storedSpeed) {
        const parsed = Number(storedSpeed);
        if (!Number.isNaN(parsed) && parsed > 0) {
          speed = parsed;
        }
      }
    } catch (metaErr) {
      console.warn(`获取对象 ${key} 元数据失败:`, metaErr);
    }

    const animations = [
      {
        key,
        url: `${getCdnBaseUrl()}/${key}`,
        speed,
        lastModified: latest.LastModified,
        size: latest.Size,
      },
    ];

    return NextResponse.json({ animations }, { status: 200 });
  } catch (err: any) {
    console.error("加载动图失败:", err);
    return NextResponse.json({ error: err.message || "加载失败" }, { status: 500 });
  }
}


