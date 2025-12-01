import { NextResponse } from "next/server";
import { listObjectsByPrefix, getCdnBaseUrl, getR2BucketName } from "@/app/lib/r2";

// 打印 S3 客户端配置概览 (不包含密钥)
console.log("🛠️ S3客户端配置概览:");
console.log(`区域 (Region): auto`);
console.log(`端点 (Endpoint): https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
console.log(`存储桶名称 (Bucket Name): ${process.env.R2_BUCKET_NAME}`);
console.log(`CDN 网址 (CDN URL): ${process.env.CDN_URL}`);
console.log("---");
// 加载指定用户的所有图片
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    // 1. 打印接收到的 userId
    console.log(`✅ 接收到 POST 请求。`);
    console.log(`👉 提取到的 userId: ${userId}`);

    if (!userId) {
      console.error("❌ 缺少 userId 参数。返回状态码 400。");
      return NextResponse.json({ error: "缺少 userId 参数" }, { status: 400 });
    }

    const prefix = `uploads/${userId}/`;
    const Bucket = getR2BucketName();

    // 3. 打印 ListObjectsV2Command 参数
    console.log(`🔎 准备列出对象，参数如下:`);
    console.log(`   存储桶 (Bucket): ${Bucket}`);
    console.log(`   前缀 (Prefix): ${prefix}`);
    
    // 发送命令
    const result = await listObjectsByPrefix(prefix);

    // 4. 打印 R2 响应概览
    const contents = result.Contents || [];
    console.log(`✨ 已收到 R2 响应。`);
    console.log(`   找到的总对象数 (过滤前): ${contents.length}`);
    console.log(`   是否被截断 (IsTruncated，需要分页): ${result.IsTruncated}`);
    console.log("---");


    const images = contents
      .filter((obj) => !!obj.Key)
      .map((obj, index) => {
        const key = obj.Key as string;
        const url = `${getCdnBaseUrl()}/${key}`;
        const fileName = key.replace(prefix, ""); // 例如：slot-3.jpg
        const match = fileName.match(/^slot-(\d+)\./);
        let slotIndex: string | null = null;
        
        if (match) {
          slotIndex = match[1];
        }

        // 5. 打印单个对象信息
        console.log(`🖼️ 对象 ${index + 1} 详情:`);
        console.log(`   键名 (Key): ${key}`);
        console.log(`   完整 URL: ${url}`);
        console.log(`   文件名 (相对路径): ${fileName}`);
        console.log(`   解析出的 Slot 索引: ${slotIndex}`);
        console.log(`   大小 (Size): ${obj.Size} 字节`);
        
        return {
          key,
          url,
          slotIndex,
          lastModified: obj.LastModified,
          size: obj.Size,
        };
      });
      
    console.log(`👍 成功处理了 ${images.length} 条图片记录。返回状态码 200。`);

    return NextResponse.json({ images }, { status: 200 });
  } catch (err: any) {
    // 6. 打印更详细的错误信息
    console.error("🔥 POST 处理器中发生错误:");
    // 打印整个错误对象，以便查看堆栈跟踪和特定错误代码
    console.error(err); 
    console.log(`   错误消息 (Error Message): ${err.message}`);
    console.log(`   错误名称 (Error Name): ${err.name}`); 

    return NextResponse.json({ error: err.message || "加载失败" }, { status: 500 });
  }
}