import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.R2_ACCOUNT_ID
  ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const cdnUrl = process.env.CDN_URL;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error("Missing required R2 credentials/environment variables.");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export function getR2BucketName(): string {
  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME is not configured.");
  }
  return bucketName;
}

export function getCdnBaseUrl(): string {
  if (!cdnUrl) {
    throw new Error("CDN_URL is not configured.");
  }
  return cdnUrl;
}

export function buildUserSlotKey(userId: string, slotIndex: string | number, ext = "jpg") {
  const safeExt = ext.replace(/^\./, "") || "jpg";
  return `uploads/${userId}/slot-${slotIndex}.${safeExt}`;
}

export async function uploadToR2(buffer: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
}

export async function deleteFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
  });

  await r2Client.send(command);
}

export async function listObjectsByPrefix(prefix: string): Promise<ListObjectsV2CommandOutput> {
  const command = new ListObjectsV2Command({
    Bucket: getR2BucketName(),
    Prefix: prefix,
  });

  return r2Client.send(command);
}


