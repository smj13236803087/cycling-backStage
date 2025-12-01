import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

// 上传到 R2 的函数
async function uploadToR2(buffer: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await client.send(command);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const slotIndex = formData.get("slotIndex") as string; // 1~7
    const file = formData.get("file") as File;

    if (!userId || !slotIndex || !file) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `slot-${slotIndex}.${ext}`;
    const key = `uploads/${userId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadToR2(buffer, key, file.type);

    return NextResponse.json({
      url: `${process.env.CDN_URL}/${key}`,
      key,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "上传失败" }, { status: 500 });
  }
}

