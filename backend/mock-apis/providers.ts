import { STORAGE_SILOES } from "../storage-siloes";
import { createHash } from "crypto";

export interface StorageProvider {
  upload(key: string, data: Buffer): Promise<{ etag: string; latency: number }>;
  download(key: string): Promise<{ data: Buffer; latency: number }>;
  delete(key: string): Promise<{ success: boolean; latency: number }>;
}

const storageMap = new Map<string, { data: Buffer; metadata: any }>();

const simulateDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const generateETag = (data: Buffer): string =>
  `"${createHash("md5").update(data).digest("hex")}"`;

export const awsS3Provider: StorageProvider = {
  upload: async (key, data) => {
    await simulateDelay(STORAGE_SILOES["aws-s3-vanilla"]!.avgLatencyMs);

    const etag = generateETag(data);
    storageMap.set(key, {
      data,
      metadata: { etag, size: data.length, lastModified: new Date() },
    });

    return { etag, latency: STORAGE_SILOES["aws-s3-vanilla"]!.avgLatencyMs };
  },

  download: async (key) => {
    await simulateDelay(STORAGE_SILOES["aws-s3-vanilla"]!.avgLatencyMs);

    const item = storageMap.get(key);
    if (!item) throw new Error("NoSuchKey: The specified key does not exist");

    return {
      data: item.data,
      latency: STORAGE_SILOES["aws-s3-vanilla"]!.avgLatencyMs,
    };
  },

  delete: async (key) => {
    await simulateDelay(STORAGE_SILOES["aws-s3-vanilla"]!.avgLatencyMs);
    const success = storageMap.delete(key);
    return { success, latency: STORAGE_SILOES["aws-s3-vanilla"]!.avgLatencyMs };
  },
};

export const cloudflareR2Provider: StorageProvider = {
  upload: async (key, data) => {
    await simulateDelay(STORAGE_SILOES["cloudflare-r2"]!.avgLatencyMs);

    const etag = generateETag(data);
    storageMap.set(key, {
      data,
      metadata: { etag, size: data.length, lastModified: new Date() },
    });

    return { etag, latency: STORAGE_SILOES["cloudflare-r2"]!.avgLatencyMs };
  },

  download: async (key) => {
    await simulateDelay(STORAGE_SILOES["cloudflare-r2"]!.avgLatencyMs);

    const item = storageMap.get(key);
    if (!item) throw new Error("Object not found");

    return {
      data: item.data,
      latency: STORAGE_SILOES["cloudflare-r2"]!.avgLatencyMs,
    };
  },

  delete: async (key) => {
    await simulateDelay(STORAGE_SILOES["cloudflare-r2"]!.avgLatencyMs);
    const success = storageMap.delete(key);
    return { success, latency: STORAGE_SILOES["cloudflare-r2"]!.avgLatencyMs };
  },
};

export const awsGlacierProvider: StorageProvider = {
  upload: async (key, data) => {
    await simulateDelay(5000);

    const etag = generateETag(data);
    storageMap.set(key, {
      data,
      metadata: { etag, size: data.length, lastModified: new Date() },
    });

    return { etag, latency: 5000 };
  },

  download: async (key) => {
    const item = storageMap.get(key);
    if (!item) throw new Error("Object not found");

    await simulateDelay(STORAGE_SILOES["aws-glacier"]!.avgLatencyMs);

    return {
      data: item.data,
      latency: STORAGE_SILOES["aws-glacier"]!.avgLatencyMs,
    };
  },

  delete: async (key) => {
    await simulateDelay(STORAGE_SILOES["aws-glacier"]!.avgLatencyMs);
    const success = storageMap.delete(key);
    return { success, latency: STORAGE_SILOES["aws-glacier"]!.avgLatencyMs };
  },
};

export const minioProvider: StorageProvider = {
  upload: async (key, data) => {
    await simulateDelay(STORAGE_SILOES["minio-on-prem"]!.avgLatencyMs);

    const etag = generateETag(data);
    storageMap.set(key, {
      data,
      metadata: { etag, size: data.length, lastModified: new Date() },
    });

    return { etag, latency: STORAGE_SILOES["minio-on-prem"]!.avgLatencyMs };
  },

  download: async (key) => {
    await simulateDelay(STORAGE_SILOES["minio-on-prem"]!.avgLatencyMs);

    const item = storageMap.get(key);
    if (!item) throw new Error("Object not found");

    return {
      data: item.data,
      latency: STORAGE_SILOES["minio-on-prem"]!.avgLatencyMs,
    };
  },

  delete: async (key) => {
    await simulateDelay(STORAGE_SILOES["minio-on-prem"]!.avgLatencyMs);
    const success = storageMap.delete(key);
    return { success, latency: STORAGE_SILOES["minio-on-prem"]!.avgLatencyMs };
  },
};
