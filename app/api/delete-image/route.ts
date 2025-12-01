import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function deleteFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });
  await client.send(command);
}

// 接受前端 userId + slotIndex，删除指定图片
export async function POST(req: Request) {
  try {
    const { userId, slotIndex } = await req.json();

    if (!userId || !slotIndex) {
      return NextResponse.json({ error: "缺少 userId 或 slotIndex 参数" }, { status: 400 });
    }

    const key = `uploads/${userId}/slot-${slotIndex}.jpg`;

    await deleteFromR2(key);

    return NextResponse.json({ message: "图片删除成功" }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}


