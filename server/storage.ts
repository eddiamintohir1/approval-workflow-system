import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";

const containerName =
  process.env.AZURE_STORAGE_CONTAINER || "finance-attachments";

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "");
}

function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "Azure Blob Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING."
    );
  }

  return BlobServiceClient.fromConnectionString(
    connectionString
  ).getContainerClient(containerName);
}

async function signedReadUrl(key: string, expiresIn: number) {
  const blob = getContainerClient().getBlobClient(key);
  return blob.generateSasUrl({
    permissions: BlobSASPermissions.parse("r"),
    expiresOn: new Date(Date.now() + expiresIn * 1000),
  });
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const buffer =
    typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  try {
    const blob = getContainerClient().getBlockBlobClient(key);
    await blob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return { key, url: await signedReadUrl(key, 3600) };
  } catch (error) {
    console.error("Azure Blob upload failed", error);
    throw new Error(
      `Failed to upload file to Azure Blob Storage: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  try {
    return { key, url: await signedReadUrl(key, expiresIn) };
  } catch (error) {
    console.error("Azure Blob signed URL failed", error);
    throw new Error(
      `Failed to access Azure Blob Storage: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Download file content as Buffer from Azure Blob Storage
 * Used for server-side operations like workbook generation
 */
export async function storageDownload(relKey: string): Promise<Buffer> {
  const key = normalizeKey(relKey);

  try {
    const blob = getContainerClient().getBlobClient(key);
    const downloadBlockBlobResponse = await blob.download();

    if (!downloadBlockBlobResponse.readableStreamBody) {
      throw new Error("No stream body in download response");
    }

    const chunks: Buffer[] = [];
    for await (const chunk of downloadBlockBlobResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Azure Blob download failed", error);
    throw new Error(
      `Failed to download file from Azure Blob Storage: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
