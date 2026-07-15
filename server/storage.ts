import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";

const containerName =
  process.env.AZURE_STORAGE_CONTAINER || "finance-attachments";
const SAS_CLOCK_SKEW_MS = 5 * 60 * 1000;

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "");
}

/**
 * Extract an Azure Blob object key from a legacy stored SAS URL. New records
 * persist the key directly, but this keeps previously uploaded files usable.
 */
export function storageKeyFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const prefix = `/${encodeURIComponent(containerName)}/`;
    if (!path.startsWith(prefix)) return null;
    return normalizeKey(decodeURIComponent(path.slice(prefix.length)));
  } catch {
    return null;
  }
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
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Azure Blob SAS expiry must be a positive number of seconds.");
  }

  const blob = getContainerClient().getBlobClient(key);
  const now = Date.now();
  return blob.generateSasUrl({
    permissions: BlobSASPermissions.parse("r"),
    // Allow a small clock-skew window between Vercel and Azure. Without it,
    // Azure can reject a freshly issued SAS when their clocks differ slightly.
    startsOn: new Date(now - SAS_CLOCK_SKEW_MS),
    expiresOn: new Date(now + expiresIn * 1000),
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
