// AWS S3 storage implementation using user's own AWS credentials
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "compawnion-approval-forms";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  // Convert data to Buffer if it's a string
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    
    // Generate a signed URL for accessing the file (valid for 1 hour)
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    
    return { key, url };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function storageGet(
  relKey: string,
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { key, url };
  } catch (error) {
    console.error("S3 get URL error:", error);
    throw new Error(`Failed to generate S3 URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
